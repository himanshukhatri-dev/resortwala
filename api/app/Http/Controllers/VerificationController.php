<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use App\Mail\OtpMail;
use App\Services\NotificationService;

class VerificationController extends Controller
{
    /**
     * Send email verification OTP
     */
    public function sendEmailVerification(Request $request)
    {
        $user = auth()->user();
        
        if ($user->email_verified_at) {
            return response()->json(['message' => 'Email already verified'], 400);
        }
        
        // Generate 6-digit OTP
        $otp = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
        
        $user->update([
            'email_verification_token' => $otp,
        ]);
        
        // Send email
        try {
            Mail::to($user->email)->send(new OtpMail($otp, 'verification'));
            \Log::info("Email OTP sent to {$user->email}: {$otp}");
        } catch (\Exception $e) {
            \Log::error("Failed to send email OTP to {$user->email}: " . $e->getMessage());
            // Return OTP in response for debugging (remove in production)
            return response()->json([
                'message' => 'Failed to send email, but here is your code for testing',
                'otp' => $otp,
                'error' => $e->getMessage()
            ], 500);
        }
        
        return response()->json([
            'message' => 'Verification code sent to your email',
            'debug_otp' => $otp // Remove this in production!
        ]);
    }

    /**
     * Verify email with OTP
     */
    public function verifyEmail(Request $request)
    {
        $validated = $request->validate([
            'otp' => 'required|string|size:6'
        ]);
        
        $user = auth()->user();
        
        if (!$user->email_verification_token) {
            return response()->json(['message' => 'No verification code found. Please request a new one.'], 400);
        }
        
        if ($user->email_verification_token !== $validated['otp']) {
            return response()->json(['message' => 'Invalid verification code'], 400);
        }
        
        $user->update([
            'email_verified_at' => now(),
            'email_verification_token' => null
        ]);
        
        return response()->json([
            'message' => 'Email verified successfully',
            'user' => $user
        ]);
    }

    /**
     * Send phone verification OTP
     */
    public function sendPhoneVerification(Request $request)
    {
        $user = auth()->user();
        
        if ($user->phone_verified_at) {
            return response()->json(['message' => 'Phone already verified'], 400);
        }
        
        if (!$user->phone) {
            return response()->json(['message' => 'No phone number found'], 400);
        }
        
        // Generate 6-digit OTP
        $otp = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
        
        $user->update([
            'phone_verification_token' => $otp,
        ]);
        
        // Send OTP via SMS using NotificationService
        $notificationService = app(NotificationService::class);
        $notificationService->sendSMSOTP($user->phone, $otp, 'phone_verification');
        
        return response()->json([
            'message' => 'Verification code sent to your mobile number',
            'otp' => $otp // For testing - check Laravel logs for OTP
        ]);
    }

    /**
     * Verify phone with OTP
     */
    public function verifyPhone(Request $request)
    {
        $validated = $request->validate([
            'otp' => 'required|string|size:6'
        ]);
        
        $user = auth()->user();
        
        if (!$user->phone_verification_token) {
            return response()->json(['message' => 'No verification code found. Please request a new one.'], 400);
        }
        
        if ($user->phone_verification_token !== $validated['otp']) {
            return response()->json(['message' => 'Invalid verification code'], 400);
        }
        
        $user->update([
            'phone_verified_at' => now(),
            'phone_verification_token' => null
        ]);
        
        return response()->json([
            'message' => 'Phone verified successfully',
            'user' => $user
        ]);
    }

    /**
     * Update user profile
     */
    public function updateProfile(Request $request)
    {
        $user = auth()->user();
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:15'
        ]);

        // If email changed, mark as unverified
        if ($user->email !== $validated['email']) {
            $validated['email_verified_at'] = null;
            $validated['email_verification_token'] = null;
        }
        
        // If phone changed, mark as unverified
        if ($user->phone !== $validated['phone']) {
            $validated['phone_verified_at'] = null;
            $validated['phone_verification_token'] = null;
        }
        
        $user->update($validated);
        
        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user
        ]);
    }
}
