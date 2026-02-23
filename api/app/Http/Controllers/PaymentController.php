<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Booking;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class PaymentController extends Controller
{
    // Environment config
    protected $phonePeService;
    private $frontEndUrl;

    public function __construct(\App\Services\PhonePeService $phonePeService)
    {
        $this->phonePeService = $phonePeService;
        $this->frontEndUrl = env('FRONTEND_URL', 'https://beta.resortwala.com');
    }

    public function callback(Request $request)
    {
        $stateService = app(\App\Services\BookingStateService::class);

        try {
            Log::info("Payment Callback Hit", [
                'method' => $request->method(),
                'url' => $request->fullUrl(),
                'all' => $request->all(),
            ]);

            // 1. Handle Browser Redirect (Form POST) - Crucial for Local/Beta without S2S
            if (!$request->has('response') && $request->has('code') && $request->has('merchantId')) {
                $status = $request->input('code');
                $merchantTxnId = $request->input('merchantTransactionId') ?? $request->input('transactionId');

                $bookingId = null;
                if ($merchantTxnId) {
                    $parts = explode('_', $merchantTxnId);
                    if (count($parts) >= 2)
                        $bookingId = $parts[1];
                }

                if ($bookingId) {
                    $booking = Booking::find($bookingId);
                    if ($booking) {
                        if ($status === 'PAYMENT_SUCCESS') {
                            $stateService->markAsPayed($booking, $merchantTxnId);
                            return redirect()->to("{$this->frontEndUrl}/booking/success?id={$bookingId}");
                        } elseif ($status === 'PAYMENT_PENDING') {
                            return redirect()->to("{$this->frontEndUrl}/booking/pending?id={$bookingId}");
                        } else {
                            $booking->update(['payment_status' => 'failed', 'Status' => \App\Enums\BookingStatus::CANCELLED]);
                            return redirect()->to("{$this->frontEndUrl}/booking/failed?id={$bookingId}");
                        }
                    }
                }
            }

            // 2. Handle S2S Callback (Base64 Response)
            $base64Response = $request->input('response');
            if (!$base64Response) {
                // Check if it's in the raw JSON body
                $json = $request->json()->all();
                $base64Response = $json['response'] ?? null;
            }

            if (!$base64Response) {
                return response()->json(['error' => 'Invalid Callback'], 400);
            }

            $xVerify = $request->header('X-VERIFY') ?? $request->header('X-Verify');
            $result = $this->phonePeService->processCallback($base64Response, $xVerify);

            if (!$result['success']) {
                return response()->json(['error' => $result['error']], 403);
            }

            $bookingId = $result['booking_id'] ?? null;
            if (!$bookingId && isset($result['transaction_id'])) {
                $parts = explode('_', $result['transaction_id']);
                if (count($parts) >= 2)
                    $bookingId = $parts[1];
            }

            if ($bookingId) {
                $booking = Booking::find($bookingId);
                if ($booking) {
                    $state = $result['status'] ?? 'FAILED';
                    if ($state === 'PAYMENT_SUCCESS') {
                        $stateService->markAsPayed($booking, $result['transaction_id']);
                    } elseif ($state === 'PAYMENT_PENDING') {
                        $booking->update(['payment_status' => 'pending']);
                    } else {
                        $booking->update(['payment_status' => 'failed', 'Status' => \App\Enums\BookingStatus::CANCELLED]);
                    }
                }
            }

            return response()->json(['success' => true]);

        } catch (\Exception $e) {
            Log::error("Payment Callback Exception", ['e' => $e->getMessage()]);
            return response()->json(['error' => 'Internal Server Error'], 500);
        }
    }
}
