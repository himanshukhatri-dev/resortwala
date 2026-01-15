<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\ConnectorEarning;
use Illuminate\Support\Facades\Log;

class CommissionService
{
    public function calculateAndRecord(Booking $booking)
    {
        try {
            // Load property with active connector
            // We use the helper 'activeConnector' from PropertyMaster
            // But we need to load the relation first
            $booking->load('property');
            $property = $booking->property;

            if (!$property) return;

            // Get active connector from pivot
            // The helper activeConnector returns a relationship query builder
            $connector = $property->activeConnector()->first();

            if (!$connector) {
                return; // No connector assigned
            }

            // Pivot data
            $pivot = $connector->pivot; 
            $type = $pivot->commission_type;
            $value = $pivot->commission_value;

            // Calculate
            $saleAmount = $booking->TotalAmount;
            $commissionAmount = 0;

            if ($type === 'flat') {
                $commissionAmount = $value;
            } else {
                // Percentage
                $commissionAmount = ($saleAmount * $value) / 100;
            }

            // Create Earning Record
            ConnectorEarning::create([
                'connector_id' => $connector->id,
                'booking_id' => $booking->BookingId ?? $booking->id, // Handle varying primary key names if any
                'sale_amount' => $saleAmount,
                'commission_amount' => $commissionAmount,
                'payout_status' => 'pending'
            ]);

            Log::info("Commission Recorded", [
                'booking_id' => $booking->id,
                'connector_id' => $connector->id,
                'amount' => $commissionAmount
            ]);

        } catch (\Exception $e) {
            Log::error("Commission Calc Error: " . $e->getMessage());
        }
    }
}
