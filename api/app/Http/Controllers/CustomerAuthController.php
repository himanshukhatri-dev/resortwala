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
            'email' => 'required|string|email|max:255|unique:customers',
            'phone' => 'nullable|string|max:20',
            'password' => 'required|string|min:6',
        ]);

        $customer = Customer::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
        ]);

        $token = $customer->createToken('customer-token')->plainTextToken;

        return response()->json([
            'customer' => $customer,
            'token' => $token,
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

        // Verify OTP using OtpService (manual check here for simplicity if service is not injected)
        $otpService = app(\App\Services\OtpService::class);
        $isValid = $otpService->verify($request->email, $request->code, 'login');

        if (!$isValid) {
            return response()->json(['message' => 'Invalid or expired OTP'], 400);
        }

        // Find or create customer
        $customer = Customer::where('email', $request->email)->first();

        if (!$customer) {
            // Optional: for Login flow, we might want to check if they should signup first.
            // But if we want "Easy to use", we just create them if they don't exist?
            // User usually wants "Login or Signup" in one flow.
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

    public function loginOtp(Request $request)
    {
        $request->validate([
            'phone' => 'required|string',
            'firebase_token' => 'nullable|string', // TODO: Verify this token with Google
        ]);

        // Find customer by phone
        // Normalize phone number if needed (e.g., remove +91 if stored without it)
        $customer = Customer::where('phone', $request->phone)->first();

        if (!$customer) {
            // Register new customer
            // We use placeholder email/password since they authenticated via Phone
            $customer = Customer::create([
                'name' => 'Guest ' . substr($request->phone, -4),
                'email' => $request->phone . '@resortwala.com', // Placeholder unique email
                'phone' => $request->phone,
                'password' => Hash::make(\Illuminate\Support\Str::random(16)), // Random password
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
}
