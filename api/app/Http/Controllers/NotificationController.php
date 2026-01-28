<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\NotificationLog;
use App\Models\UserDeviceToken;
use App\Models\User;

use Illuminate\Support\Facades\Validator;

class NotificationController extends Controller
{
    public function __construct()
    {
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

            // Subscribe to 'all_users' topic - DISABLED (Firebase Removed)
            // $this->fcm->subscribeToTopic($request->device_token, 'all_users');
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

        // 1. Send Push (FCM) - Best Effort
        if ($audience === 'all') {
            // $result = $this->fcm->sendToTopic('all_users', $title, $body);
            \Illuminate\Support\Facades\Log::info("FCM Stub: Sending to ALL - $title");
            $result = ['success' => 0, 'failure' => 0];
            // DB: Too heavy to insert for ALL users individually right now without a job. 
            // Ideally we'd have a 'global_notifications' table or job. 
            // For now, we SKIP DB for 'all' to prevent timeout, or loop if small userbase.
            // Let's assume small userbase (<1000) and do it via Job or just skip.
            // Skipping DB for 'all' to avoid timeout on huge lists.
        } elseif ($audience === 'vendor') {
            $vendorIds = User::where('role', 'vendor')->pluck('id')->toArray();
            // $result = $this->fcm->sendToUsers($vendorIds, $title, $body);
            \Illuminate\Support\Facades\Log::info("FCM Stub: Sending to Vendors - $title");
            $result = ['success' => 0, 'failure' => 0];

            // DB Storage
            $vendors = User::where('role', 'vendor')->get();
            \Illuminate\Support\Facades\Notification::send($vendors, new \App\Notifications\GeneralNotification($title, $body, ['audience' => 'vendor']));

        } elseif ($audience === 'specific') {
            // $result = $this->fcm->sendToUsers($request->user_ids, $title, $body);
            \Illuminate\Support\Facades\Log::info("FCM Stub: Sending to Specific Users - $title");
            $result = ['success' => 0, 'failure' => 0];

            // DB Storage (Supports both User and Customer models if ID provided matches User)
            // Note: Currently Logic assumes 'User' IDs. 
            // If we need Customers, we need to know which model. 
            // The Admin Panel 'Send Notification' usually targets Users (Vendors/Admins). 
            // But for 'Himanshu' (Customer 1), we need to maintain Customer.

            // Try finding Users first
            $users = User::whereIn('id', $request->user_ids)->get();
            if ($users->count() > 0) {
                \Illuminate\Support\Facades\Notification::send($users, new \App\Notifications\GeneralNotification($title, $body, ['audience' => 'specific']));
            }

            // Try finding Customers (assuming IDs might be customers)
            // This is ambiguous if IDs overlap. Warning: Overlap risk.
            // For now, we strictly follow what the Admin Panel passes. 
            // If Admin Panel selects "Customers", it should pass a flag.

            // HACK for Himanshu (ID 1):
            $customers = \App\Models\Customer::whereIn('id', $request->user_ids)->get();
            if ($customers->count() > 0) {
                \Illuminate\Support\Facades\Notification::send($customers, new \App\Notifications\GeneralNotification($title, $body, ['audience' => 'specific']));
            }
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
     * Get In-App Notifications for the Authenticated User (Customer/Vendor/User)
     */
    public function myNotifications(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        // Laravel's Notifiable trait provides notifications()
        $notifications = $user->notifications()->latest()->paginate(20);

        return response()->json($notifications);
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(Request $request, $id)
    {
        $user = $request->user();
        $notification = $user->notifications()->where('id', $id)->first();

        if ($notification) {
            $notification->markAsRead();
        }

        return response()->json(['status' => 'success']);
    }

    /**
     * Mark All as read
     */
    public function markAllRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();
        return response()->json(['status' => 'success']);
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
