<?php

namespace App\Http\Controllers;

use App\Services\OtpService;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Customer;

class OtpController extends Controller
{
    protected $otpService;
    protected $notificationService;

    public function __construct(OtpService $otpService, NotificationService $notificationService)
    {
        $this->otpService = $otpService;
        $this->notificationService = $notificationService;
    }

    /**
     * Send OTP to a user.
     */
    public function send(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'type' => 'nullable|string|in:login,reset,signup'
        ]);

        $email = $request->email;
        $type = $request->type ?? 'login';

        // Optional: Check if user exists for 'login' or 'reset'
        if ($type !== 'signup') {
            $user = User::where('email', $email)->first() ?? Customer::where('email', $email)->first();
            if (!$user) {
                return response()->json(['message' => 'User not found with this email'], 404);
            }
        }

        $code = $this->otpService->generate($email, $type);
        $this->notificationService->sendEmailOTP($email, $code, $type);

        // --- DUAL OTP: Send SMS if user has phone ---
        if ($type !== 'signup') { // For signup, we don't have user yet (or handled in register)
            $user = User::where('email', $email)->first() ?? Customer::where('email', $email)->first();
            if ($user && $user->phone) {
                 try {
                    $this->notificationService->sendSMSOTP($user->phone, $code, $type);
                 } catch (\Exception $e) {
                    \Log::error("Failed to send secondary SMS OTP to {$user->phone}: " . $e->getMessage());
                 }
            }
        }
        
        return response()->json([
            'message' => 'OTP sent successfully to your email' . ($user && $user->phone ? ' and mobile number' : '')
        ]);
    }

    /**
     * Verify OTP.
     */
    public function verify(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|string|min:4|max:6',
            'type' => 'nullable|string|in:login,reset,signup'
        ]);

        $isValid = $this->otpService->verify($request->email, $request->code, $request->type ?? 'login');

        if (!$isValid) {
            return response()->json(['message' => 'Invalid or expired OTP'], 400);
        }

        return response()->json([
            'message' => 'OTP verified successfully'
        ]);
    }
}
