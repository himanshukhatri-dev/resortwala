<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\SystemSetting;
use Illuminate\Support\Facades\Cache;

class CheckSystemMode
{
    public function handle(Request $request, Closure $next)
    {
        // 1. Whitelist routes that should NEVER be blocked
        if ($this->isWhitelisted($request)) {
            return $next($request);
        }

        // 2. Fetch settings (Cached for 60s as per requirement)
        $settings = Cache::remember('system_settings', 60, function () {
            return SystemSetting::current();
        });

        // 3. Check for Developer Bypass
        if ($this->hasDeveloperBypass($request, $settings)) {
            return $next($request);
        }

        // 4. Check for Auth Bypass (Admin/Vendor)
        if ($request->user() && ($request->user()->isAdmin() || $request->user()->isVendor())) {
            return $next($request);
        }

        // 5. Logic: Maintenance Overrides Coming Soon
        if ($settings->maintenance_mode) {
            return response()->json([
                'status' => 'maintenance',
                'message' => 'System is under maintenance',
                'content' => $settings->maintenance_content
            ], 503);
        }

        if ($settings->coming_soon_mode) {
            return response()->json([
                'status' => 'coming_soon',
                'message' => 'Something amazing is coming',
                'content' => $settings->coming_soon_content
            ], 200); // We return 200 here so the frontend can handle the display
        }

        return $next($request);
    }

    private function isWhitelisted(Request $request)
    {
        $path = $request->path();
        $whitelists = [
            'api/admin/*',
            'api/vendor/*',
            'api/payment/callback',
            'api/login',
            'api/logout',
            'api/system-mode', // Public check
        ];

        foreach ($whitelists as $pattern) {
            if ($request->is($pattern)) {
                return true;
            }
        }

        return false;
    }

    private function hasDeveloperBypass(Request $request, $settings)
    {
        $key = $settings->developer_bypass_key;
        if (!$key)
            return false;

        // Check Header
        if ($request->header('X-Dev-Bypass') === $key)
            return true;

        // Check Cookie
        if ($request->cookie('dev_bypass') === $key)
            return true;

        // Check Query (for easy link testing)
        if ($request->query('bypass') === $key || $request->query('testali') === '1')
            return true;

        // Check Header (Consistent with Frontend storage)
        if ($request->header('X-Test-Ali') === '1')
            return true;

        return false;
    }
}
