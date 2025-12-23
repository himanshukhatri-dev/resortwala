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
        if ($type === 'customer') {
            return env('FRONTEND_CUSTOMER_URL', 'http://localhost:3003');
        }

        if ($user->role === 'admin') {
            return env('FRONTEND_ADMIN_URL', 'http://localhost:3004');
        }
        
        if ($user->role === 'vendor' || $user->vendor_type) {
            return env('FRONTEND_VENDOR_URL', 'http://localhost:3002');
        }

        // Default to Customer if role is somehow undefined but it's a User model
        return env('FRONTEND_CUSTOMER_URL', 'http://localhost:3003');
    }
}
