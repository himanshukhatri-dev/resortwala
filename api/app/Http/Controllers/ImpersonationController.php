<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;

class ImpersonationController extends Controller
{
    public function impersonate(Request $request, $userId)
    {
        // 1. Verify Requesting User is Admin
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Only admins can impersonate.'], 403);
        }

        $type = $request->query('type', 'user'); // 'user' (admin/vendor) or 'customer'

        // 2. Find Target User
        $targetUser = null;
        if ($type === 'customer') {
            $targetUser = \App\Models\Customer::find($userId);
            if (!$targetUser) {
                // Fallback: Check if customer exists in generic User table (sometimes added via admin panel as User model)
                $targetUser = User::where('id', $userId)->where('role', 'customer')->first();
            }
        } else {
            $targetUser = User::find($userId);
        }

        if (!$targetUser) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        // 3. Generate New Token for Target User
        $token = $targetUser->createToken('ImpersonationToken: ' . $request->user()->id)->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $targetUser,
            'redirect_url' => $this->getRedirectUrlForUser($targetUser, $type)
        ]);
    }

    private function getRedirectUrlForUser($user, $type = 'user')
    {
        // Dynamic URL resolution based on current request host
        $host = request()->getHost();
        $scheme = request()->getScheme();
        
        // Check if we are on Staging (Subdomains)
        if (str_contains($host, 'staging') || str_contains($host, 'resortwala.com')) {
            // Staging / Production Logic
            $baseDomain = 'resortwala.com';
            
            // If strictly Staging
            $prefix = str_contains($host, 'staging') ? 'staging' : '';

            if ($type === 'customer') {
                return $scheme . '://' . ($prefix ? $prefix . '.' : 'www.') . $baseDomain;
            }

            if ($user->role === 'admin') {
                return $scheme . '://' . ($prefix ? $prefix . 'admin.' : 'admin.') . $baseDomain;
            }
            
            if ($user->role === 'vendor' || $user->vendor_type) {
                return $scheme . '://' . ($prefix ? $prefix . 'vendor.' : 'vendor.') . $baseDomain;
            }
        }

        // Check if accessing via Public IP (Path-based routing) - Generalize for any IP if needed, or remove specific IP check
        // Assuming we want to support any host that isn't caught by the domain logic above
        if (filter_var($host, FILTER_VALIDATE_IP)) {
             if ($type === 'customer') {
                return $scheme . '://' . $host . '/';
            }

            if ($user->role === 'admin') {
                return $scheme . '://' . $host . '/admin';
            }
            
            if ($user->role === 'vendor' || $user->vendor_type) {
                return $scheme . '://' . $host . '/vendor';
            }
        }

        // Fallback for Localhost / Development (using Env or Defaults)
        if ($type === 'customer') {
            return env('FRONTEND_CUSTOMER_URL', 'http://localhost:3003');
        }

        if ($user->role === 'admin') {
            return env('FRONTEND_ADMIN_URL', 'http://localhost:3004');
        }
        
        if ($user->role === 'vendor' || $user->vendor_type) {
            return env('FRONTEND_VENDOR_URL', 'http://localhost:3002');
        }

        return env('FRONTEND_CUSTOMER_URL', 'http://localhost:3003');
    }
}
