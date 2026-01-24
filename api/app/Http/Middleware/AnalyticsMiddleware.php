<?php

namespace App\Http\Middleware;

use Closure;
use App\Models\EventLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class AnalyticsMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $startTime = microtime(true);
        $response = $next($request);
        $endTime = microtime(true);

        // Don't log basic GET requests for static assets or simple checks unless needed
        // For now, let's log everything except the log endpoint itself to avoid loops
        if ($request->is('api/analytics/track')) {
            return $response;
        }

        try {
            $user = Auth::user();
            $duration = round(($endTime - $startTime) * 1000); // ms

            // Determine event name based on route
            $event_name = $request->route() ? $request->route()->getName() : $request->path();

            // EventLog::create([
            //     'event_name' => $event_name ?: 'api_request',
            //     'event_category' => $this->getCategory($request),
            //     'user_id' => $user ? $user->id : null,
            //     'role' => $user ? $user->role : 'guest',
            //     'session_id' => $request->header('X-Session-ID') ?: $request->cookie('laravel_session'),
            //     'action' => $request->method(),
            //     'screen_name' => $request->path(),
            //     'ip_address' => $request->ip(),
            //     'user_agent' => $request->userAgent(),
            //     'response_time' => $duration,
            //     'status' => $response->isSuccessful() ? 'success' : 'fail',
            //     'error_code' => $response->isSuccessful() ? null : $response->getStatusCode(),
            //     'metadata' => [
            //         'url' => $request->fullUrl(),
            //         'params' => $request->except(['password', 'password_confirmation']),
            //     ]
            // ]);
        } catch (\Exception $e) {
            // Silence analytics errors to not break the app
            \Illuminate\Support\Facades\Log::error('Analytics logging failed: ' . $e->getMessage());
        }

        return $response;
    }

    private function getCategory(Request $request)
    {
        if (str_contains($request->path(), 'admin'))
            return 'admin';
        if (str_contains($request->path(), 'vendor'))
            return 'vendor';
        return 'customer';
    }
}
