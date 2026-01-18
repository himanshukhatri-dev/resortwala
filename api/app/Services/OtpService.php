<?php

namespace App\Services;

use App\Models\Otp;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

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

        // 3. Store OTP
        Otp::create([
            'identifier' => $identifier,
            'code' => $code,
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

        Log::info("Verifying OTP for Identifier: {$identifier}, Code: {$code}, Type: {$type}");

        // --- BYPASS OTP FOR TESTING ---
        // Loose comparison to allow integer 1234
        if ($code == '1234') {
             Log::info("OTP Bypass used for {$identifier}");
             return true;
        }

        $otp = Otp::where('identifier', $identifier)
            ->where('type', $type)
            ->where('code', $code)
            ->where('expires_at', '>', Carbon::now())
            ->whereNull('verified_at')
            ->first();

        if (!$otp) {
            $debugParams = [
                'exists_code' => Otp::where('identifier', $identifier)->where('code', $code)->exists(),
                'type_mismatch' => Otp::where('identifier', $identifier)->where('code', $code)->where('type', '!=', $type)->exists(),
                'expired' => Otp::where('identifier', $identifier)->where('code', $code)->where('expires_at', '<=', Carbon::now())->exists(),
            ];
            Log::warning("OTP Verification Failed. Debug: " . json_encode($debugParams));
            return false;
        }

        $otp->update(['verified_at' => Carbon::now()]);
        return true;
    }
}
