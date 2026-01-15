<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FinanceController extends Controller
{
    public function index(Request $request)
    {
        $query = Booking::with('property:PropertyId,Name');

        if ($request->status) {
            $query->where('payment_status', $request->status);
        }

        if ($request->search) {
            $query->where(function($q) use ($request) {
                $q->where('transaction_id', 'like', "%{$request->search}%")
                  ->orWhere('booking_reference', 'like', "%{$request->search}%")
                  ->orWhere('CustomerName', 'like', "%{$request->search}%");
            });
        }
        
        if ($request->start_date && $request->end_date) {
            $query->whereBetween('created_at', [$request->start_date, $request->end_date]);
        }

        return $query->latest()->paginate(20);
    }

    public function stats()
    {
        $today = now()->startOfDay();

        return response()->json([
            'total_revenue' => Booking::where('payment_status', 'paid')->sum('TotalAmount'),
            'today_revenue' => Booking::where('payment_status', 'paid')
                ->where('created_at', '>=', $today)
                ->sum('TotalAmount'),
            'pending_amount' => Booking::where('payment_status', 'pending')->sum('TotalAmount'),
            'count_by_status' => Booking::select('payment_status', DB::raw('count(*) as count'))
                ->groupBy('payment_status')
                ->get(),
            'recent_transactions' => Booking::whereNotNull('payment_status')
                ->latest()
                ->limit(5)
                ->get(['BookingId', 'TotalAmount', 'payment_status', 'CustomerName', 'created_at'])
        ]);
    }
}
