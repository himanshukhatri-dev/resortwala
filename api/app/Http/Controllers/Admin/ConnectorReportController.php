<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ConnectorEarning;
use App\Models\Connector;
use Illuminate\Support\Facades\DB;

class ConnectorReportController extends Controller
{
    /**
     * Get Aggregated Stats for Reporting Dashboard
     */
    public function stats(Request $request)
    {
        $query = ConnectorEarning::query();

        // Optional: Filter by specific connector (if admin viewing single profile)
        if ($request->has('connector_id')) {
            $query->where('connector_id', $request->connector_id);
        }

        $totalEarned = (clone $query)->sum('amount');
        $totalPaid = (clone $query)->where('status', 'paid')->sum('amount');
        $totalPending = (clone $query)->where('status', 'pending')->sum('amount');
        
        // Count unique bookings referral
        $totalBookings = (clone $query)->distinct('booking_id')->count('booking_id');

        return response()->json([
            'total_earned' => $totalEarned,
            'total_paid' => $totalPaid,
            'total_pending' => $totalPending,
            'total_bookings' => $totalBookings
        ]);
    }

    /**
     * Get Ledger of Earnings (Paginated)
     */
    public function earnings(Request $request)
    {
        $query = ConnectorEarning::with(['connector:id,name,phone', 'booking:id,BookingId,GuestName,TotalAmount']);

        if ($request->has('connector_id')) {
            $query->where('connector_id', $request->connector_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        // Date Range Filter
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('created_at', [$request->start_date, $request->end_date]);
        }

        $earnings = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($earnings);
    }

    /**
     * Mark specific earnings as PAID (Payout)
     */
    public function processPayout(Request $request)
    {
        $request->validate([
            'earning_ids' => 'required|array',
            'earning_ids.*' => 'exists:connector_earnings,id',
            'transaction_ref' => 'nullable|string',
            'notes' => 'nullable|string'
        ]);

        DB::transaction(function () use ($request) {
            ConnectorEarning::whereIn('id', $request->earning_ids)
                ->where('status', 'pending')
                ->update([
                    'status' => 'paid',
                    'payout_date' => now(),
                    'payout_ref' => $request->transaction_ref,
                    'notes' => $request->notes
                ]);
        });

        return response()->json(['message' => 'Payout processed successfully']);
    }
}
