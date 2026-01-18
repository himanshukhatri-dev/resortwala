<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class CustomerAuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|string|email|max:255|unique:customers',
            'phone' => 'required|string|max:20|unique:customers',
            'password' => 'nullable|string|min:6', // Password optional
        ]);

        $customer = Customer::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => $request->password ? Hash::make($request->password) : Hash::make(\Illuminate\Support\Str::random(16)),
        ]);

        $token = $customer->createToken('customer-token')->plainTextToken;

        // --- DUAL OTP GENERATION ---
        
        // 1. Email OTP (if email exists)
        if ($customer->email) {
            $emailOtp = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
            $customer->update(['email_verification_token' => $emailOtp]);
            
            try {
                // Send Welcome/Verification Email
                \Mail::to($customer->email)->send(new \App\Mail\OtpMail($emailOtp, 'signup'));
            } catch (\Exception $e) {
                \Log::error("Failed to send signup email to {$customer->email}: " . $e->getMessage());
            }
        }

        // 2. SMS OTP (Always, since phone is required)
        $smsOtp = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
        $customer->update(['phone_verification_token' => $smsOtp]);

        try {
            $notificationService = app(\App\Services\NotificationService::class);
            $notificationService->sendSMSOTP($customer->phone, $smsOtp, 'signup');
        } catch (\Exception $e) {
             \Log::error("Failed to send signup SMS to {$customer->phone}: " . $e->getMessage());
        }

        return response()->json([
            'customer' => $customer,
            'token' => $token,
            'needs_verification' => [
                'email' => !empty($request->email),
                'phone' => true 
            ]
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $customer = Customer::where('email', $request->email)->first();

        if (!$customer || !Hash::check($request->password, $customer->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $token = $customer->createToken('customer-token')->plainTextToken;

        return response()->json([
            'customer' => $customer,
            'token' => $token,
        ]);
    }

    public function loginWithEmailOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|string|size:6',
        ]);

        // Verify OTP using OtpService
        $otpService = app(\App\Services\OtpService::class);
        $isValid = $otpService->verify($request->email, $request->code, 'login');

        if (!$isValid) {
            return response()->json(['message' => 'Invalid or expired OTP'], 400);
        }

        // Find or create customer
        $customer = Customer::where('email', $request->email)->first();

        if (!$customer) {
            $customer = Customer::create([
                'name' => 'Guest ' . explode('@', $request->email)[0],
                'email' => $request->email,
                'password' => Hash::make(\Illuminate\Support\Str::random(16)),
            ]);
        }

        $token = $customer->createToken('customer-token')->plainTextToken;

        return response()->json([
            'customer' => $customer,
            'token' => $token,
        ]);
    }

    public function sendOtp(Request $request)
    {
        $request->validate(['phone' => 'required|string']);

        // Normalize
        $digits = preg_replace('/\D/', '', $request->phone);
        if (strlen($digits) === 12 && substr($digits, 0, 2) === '91') {
            $digits = substr($digits, 2);
        }

        $otpService = app(\App\Services\OtpService::class);
        $code = $otpService->generate($digits, 'login');

        try {
            $notificationService = app(\App\Services\NotificationService::class);
            $notificationService->sendSMSOTP($request->phone, $code, 'login');
        } catch (\Exception $e) {
            \Log::error("Failed to send login SMS to {$request->phone}: " . $e->getMessage());
        }

        return response()->json(['message' => 'OTP sent successfully']);
    }

    public function loginOtp(Request $request)
    {
        $request->validate([
            'phone' => 'required|string',
            'otp' => 'required|string',
        ]);

        $digits = preg_replace('/\D/', '', $request->phone);
        if (strlen($digits) === 12 && substr($digits, 0, 2) === '91') {
            $digits = substr($digits, 2);
        }
        
        // Verify OTP
        $otpService = app(\App\Services\OtpService::class);
        if (!$otpService->verify($digits, $request->otp, 'login')) {
             return response()->json(['message' => 'Invalid OTP'], 400);
        }

        // Find customer matching various formats
        $customer = Customer::where('phone', $digits)
            ->orWhere('phone', '+91' . $digits)
            ->orWhere('phone', '91' . $digits)
            ->orWhere('phone', $request->phone) // Fallback to exact match
            ->first();

        if (!$customer) {
            // Register new customer
            $customer = Customer::create([
                'name' => 'Guest ' . substr($request->phone, -4),
                'email' => $digits . '@resortwala.com', // Placeholder unique email
                'phone' => $request->phone, // Store input format
                'password' => Hash::make(\Illuminate\Support\Str::random(16)),
            ]);
        }

        $token = $customer->createToken('customer-token')->plainTextToken;

        return response()->json([
            'customer' => $customer,
            'token' => $token,
            'is_new_user' => $customer->wasRecentlyCreated
        ]);
    }

    public function profile(Request $request)
    {
        return response()->json($request->user());
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully'
        ]);
    }

    public function updateDeviceToken(Request $request)
    {
        $request->validate([
            'fcm_token' => 'required|string'
        ]);

        $user = $request->user();
        $user->fcm_token = $request->fcm_token;
        $user->save();

        return response()->json(['message' => 'Device token updated']);
    }
}
