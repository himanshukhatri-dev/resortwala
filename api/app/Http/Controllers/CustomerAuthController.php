<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class CustomerAuthController extends Controller
{
    public function registerSendOtp(Request $request)
    {
        $request->validate(['phone' => 'required|string']);

        // Check if user already exists
        $digits = preg_replace('/\D/', '', $request->phone);
        if (strlen($digits) === 12 && substr($digits, 0, 2) === '91')
            $digits = substr($digits, 2);

        $exists = Customer::where('phone', $digits)
            ->orWhere('phone', '+91' . $digits)
            ->orWhere('phone', '91' . $digits)
            ->orWhere('phone', $request->phone)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Account already exists. Please login.', 'exists' => true], 422);
        }

        $otpService = app(\App\Services\OtpService::class);
        $code = $otpService->generate($digits, 'signup'); // Use 'signup' type

        try {
            $notificationService = app(\App\Services\NotificationService::class);
            $notificationService->sendSMSOTP($request->phone, $code, 'signup');
        } catch (\Exception $e) {
            \Log::error("Failed to send signup SMS to {$request->phone}");
        }

        return response()->json(['message' => 'OTP sent for verification.']);
    }

    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|string|email|max:255|unique:customers',
            'phone' => 'required|string|max:20|unique:customers',
            'otp' => 'required|string', // OTP is now REQUIRED
            'password' => 'nullable|string|min:6',
        ]);

        $digits = preg_replace('/\D/', '', $request->phone);
        if (strlen($digits) === 12 && substr($digits, 0, 2) === '91')
            $digits = substr($digits, 2);

        \Log::info("Registering: Phone={$digits}, OTP={$request->otp}");

        // 1. Verify OTP BEFORE Creation
        $otp = trim($request->otp);
        $otpService = app(\App\Services\OtpService::class);
        if (!$otpService->verify($digits, $otp, 'signup')) {
            return response()->json(['message' => 'Invalid or expired OTP.'], 400);
        }

        // 2. Create User (Now verified)
        // Fallback email if null (Migration failed, bypassing constraint)
        $email = $request->email;
        if (empty($email)) {
            $email = 'noemail_' . $digits . '@resortwala.com';
        }

        $customer = Customer::create([
            'name' => $request->name,
            'email' => $email,
            'phone' => $request->phone,
            'password' => $request->password ? Hash::make($request->password) : Hash::make(\Illuminate\Support\Str::random(16)),
            'phone_verified_at' => now(), // Mark as verified immediately
        ]);

        $token = $customer->createToken('customer-token')->plainTextToken;

        return response()->json([
            'customer' => $customer,
            'token' => $token,
            'needs_verification' => ['email' => false, 'phone' => false]
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
            'code' => 'required|string|min:4|max:6',
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

        // Check if customer exists
        $customer = Customer::where('phone', $digits)
            ->orWhere('phone', '+91' . $digits)
            ->orWhere('phone', '91' . $digits)
            ->orWhere('phone', $request->phone)
            ->first();

        // Verify User Exists
        if (!$customer) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $code = $otpService->generate($digits, 'login');

        try {
            // Use Modern Notification Engine (Correct DLT Template)
            $notificationEngine = app(\App\Services\NotificationEngine::class);

            \Log::info("CustomerAuthController: Dispatching OTP SMS to {$digits} using NotificationEngine");

            // 1. Send SMS (otp.sms event)
            $result = $notificationEngine->dispatch('otp.sms', ['mobile' => $digits], ['otp' => $code]);

            \Log::info("CustomerAuthController: SMS Dispatch Result: " . ($result ? 'Success' : 'Failed'));

            // 2. Send Email (otp.email event)
            if ($customer && $customer->email && filter_var($customer->email, FILTER_VALIDATE_EMAIL)) {
                $notificationEngine->dispatch('otp.email', ['email' => $customer->email], ['otp' => $code, 'name' => $customer->name ?? 'User']);
                \Log::info("Dual OTP Dispatch: Email sent to {$customer->email}");
            }
        } catch (\Exception $e) {
            \Log::error("Failed to send login OTP to {$request->phone}: " . $e->getMessage());
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
        \Log::info("Login OTP Attempt: Phone={$digits}, OTP={$request->otp}, Type=login");
        $otpService = app(\App\Services\OtpService::class);
        if (!$otpService->verify($digits, $request->otp, 'login')) {
            \Log::warning("Login OTP Failed for {$digits}");
            return response()->json(['message' => 'Invalid OTP'], 400);
        }

        // Find customer matching various formats
        $customer = Customer::where('phone', $digits)
            ->orWhere('phone', '+91' . $digits)
            ->orWhere('phone', '91' . $digits)
            ->orWhere('phone', $request->phone) // Fallback to exact match
            ->first();

        if (!$customer) {
            return response()->json(['message' => 'Account not found. Please sign up first.'], 404);
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
        try {
            \Log::info("Entering Customer Profile Controller for User ID: " . ($request->user() ? $request->user()->id : 'null'));

            $user = $request->user();
            if (!$user) {
                \Log::error("Profile: User is null despite auth middleware.");
                return response()->json(['message' => 'User context not found'], 500);
            }

            return response()->json($user);
        } catch (\Throwable $e) {
            \Log::error("Profile Controller Error: " . $e->getMessage());
            \Log::error($e->getTraceAsString());
            return response()->json(['message' => 'Internal Error', 'debug' => $e->getMessage()], 500);
        }
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
