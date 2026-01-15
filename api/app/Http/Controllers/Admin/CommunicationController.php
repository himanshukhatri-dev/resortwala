<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EmailLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use App\Services\NotificationService;

class CommunicationController extends Controller
{
    /**
     * Get communication logs with stats.
     */
    public function index(Request $request)
    {
        $query = EmailLog::query();

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('channel', $request->status);
        }

        if ($request->has('search')) {
            $query->where('recipient', 'like', '%' . $request->search . '%');
        }

        $logs = $query->orderBy('created_at', 'desc')->paginate(50);

        $stats = [
            'sent' => EmailLog::where('status', 'sent')->count(),
            'failed' => EmailLog::where('status', 'failed')->count(),
            'pending' => EmailLog::where('status', 'pending')->count(),
        ];

        return response()->json([
            'success' => true,
            'logs' => $logs->items(),
            'stats' => $stats,
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'total' => $logs->total(),
            ]
        ]);
    }

    /**
     * Broadcast a message to multiple recipients.
     */
    public function broadcast(Request $request)
    {
        $request->validate([
            'recipients' => 'nullable|array',
            'audience_type' => 'required|string|in:vendors,customers,manual',
            'type' => 'required|string|in:email,sms,whatsapp',
            'subject' => 'nullable|string',
            'content' => 'required|string',
        ]);

        $recipients = [];

        if ($request->audience_type === 'vendors') {
            $recipients = \App\Models\User::where('role', 'vendor')->where('is_approved', true)->pluck('email')->toArray();
        } elseif ($request->audience_type === 'customers') {
            $recipients = \App\Models\Customer::pluck('email')->toArray();
        } else {
            $recipients = $request->recipients ?? [];
        }

        $successCount = 0;
        $failCount = 0;

        foreach ($recipients as $recipient) {
            if (empty($recipient)) continue;

            try {
                if ($request->type === 'email') {
                    Mail::raw($request->content, function ($message) use ($recipient, $request) {
                        $message->to($recipient)
                                ->subject($request->subject ?? 'Annoucement from ResortWala');
                    });
                }
                
                EmailLog::create([
                    'channel' => $request->type,
                    'recipient' => $recipient,
                    'subject' => $request->subject ?? 'Broadcast',
                    'status' => 'sent',
                    'payload' => ['content' => $request->content, 'audience' => $request->audience_type]
                ]);

                $successCount++;
            } catch (\Exception $e) {
                EmailLog::create([
                    'channel' => $request->type,
                    'recipient' => $recipient,
                    'subject' => $request->subject ?? 'Broadcast',
                    'status' => 'failed',
                    'error_message' => $e->getMessage(),
                    'payload' => ['content' => $request->content, 'audience' => $request->audience_type]
                ]);
                $failCount++;
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Broadcast complete. Sent: $successCount, Failed: $failCount",
            'total' => count($recipients)
        ]);
    }
}
