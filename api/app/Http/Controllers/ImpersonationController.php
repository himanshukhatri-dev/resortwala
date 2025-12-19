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

        // 2. Find Target User
        $targetUser = User::find($userId);
        if (!$targetUser) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        // 3. Generate New Token for Target User
        // Note: Creating a token does not log out the admin. 
        // Admin gets a token belonging to the target user.
        $token = $targetUser->createToken('ImpersonationToken: ' . $request->user()->id)->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $targetUser,
            'redirect_url' => $this->getRedirectUrlForUser($targetUser)
        ]);
    }

    private function getRedirectUrlForUser($user)
    {
        // Robust environment-based redirection
        // Falls back to localhost defaults if env vars are missing
        
        if ($user->role === 'admin') {
            return env('FRONTEND_ADMIN_URL', 'http://localhost:3004');
        }
        
        if ($user->role === 'vendor' || $user->vendor_type) {
            return env('FRONTEND_VENDOR_URL', 'http://localhost:3002');
        }

        // Default to Customer
        return env('FRONTEND_CUSTOMER_URL', 'http://localhost:3003');
    }
}
