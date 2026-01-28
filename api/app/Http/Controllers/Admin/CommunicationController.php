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
            if (empty($recipient))
                continue;

            try {
                $status = 'sent';
                $error = null;

                // Use NotificationEngine for centralized control (Test Mode, Logging etc.)
                // Create a dynamic data array for broadcast
                $data = [
                    'content' => $request->input('content'),
                    'subject' => $request->input('subject') ?? 'Annoucement from ResortWala',
                    'audience' => $request->audience_type
                ];

                // If it's a direct email/sms without a template, we might need a "broadcast" template
                // For now, if no template_id is used, we can directly call Mail or SMS logic 
                // OR we can create a generic "system.broadcast" trigger.

                // Recommendation: Refactor to engine but engine needs to support dynamic content 
                // for one-off messages. 

                // Architect Decision: Directly apply Test Mode check here to maintain 
                // CommunicationController's flexibility for now, while respecting safety.

                $finalRecipient = $recipient;
                $finalContent = $request->input('content');
                $finalSubject = $request->input('subject') ?? 'Annoucement from ResortWala';

                if (config('notification.test_mode', env('NOTIFICATION_TEST_MODE', false))) {
                    $finalRecipient = $request->type === 'email'
                        ? config('notification.test_email')
                        : config('notification.test_phone');
                    $finalContent = "[TEST] " . $finalContent;
                    $finalSubject = "[TEST] " . $finalSubject;
                }

                if ($request->type === 'email') {
                    Mail::raw($finalContent, function ($message) use ($finalRecipient, $finalSubject) {
                        $message->to($finalRecipient)
                            ->subject($finalSubject);
                    });
                }

                EmailLog::create([
                    'channel' => $request->type,
                    'recipient' => $finalRecipient,
                    'subject' => $finalSubject,
                    'status' => 'sent',
                    'payload' => ['content' => $finalContent, 'audience' => $request->audience_type]
                ]);

                $successCount++;
            } catch (\Exception $e) {
                EmailLog::create([
                    'channel' => $request->type,
                    'recipient' => $recipient,
                    'subject' => $request->input('subject') ?? 'Broadcast',
                    'status' => 'failed',
                    'error_message' => $e->getMessage(),
                    'payload' => ['content' => $request->input('content'), 'audience' => $request->audience_type]
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
