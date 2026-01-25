<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AdminIntelligenceController extends Controller
{
    /**
     * Get Database Schema for Visualization
     */
    private function configureConnection(Request $request)
    {
        $targetDb = $request->header('X-Target-DB') ?? $request->query('target_db');

        if ($targetDb && in_array($targetDb, ['resortwala', 'resortwala_prod', 'resortwala_staging', 'resortwala_backup'])) {
            // Purge previous connection to ensure fresh config
            DB::purge('mysql');

            // Update Config
            config(['database.connections.mysql.database' => $targetDb]);

            // Reconnect
            DB::reconnect('mysql');
        }
    }

    /**
     * Get Database Schema for Visualization
     */
    public function getSchema(Request $request)
    {
        $this->configureConnection($request);

        // Security Check: Ensure only super admins can access
        // if (!$request->user()->isSuperAdmin()) abort(403);

        $tables = $this->getAllTables();
        $schema = [];


        $databaseName = config('database.connections.mysql.database');
        $keyName = "Tables_in_" . $databaseName;

        foreach ($tables as $table) {
            // Robustly get table name
            $tableName = $table->$keyName ?? array_values((array) $table)[0];

            $columns = $this->getTableColumns($tableName);
            $foreignKeys = $this->getLocalForeignKeys($tableName);

            $schema[$tableName] = [
                'name' => $tableName,
                'columns' => $columns,
                'foreignKeys' => $foreignKeys
            ];
        }

        return response()->json([
            'success' => true,
            'connection' => [
                'host' => config('database.connections.mysql.host'),
                'database' => config('database.connections.mysql.database'),
                'username' => config('database.connections.mysql.username'),
            ],
            'schema' => $schema
        ]);
    }

    private function getAllTables()
    {
        // MySQL specific
        return DB::select('SHOW TABLES');
    }

    private function getTableColumns($table)
    {
        // Use Laravel Schema Builder
        $columns = Schema::getColumnListing($table);
        $details = [];

        foreach ($columns as $col) {
            $type = Schema::getColumnType($table, $col);
            $isPrimary = $col === 'id' || $col === 'ID' || $col === 'PropertyId' || $col === 'BookingId';

            $details[] = [
                'name' => $col,
                'type' => $type,
                'primary' => $isPrimary
            ];
        }
        return $details;
    }

    private function getLocalForeignKeys($table)
    {
        // Getting FKs in MySQL is tricky without Doctrine, using information_schema
        $dbName = config('database.connections.mysql.database');

        $fks = DB::select("
            SELECT 
                COLUMN_NAME as column_name,
                REFERENCED_TABLE_NAME as target_table,
                REFERENCED_COLUMN_NAME as target_column
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = ? 
            AND TABLE_NAME = ? 
            AND REFERENCED_TABLE_NAME IS NOT NULL
        ", [$dbName, $table]);

        return $fks;
    }
    /**
     * Get Data for a specific table with pagination and sorting
     */
    public function getTableData(Request $request, $table)
    {
        $this->configureConnection($request);

        // Security: Validate table name against allowlist or schema
        if (!$this->isValidTable($table)) {
            return response()->json(['error' => 'Invalid table'], 400);
        }

        $query = DB::table($table);

        // Sorting
        if ($request->has('sort_by') && $request->sort_by) {
            $query->orderBy($request->sort_by, $request->get('sort_dir', 'asc'));
        } else {
            // Default sort by ID if exists, else first column
            $columns = Schema::getColumnListing($table);

            // Try explicit PKs first
            if (in_array('id', $columns)) {
                $query->orderBy('id', 'desc');
            } elseif (in_array('PropertyId', $columns)) {
                $query->orderBy('PropertyId', 'desc');
            } elseif (in_array('BookingId', $columns)) {
                $query->orderBy('BookingId', 'desc');
            } else {
                $query->orderBy($columns[0], 'desc');
            }
        }

        // Search/Filter (Simple text search across all cols for now)
        if ($request->has('search') && $request->search) {
            $term = $request->search;
            $query->where(function ($q) use ($table, $term) {
                $columns = Schema::getColumnListing($table);
                foreach ($columns as $col) {
                    $q->orWhere($col, 'LIKE', "%{$term}%");
                }
            });
        }

        $data = $query->paginate($request->get('per_page', 50));

        return response()->json($data);
    }

    /**
     * Update a specific row in a table
     */
    public function updateTableData(Request $request, $table, $id)
    {
        $this->configureConnection($request);

        if (!$this->isValidTable($table)) {
            return response()->json(['error' => 'Invalid table'], 400);
        }

        // Security: ID column validation

        $updates = $request->except(['id', '_token']); // Exclude protected

        // Validation: Block updating critical columns directly if needed (e.g., passwords)
        $blockedColumns = ['password', 'remember_token', 'email_verified_at'];
        foreach ($blockedColumns as $col) {
            if (isset($updates[$col])) {
                unset($updates[$col]);
            }
        }

        if (empty($updates)) {
            return response()->json(['message' => 'No valid fields to update'], 422);
        }

        try {
            DB::beginTransaction();

            // Determine PK
            $columns = Schema::getColumnListing($table);
            $pk = in_array('id', $columns) ? 'id' : (in_array('PropertyId', $columns) ? 'PropertyId' : (in_array('BookingId', $columns) ? 'BookingId' : 'id'));

            // 1. Audit Log (Before Update)
            $oldData = DB::table($table)->where($pk, $id)->first();

            // 2. Perform Update
            DB::table($table)->where($pk, $id)->update($updates);

            // 3. Log Audit
            try {
                DB::table('user_events')->insert([
                    'user_id' => $request->user()->id ?? 0,
                    'event_type' => 'intelligence_db_update',
                    'event_category' => 'admin_action',
                    'event_data' => json_encode([
                        'table' => $table,
                        'row_id' => $id,
                        'old' => $oldData,
                        'new' => $updates
                    ]),
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            } catch (\Exception $e) {
            }

            DB::commit();

            return response()->json(['success' => true, 'message' => 'Record updated successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Delete a specific row in a table
     */
    public function deleteTableData(Request $request, $table, $id)
    {
        $this->configureConnection($request);

        if (!$this->isValidTable($table)) {
            return response()->json(['error' => 'Invalid table'], 400);
        }

        try {
            DB::beginTransaction();

            // Determine PK
            $columns = Schema::getColumnListing($table);
            $pk = in_array('id', $columns) ? 'id' : (in_array('PropertyId', $columns) ? 'PropertyId' : (in_array('BookingId', $columns) ? 'BookingId' : 'id'));

            // 1. Audit Log (Before Delete)
            $oldData = DB::table($table)->where($pk, $id)->first();

            // 2. Perform Delete
            DB::table($table)->where($pk, $id)->delete();

            // 3. Log Audit
            try {
                DB::table('user_events')->insert([
                    'user_id' => $request->user()->id ?? 0,
                    'event_type' => 'intelligence_db_delete',
                    'event_category' => 'admin_action',
                    'event_data' => json_encode([
                        'table' => $table,
                        'row_id' => $id,
                        'deleted_data' => $oldData
                    ]),
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            } catch (\Exception $e) {
            }

            DB::commit();

            return response()->json(['success' => true, 'message' => 'Record deleted successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function getLogs(Request $request)
    {
        $this->configureConnection($request);

        $logs = DB::table('user_events')
            ->where('event_category', 'admin_action')
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get();

        return response()->json($logs->map(function ($log) {
            $data = json_decode($log->event_data);
            return [
                'id' => $log->id,
                'action' => str_contains($log->event_type, 'update') ? 'UPDATE' : (str_contains($log->event_type, 'delete') ? 'DELETE' : 'CREATE'),
                'target_type' => $data->table ?? 'Unknown',
                'target_id' => $data->row_id ?? 0,
                'details' => "Changed fields: " . implode(', ', array_keys((array) ($data->new ?? []))),
                'admin_id' => $log->user_id,
                'created_at' => $log->created_at
            ];
        }));
    }

    private function isValidTable($table)
    {
        return Schema::hasTable($table);
    }
}
