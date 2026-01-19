<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        if (!$request->user()) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if (!$request->user()->is_active) {
            return response()->json(['message' => 'Account is inactive.'], 403);
        }

        // Developers bypass all checks (failsafe)
        if ($request->user()->hasRole('Developer')) {
             return $next($request);
        }

        if (!$request->user()->can($permission)) {
            // Log unauthorized attempt here? (Optional, handled by AuditLogger mostly)
            return response()->json([
                'message' => 'Unauthorized. You do not have permission: ' . $permission
            ], 403);
        }

        return $next($request);
    }
}
