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
    public function getSchema(Request $request)
    {
        // Security Check: Ensure only super admins can access
        // if (!$request->user()->isSuperAdmin()) abort(403);

        $tables = $this->getAllTables();
        $schema = [];

        foreach ($tables as $table) {
            $tableName = $table->name;
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
                'host' => env('DB_HOST', '127.0.0.1'),
                'database' => env('DB_DATABASE'),
                'username' => env('DB_USERNAME'),
            ],
            'schema' => $schema
        ]);
    }

    private function getAllTables()
    {
        // MySQL specific
        return DB::select('SHOW TABLES'); 
        // Note: The specific output property name depends on DB config, usually is "Tables_in_dbname"
        // We will normalize this in the loop or use a more robust doctrine method if available
    }

    private function getTableColumns($table)
    {
        // Use Laravel Schema Builder
        $columns = Schema::getColumnListing($table);
        $details = [];
        
        foreach ($columns as $col) {
            $type = Schema::getColumnType($table, $col);
            // Check for Primary Key (Simple check)
            // A more robust way is using raw SQL or Doctrine
            $isPrimary = $col === 'id' || $col === 'ID'; // Simplification for now
            
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
        $dbName = env('DB_DATABASE', 'resortwala');
        
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
            if (in_array('id', $columns)) {
                $query->orderBy('id', 'desc');
            } else {
                $query->orderBy($columns[0], 'desc');
            }
        }

        // Search/Filter (Simple text search across all cols for now)
        if ($request->has('search') && $request->search) {
            $term = $request->search;
            $query->where(function($q) use ($table, $term) {
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
        if (!$this->isValidTable($table)) {
            return response()->json(['error' => 'Invalid table'], 400);
        }

        // Security: ID column validation
        // Assuming 'id' is the primary key for generic updates. 
        // For production, we should detect the PK dynamically.
        
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
            
            // 1. Audit Log (Before Update)
            $oldData = DB::table($table)->where('id', $id)->first();
            
            // 2. Perform Update
            DB::table($table)->where('id', $id)->update($updates);

            // 3. Log Audit
            DB::table('user_events')->insert([
                'user_id' => $request->user()->id,
                'event_type' => 'intelligence_db_update',
                'event_category' => 'admin_action',
                'event_data' => json_encode([
                    'table' => $table,
                    'row_id' => $id,
                    'old' => $oldData,
                    'new' => $updates
                ]),
                'context' => json_encode(['ip' => $request->ip()]),
                'created_at' => now(),
                'updated_at' => now()
            ]);

            DB::commit();

            return response()->json(['success' => true, 'message' => 'Record updated successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    private function isValidTable($table)
    {
        $tables = simplexml_load_string(json_encode(DB::select('SHOW TABLES')), 'SimpleXMLElement', LIBXML_NOCDATA);
        // DB::select returns array of objects, verify if table exists in schema
        return Schema::hasTable($table); 
    }
}
