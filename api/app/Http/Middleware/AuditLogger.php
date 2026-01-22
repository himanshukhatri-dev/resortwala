<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\DB;

class AuditLogger
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string $actionType = 'access'): Response
    {
        $response = $next($request);

        // Only log logged-in user actions
        if ($user = $request->user()) {

            // Fix: Check if user is actually a backend User (Admin/Vendor)
            // Customers (App\Models\Customer) should not be logged in 'audit_logs' which has FK to 'users' table
            if (!($user instanceof \App\Models\User)) {
                return $response;
            }

            // Determine module from route path segment
            // e.g., api/admin/properties -> module: properties
            $path = $request->path();
            $segments = explode('/', $path);
            $module = isset($segments[2]) ? $segments[2] : 'system';

            $payload = null;
            if ($request->isMethod('post') || $request->isMethod('put')) {
                $payload = json_encode($request->except(['password', 'password_confirmation']));
            }

            // Async insert to avoid performance hit? 
            // For now, direct DB insert is fine for Admin actions volume.

            DB::table('audit_logs')->insert([
                'user_id' => $user->id,
                'action' => $actionType . ':' . $request->method(),
                'module' => $module,
                'target_id' => $request->route('id'), // Try to capture ID if present
                'payload' => $payload,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return $response;
    }
}
