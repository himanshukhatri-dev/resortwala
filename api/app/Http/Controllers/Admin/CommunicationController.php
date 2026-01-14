<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\EmailLog;
use Carbon\Carbon;

class CommunicationController extends Controller
{
    public function index(Request $request)
    {
        $query = EmailLog::query();

        if ($request->has('recipient')) {
            $query->where('recipient', 'like', '%' . $request->recipient . '%');
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $logs = $query->latest()->paginate(20);

        return response()->json($logs);
    }

    public function stats()
    {
        $today = Carbon::today();
        
        return response()->json([
            'total_sent' => EmailLog::where('status', 'sent')->count(),
            'total_failed' => EmailLog::where('status', 'failed')->count(),
            'sent_today' => EmailLog::where('status', 'sent')->whereDate('created_at', $today)->count(),
            'failed_today' => EmailLog::where('status', 'failed')->whereDate('created_at', $today)->count(),
        ]);
    }
}
