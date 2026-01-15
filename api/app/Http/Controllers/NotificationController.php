<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\NotificationLog;
use App\Models\UserDeviceToken;
use App\Models\User;
use App\Services\FCMService;
use Illuminate\Support\Facades\Validator;

class NotificationController extends Controller
{
    protected $fcm;

    public function __construct(FCMService $fcm)
    {
        $this->fcm = $fcm;
    }

    /**
     * Register Device Token (Called from App)
     */
    public function registerToken(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'device_token' => 'required|string',
            'platform' => 'nullable|string|in:android,ios,web',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 422);
        }

        $userId = $request->user() ? $request->user()->id : null;

        // If authenticated, update/create linked to user
        if ($userId) {
            UserDeviceToken::updateOrCreate(
                ['device_token' => $request->device_token],
                [
                    'user_id' => $userId,
                    'platform' => $request->platform ?? 'android',
                    'last_seen_at' => now()
                ]
            );
        }

        return response()->json(['message' => 'Token registered successfully']);
    }

    /**
     * Send Notification (Admin)
     */
    public function send(Request $request)
    {
        $request->validate([
            'title' => 'required|string',
            'body' => 'required|string',
            'audience' => 'required|in:all,vendor,specific',
            'user_ids' => 'required_if:audience,specific|array'
        ]);

        $title = $request->title;
        $body = $request->body;
        $audience = $request->audience;
        
        $result = ['success' => 0, 'failure' => 0];

        if ($audience === 'all') {
            // Send to topic 'all_users'
            $result = $this->fcm->sendToTopic('all_users', $title, $body);
        } elseif ($audience === 'vendor') {
            // Get all vendor IDs
            $vendorIds = User::where('role', 'vendor')->pluck('id')->toArray();
            $result = $this->fcm->sendToUsers($vendorIds, $title, $body);
        } elseif ($audience === 'specific') {
            $result = $this->fcm->sendToUsers($request->user_ids, $title, $body);
        }

        // Log
        NotificationLog::create([
            'title' => $title,
            'body' => $body,
            'audience_type' => $audience,
            'audience_data' => $audience === 'specific' ? $request->user_ids : null,
            'sent_count' => ($result['success'] ?? 0) + ($result['failure'] ?? 0),
            'success_count' => $result['success'] ?? 0,
            'failure_count' => $result['failure'] ?? 0,
            'created_by' => $request->user()->id
        ]);

        return response()->json(['message' => 'Notification dispatched', 'result' => $result]);
    }

    /**
     * Get Notification Logs
     */
    public function logs()
    {
        $logs = NotificationLog::orderBy('created_at', 'desc')->paginate(20);
        return response()->json($logs);
    }
}
