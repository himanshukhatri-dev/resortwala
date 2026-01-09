<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Booking;
use Illuminate\Support\Facades\Http;

class PaymentSimulationController extends Controller
{
    /**
     * Simulate a PhonePe Payment Callback
     * Usage: POST /api/payments/simulate
     * Params: booking_id, status (success, failed, pending)
     */
    public function simulate(Request $request)
    {
        $request->validate([
            'booking_id' => 'required|exists:bookings,BookingId',
            'status' => 'required|in:success,failed,pending'
        ]);

        $booking = Booking::findOrFail($request->booking_id);
        
        // Map simplified status to PhonePe codes
        $statusMap = [
            'success' => 'PAYMENT_SUCCESS',
            'failed' => 'PAYMENT_ERROR',
            'pending' => 'PAYMENT_PENDING'
        ];

        $code = $statusMap[$request->status];
        
        // Construct a mock PhonePe response payload
        // PhonePe sends a base64 encoded JSON string in the 'response' field
        $payload = [
            'success' => $request->status === 'success',
            'code' => $code,
            'message' => 'Simulated Payment ' . ucfirst($request->status),
            'data' => [
                'merchantId' => config('phonepe.merchant_id'),
                'merchantTransactionId' => "TXN_" . $booking->BookingId . "_" . time(),
                'transactionId' => "SIM_TXN_" . str_random(10),
                'amount' => $booking->TotalAmount * 100,
                'state' => ($request->status === 'success') ? 'COMPLETED' : (($request->status === 'pending') ? 'PENDING' : 'FAILED'),
                'paymentInstrument' => [
                    'type' => 'PAY_PAGE'
                ]
            ]
        ];

        $base64Response = base64_encode(json_encode($payload));

        // Create a fake request to the actual callback method
        $callbackRequest = new Request();
        $callbackRequest->setMethod('POST');
        $callbackRequest->request->add(['response' => $base64Response]);

        // We can either internally call the PaymentController or redirect to it
        // A redirect is better to simulate the real browser flow
        return redirect()->action(
            [PaymentController::class, 'callback'],
            ['response' => $base64Response]
        );
    }
}
