<?php

namespace App\Services;

use App\Models\Otp;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;

class OtpService
{
    /**
     * Generate and store a new OTP.
     *
     * @param string $identifier
     * @param string $type
     * @param int $expiryMinutes
     * @return string
     */
    public function generate($identifier, $type = 'login', $expiryMinutes = 10)
    {
        $identifier = strtolower(trim($identifier));

        // 1. Invalidate any existing active OTPs for this identifier/type
        Otp::where('identifier', $identifier)
            ->where('type', $type)
            ->whereNull('verified_at')
            ->update(['expires_at' => Carbon::now()->subMinute()]);

        // 2. Generate 6-digit code
        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // 3. Store OTP (Hashed for security if needed, but here simple store for ease of debugging/use)
        Otp::create([
            'identifier' => $identifier,
            'code' => $code, // In high-security systems, hash this. For simplicity now, plaintext.
            'type' => $type,
            'expires_at' => Carbon::now()->addMinutes($expiryMinutes)
        ]);

        return $code;
    }

    /**
     * Verify an OTP.
     *
     * @param string $identifier
     * @param string $code
     * @param string $type
     * @return bool
     */
    public function verify($identifier, $code, $type = 'login')
    {
        $identifier = strtolower(trim($identifier));

        \Log::info("Verifying OTP for Identifier: {$identifier}, Code: {$code}, Type: {$type}");

        $otp = Otp::where('identifier', $identifier)
            ->where('type', $type)
            ->where('code', $code)
            ->where('expires_at', '>', Carbon::now())
            ->whereNull('verified_at')
            ->first();

        if (!$otp) {
            // Debugging: Check why it failed
            $debugParams = [
                'exists_code' => Otp::where('identifier', $identifier)->where('code', $code)->exists(),
                'exists_identifier' => Otp::where('identifier', $identifier)->exists(),
                'expired' => Otp::where('identifier', $identifier)->where('code', $code)->where('expires_at', '<=', Carbon::now())->exists(),
                'wrong_type' => Otp::where('identifier', $identifier)->where('code', $code)->where('type', '!=', $type)->exists(),
                'server_time' => Carbon::now()->toDateTimeString()
            ];
            \Log::warning("OTP Verification Failed. Debug: " . json_encode($debugParams));
            return false;
        }

        $otp->update(['verified_at' => Carbon::now()]);
        return true;
    }
}
