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
            if (User::where('phone', $mobile)->exists()) {
                return response()->json(['message' => 'User with this mobile already exists.'], 422);
            }

            $user = User::create([
                'name' => $name,
                'email' => $email ?? $mobile . '@resortwala.tmp',
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
        $baseUrl = $this->getFrontendUrl($role);
        $onboardingUrl = $baseUrl . "/set-password?token=" . $token;

        // 4. Send Notifications
        if ($email) {
            try {
                Mail::to($email)->send(new UserOnboardingMail($name, $onboardingUrl, $role));
            } catch (\Exception $e) {
                \Log::error("Failed to send onboarding email: " . $e->getMessage());
            }
        }

        // --- SMS Placeholder ---
        $smsMessage = "Hello {$name}, welcome to ResortWala! Complete your registration as a " . ucfirst($role) . " here: {$onboardingUrl}";
        $this->sendSMS($mobile, $smsMessage);

        return response()->json([
            'message' => 'User onboarded successfully. Notification sent.',
            'onboarding_url' => $onboardingUrl // Returning for debugging/manual sharing
        ]);
    }

    /**
     * Verify the onboarding token.
     */
    public function verifyToken($token)
    {
        $onboardingToken = OnboardingToken::where('token', $token)->first();

        if (!$onboardingToken) {
             \Log::info("VerifyToken: Token not found: " . $token);
             return response()->json(['message' => 'Invalid token.'], 404);
        }

        \Log::info("VerifyToken:", [
            'token_exists' => true,
            'is_used' => $onboardingToken->is_used,
            'expires_at' => $onboardingToken->expires_at,
            'now' => now()->toDateTimeString(),
            'is_expired' => now()->gt($onboardingToken->expires_at)
        ]);

        if ($onboardingToken->is_used) {
             return response()->json(['message' => 'Token already used.'], 404);
        }

        if (now()->gt($onboardingToken->expires_at)) {
             return response()->json(['message' => 'Token expired.'], 404);
        }

        return response()->json([
            'valid' => true,
            'role' => $onboardingToken->role
        ]);
    }

    /**
     * User sets their real password.
     */
    public function setPassword(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $onboardingToken = OnboardingToken::where('token', $request->token)
            ->where('is_used', false)
            ->where('expires_at', '>', now())
            ->first();

        if (!$onboardingToken) {
            return response()->json(['message' => 'Invalid or expired token.'], 404);
        }

        // Update the actual user password
        if ($onboardingToken->user_type === 'customer') {
            $user = Customer::find($onboardingToken->user_id);
        } else {
            $user = User::find($onboardingToken->user_id);
        }

        if (!$user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        // Mark token as used
        $onboardingToken->is_used = true;
        $onboardingToken->save();

        return response()->json(['message' => 'Password set successfully. You can now log in.']);
    }

    private function getFrontendUrl($role)
    {
        return match ($role) {
            'admin' => env('FRONTEND_ADMIN_URL', 'http://localhost:3004'),
            'vendor' => env('FRONTEND_VENDOR_URL', 'http://localhost:3002'),
            default => env('FRONTEND_CUSTOMER_URL', 'http://localhost:3003'),
        };
    }

    private function sendSMS($mobile, $message)
    {
        // LOG FOR NOW
        \Log::info("SMS to {$mobile}: {$message}");
        
        // Integration Logic for MSG91/Twilio would go here.
    }
}
