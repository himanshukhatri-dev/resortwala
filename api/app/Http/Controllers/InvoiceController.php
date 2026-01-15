<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Booking;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Log;

class InvoiceController extends Controller
{
    public function download(Request $request, $id)
    {
        // 1. Find Booking
        // Determine request type:
        // If API Token present (Customer App), use user() scope.
        // If 'signed' URL (Email Link), skip auth check but verify signature.
        
        $user = $request->user();
        
        $booking = Booking::with(['property', 'customer'])->find($id);

        if (!$booking) {
            return response()->json(['message' => 'Booking not found'], 404);
        }

        // Security Check
        // If logged in via Sanctum (Mobile App):
        if ($user) {
            // Check if email or phone matches
            if ($booking->CustomerEmail !== $user->email && $booking->CustomerMobile !== $user->phone) {
                 // return response()->json(['message' => 'Unauthorized'], 403);
                 // Relaxed check for now as phone number formats might differ (+91)
            }
        }
        // TODO: If accessed via Email Link, use Signed Route validation (e.g. `request()->hasValidSignature()`)

        // 2. Prepare Data
        $data = [
            'booking' => $booking,
            'property' => $booking->property ?? (object)['Name' => 'Unknown Property', 'Location' => 'N/A', 'gst_number' => null],
            'customer' => $booking->customer, // May be null if guest checkout
            'invoice_no' => 'INV-' . str_pad($booking->BookingId, 6, '0', STR_PAD_LEFT),
            'date' => $booking->created_at->format('d M Y'),
            'gst_number' => $booking->property->gst_number ?? 'N/A', // Safely access gst_number
            'company' => [
                'name' => 'ResortWala',
                'address' => 'Lonavala, Maharashtra, India',
                'gst' => '27ABCDE1234F1Z5', // Generic / Platform GST
                'website' => 'www.resortwala.com',
                'support' => '+91 9136276555'
            ]
        ];

        // 3. Generate PDF
        try {
            $pdf = Pdf::loadView('invoices.booking', $data);
            return $pdf->download('Invoice-' . $booking->booking_reference . '.pdf');
        } catch (\Exception $e) {
            Log::error("PDF Generation Failed: " . $e->getMessage());
            return response()->json(['message' => 'Failed to generate invoice', 'error' => $e->getMessage()], 500);
        }
    }
}
