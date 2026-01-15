<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Customer;
use App\Models\OnboardingToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use App\Mail\UserOnboardingMail;

class OnboardingController extends Controller
{
    /**
     * Admin initiates onboarding for a new user.
     */
    public function onboard(Request $request)
    {
        \Log::info("Onboard request received", $request->all());

        $request->validate([
            'name' => 'required|string|max:255',
            'mobile' => 'required|string|max:15',
            'email' => 'nullable|email|max:255',
            'role' => 'required|in:admin,vendor,customer',
        ]);

        $role = $request->role;
        $name = $request->name;
        $mobile = $request->mobile;
        $email = $request->email;

        // 1. Create User/Customer record
        // We set a random long password initially that they can't guess.
        $tempPassword = Hash::make(Str::random(32));

        if ($role === 'customer') {
            // Check if already exists
            if (Customer::where('phone', $mobile)->exists()) {
                return response()->json(['message' => 'Customer with this mobile already exists.'], 422);
            }

            $user = Customer::create([
                'name' => $name,
                'email' => $email ?? $mobile . '@resortwala.tmp',
                'phone' => $mobile,
                'password' => $tempPassword,
            ]);
            $userType = 'customer';
        } else {
            // Admin or Vendor (Users table)
            if (User::where('phone', $mobile)->where('role', $role)->exists()) {
                return response()->json(['message' => 'User with this mobile already exists in ' . $role . ' role.'], 422);
            }

            if ($email && User::where('email', $email)->where('role', $role)->exists()) {
                return response()->json(['message' => 'User with this email already exists in ' . $role . ' role.'], 422);
            }

            $user = User::create([
                'name' => $name,
                'email' => $email ?? $mobile . '.' . $role . '@resortwala.tmp',
                'phone' => $mobile,
                'password' => $tempPassword,
                'role' => $role,
                'is_approved' => true // Admins added by admin are pre-approved
            ]);
            $userType = 'user';
        }

        // 2. Generate Onboarding Token
        $token = Str::random(64);
        OnboardingToken::create([
            'user_type' => $userType,
            'user_id' => $user->id,
            'token' => $token,
            'role' => $role,
            'expires_at' => now()->addHours(24)
        ]);

    // 3. Construct Login URL based on role
        // Hardcoded to beta.resortwala.com as requested
        $baseUrl = "https://beta.resortwala.com";
        
        if ($role === 'vendor') {
            // Direct verification endpoint on frontend
            // e.g. https://beta.resortwala.com/verify-invite?token=...
            $baseUrl .= "/vendor"; // Adjust if necessary for vendor subdomain/path logic
        }

        // Using a generic verify route on the frontend that handles the token
        // For vendor: https://beta.resortwala.com/vendor/verify-invite?token=...
        $onboardingUrl = "https://beta.resortwala.com/vendor/verify-invite?token=" . $token;
        
        if ($role === 'customer') {
             $onboardingUrl = "https://beta.resortwala.com/verify-invite?token=" . $token;
        }

        // 4. Send Notifications
        if ($email) {
            try {
                Mail::to($email)->send(new UserOnboardingMail($name, $onboardingUrl, $role));
            } catch (\Exception $e) {
                \Log::error("Failed to send onboarding email: " . $e->getMessage());
            }
        }

        return response()->json([
            'message' => 'User onboarded successfully. Notification sent.',
            'onboarding_url' => $onboardingUrl
        ]);
    }

    /**
     * Complete onboarding (Direct verification without password).
     * Returns auth token.
     */
    public function complete(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
        ]);

        $onboardingToken = OnboardingToken::where('token', $request->token)->first();

        if (!$onboardingToken) {
             return response()->json(['message' => 'Invalid token.'], 404);
        }

        if ($onboardingToken->is_used) {
             return response()->json(['message' => 'Link already used.'], 400);
        }

        if (now()->gt($onboardingToken->expires_at)) {
             return response()->json(['message' => 'Link expired.'], 400);
        }

        // Retrieve User
        if ($onboardingToken->user_type === 'customer') {
            $user = Customer::find($onboardingToken->user_id);
        } else {
            $user = User::find($onboardingToken->user_id);
        }

        if (!$user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        // Mark verified/approved if needed (User model 'is_approved' defaults to matching logic in onboard)
        // Mark token used
        $onboardingToken->is_used = true;
        $onboardingToken->save();

        // Generate Auth Token
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Verification successful.',
            'token' => $token,
            'user' => $user,
            'role' => $onboardingToken->role
        ]);
    }

    /**
     * Deprecated: User sets their real password.
     * Kept for backward compatibility if any old links exist, but loop to complete logic if possible?
     * Or just leave as is for now in case logic reverts.
     */
    public function setPassword(Request $request)
    {
        return $this->complete($request);
    }

    private function getFrontendUrl($role)
    {
        return "https://beta.resortwala.com";
    }

    private function sendSMS($mobile, $message)
    {
        // LOG FOR NOW
        \Log::info("SMS to {$mobile}: {$message}");
    }
}
