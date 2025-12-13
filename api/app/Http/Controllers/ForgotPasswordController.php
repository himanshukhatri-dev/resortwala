<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Mail\OtpMail;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;

class ForgotPasswordController extends Controller
{
    // 1. Send OTP
    public function sendOtp(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            // Security: Don't reveal if user exists, but for UX we might return standard error
            // For now, let's return success to avoid enumeration, or validation error if preferred
             throw ValidationException::withMessages(['email' => ['We can\'t find a user with that email address.']]);
        }

        // Generate 6-digit OTP
        $otp = rand(100000, 999999);

        // Store OTP in password_reset_tokens table
        // We will store the email and the HASHED otp (or plain, standard Laravel uses token)
        // Since we are customizing, let's store plain OTP in 'token' column but it's temporary.
        // Actually, password_reset_tokens has email, token, created_at.
        // We'll update or insert.

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $request->email],
            [
                'token' => $otp, // Storing plain OTP for simplicity in this custom flow, usually hashed.
                'created_at' => Carbon::now()
            ]
        );

        // Send Email
        try {
            Mail::to($request->email)->send(new OtpMail($otp));
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to send OTP. Please try again later.'], 500);
        }

        return response()->json(['message' => 'OTP sent to your email.']);
    }

    // 2. Verify OTP
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp' => 'required|digits:6'
        ]);

        $record = DB::table('password_reset_tokens')
                    ->where('email', $request->email)
                    ->where('token', $request->otp)
                    ->first();

        if (!$record) {
             return response()->json(['message' => 'Invalid OTP.'], 400);
        }

        // Check expiration (e.g., 10 minutes)
        if (Carbon::parse($record->created_at)->addMinutes(10)->isPast()) {
            return response()->json(['message' => 'OTP expired.'], 400);
        }

        return response()->json(['message' => 'OTP Verified.']);
    }

    // 3. Reset Password
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp' => 'required|digits:6',
            'password' => 'required|confirmed|min:8',
        ]);

        // Verify OTP again to be sure
        $record = DB::table('password_reset_tokens')
                    ->where('email', $request->email)
                    ->where('token', $request->otp)
                    ->first();

        if (!$record || Carbon::parse($record->created_at)->addMinutes(10)->isPast()) {
            return response()->json(['message' => 'Invalid or expired OTP.'], 400);
        }

        // Update Password
        $user = User::where('email', $request->email)->first();
        if ($user) {
            $user->password = Hash::make($request->password);
            $user->save();
        }

        // Delete OTP record
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return response()->json(['message' => 'Password reset successfully.']);
    }
}
