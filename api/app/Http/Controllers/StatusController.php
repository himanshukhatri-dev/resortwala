<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class StatusController extends Controller
{
    public function check()
    {
        $status = [
            'app' => 'online',
            'server_time' => now()->toIso8601String(),
            'database' => 'unknown',
            'cache' => 'unknown',
            'environment' => app()->environment(),
        ];

        // Check Database
        try {
            $pdo = DB::connection()->getPdo();
            $status['database'] = 'connected';
            $status['db_host'] = config('database.connections.mysql.host');
            $status['db_database'] = config('database.connections.mysql.database');
        } catch (\Exception $e) {
            $status['database'] = 'error';
            $status['db_error'] = $e->getMessage();
        }

        // Check Cache
        try {
            Cache::put('status_check', 'ok', 10);
            if (Cache::get('status_check') === 'ok') {
                $status['cache'] = 'working';
            } else {
                $status['cache'] = 'failed_read';
            }
        } catch (\Exception $e) {
            $status['cache'] = 'error';
            $status['cache_error'] = $e->getMessage();
        }

        $statusCode = ($status['database'] === 'connected') ? 200 : 500;

        return response()->json($status, $statusCode);
    }
}
