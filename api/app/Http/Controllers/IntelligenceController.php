<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use App\Models\ActionLog; // Assuming this exists or we use DB directly

class IntelligenceController extends Controller
{
    /**
     * Get Database Schema (Tables, Columns, Foreign Keys)
     */
    public function getSchema()
    {
        $tables = DB::select('SHOW TABLES');
        $schema = [];
        $databaseName = env('DB_DATABASE', 'resortwala');
        $keyName = "Tables_in_" . $databaseName;

        foreach ($tables as $table) {
            $tableName = $table->$keyName ?? array_values((array)$table)[0];
            
            $columns = DB::select("SHOW COLUMNS FROM `$tableName`");
            $fks = DB::select("
                SELECT 
                    COLUMN_NAME, 
                    REFERENCED_TABLE_NAME, 
                    REFERENCED_COLUMN_NAME 
                FROM 
                    INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                WHERE 
                    TABLE_SCHEMA = ? 
                    AND TABLE_NAME = ? 
                    AND REFERENCED_TABLE_NAME IS NOT NULL
            ", [$databaseName, $tableName]);

            $schema[$tableName] = [
                'columns' => $columns,
                'relationships' => $fks
            ];
        }

        return response()->json($schema);
    }

    /**
     * Get All Registered API Routes
     */
    public function getRoutes()
    {
        $routes = Route::getRoutes();
        $apiRoutes = [];

        foreach ($routes as $route) {
            if (str_starts_with($route->uri(), 'api')) {
                $apiRoutes[] = [
                    'method' => implode('|', $route->methods()),
                    'uri' => $route->uri(),
                    'action' => $route->getActionName(),
                    'middleware' => $route->gatherMiddleware()
                ];
            }
        }

        return response()->json($apiRoutes);
    }

    /**
     * Get Recent System Logs
     */
    public function getLogs()
    {
        try {
            // Assuming 'admin_event_logs' exists, else return empty
            // Create this table if not exists or use a file log reader
            $logs = DB::table('admin_event_logs')
                ->latest()
                ->limit(100)
                ->get();
            return response()->json($logs);
        } catch (\Exception $e) {
            return response()->json([]);
        }
    }

    /**
     * Get Data from a specific table (with pagination/search)
     */
    /**
     * Get Data from a specific table (with pagination/search)
     */
    public function getData(Request $request, $table)
    {
        if (!$this->isTableAllowed($table)) {
            return response()->json(['error' => 'Access denied to this table'], 403);
        }

        try {
            $query = DB::table($table);
            $columns = Schema::getColumnListing($table);
            $pk = in_array('PropertyId', $columns) ? 'PropertyId' : (in_array('id', $columns) ? 'id' : $columns[0]);

            if ($request->has('search') && !empty($request->search)) {
                $query->where(function ($q) use ($columns, $request) {
                    foreach ($columns as $col) {
                        $q->orWhere($col, 'LIKE', '%' . $request->search . '%');
                    }
                });
            }

            $data = $query->orderBy($pk, 'desc')->limit(100)->get();
            return response()->json(['data' => $data, 'pk' => $pk]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Update a specific record
     */
    public function updateData(Request $request, $table, $id)
    {
        if (!$this->isTableAllowed($table)) {
            return response()->json(['error' => 'Access denied to this table'], 403);
        }

        try {
            $columns = Schema::getColumnListing($table);
            $pk = in_array('PropertyId', $columns) ? 'PropertyId' : (in_array('id', $columns) ? 'id' : $columns[0]);

            $updateData = $request->except(['id', 'PropertyId', 'created_at', 'updated_at']); // Protect meta fields
            
            DB::table($table)->where($pk, $id)->update($updateData);
            
            // Log the impact
            try {
                 DB::table('admin_event_logs')->insert([
                     'admin_id' => auth()->id() ?? 0,
                     'action' => 'UPDATE',
                     'target_type' => $table,
                     'target_id' => $id,
                     'details' => json_encode($updateData),
                     'created_at' => now(),
                     'updated_at' => now()
                 ]);
            } catch (\Exception $e) {}

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    private function isTableAllowed($table)
    {
        // Blacklist critical/system tables
        $blacklist = ['migrations', 'failed_jobs', 'password_reset_tokens', 'personal_access_tokens', 'sessions'];
        return !in_array($table, $blacklist);
    }
}
