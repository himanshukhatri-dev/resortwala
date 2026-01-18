<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\EmailCredential;
use App\Models\EmailMessage;
use App\Services\ImapService;

class SharedInboxController extends Controller
{
    // List Emails
    public function index(Request $request)
    {
        $query = EmailMessage::with(['credential', 'attachments'])
            ->orderBy('date_received', 'desc');

        if ($request->has('folder')) {
            $query->where('folder', $request->query('folder', 'INBOX'));
        }
        
        if ($request->has('status')) { // filter by read/unread
             if ($request->status === 'unread') $query->where('is_read', false);
        }

        $emails = $query->paginate(20);
        return response()->json($emails);
    }

    // Get Single
    public function show($id)
    {
        $email = EmailMessage::with(['attachments', 'credential'])->findOrFail($id);
        
        // Mark as read automatically
        if (!$email->is_read) {
            $email->update(['is_read' => true]);
        }

        return response()->json($email);
    }

    // Manual Sync
    public function sync(Request $request) 
    {
        // For now, sync the default primary credential or all
        $credentials = EmailCredential::where('is_active', true)->get();
        $results = [];
        
        $imap = new ImapService(); // DI is better but manual for now
        
        foreach ($credentials as $cred) {
            $results[$cred->email] = $imap->sync($cred);
        }
        
        return response()->json(['message' => 'Sync completed', 'details' => $results]);
    }
    
    // Update Status (Star, Unread)
    public function update(Request $request, $id)
    {
        $email = EmailMessage::findOrFail($id);
        $email->update($request->only(['is_read', 'is_starred', 'status', 'assigned_to']));
        return response()->json($email);
    }
    
    // --- Settings (Credentials) ---
    public function getSettings() {
        // Hide password in response
        return response()->json(EmailCredential::all());
    }
    
    public function updateSettings(Request $request) {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'nullable|string', // If provided, update
            'imap_host' => 'required',
            'imap_port' => 'required',
            'smtp_host' => 'required',
            'smtp_port' => 'required'
        ]);
        
        // Update or Create
        $cred = EmailCredential::updateOrCreate(
            ['email' => $validated['email']],
            $request->except('password')
        );
        
        if (!empty($request->password)) {
             $cred->password = $request->password; // Uses Mutator
             $cred->save();
        }
        
        return response()->json($cred);
    }

    // Send Email
    public function send(Request $request)
    {
        $request->validate([
             'to' => 'required|email',
             'subject' => 'required|string',
             'body' => 'required|string', // HTML
             'from_email' => 'required|email' // Which credential to use
        ]);

        $cred = EmailCredential::where('email', $request->from_email)->firstOrFail();

        // 1. Configure Mailer at Runtime
        // Note: In production, you might want to use a more robust way (SmtpService)
        // For now, we set the global config.
        config([
            'mail.mailers.smtp.host' => $cred->smtp_host,
            'mail.mailers.smtp.port' => $cred->smtp_port,
            'mail.mailers.smtp.username' => $cred->username,
            'mail.mailers.smtp.password' => $cred->password, // Mutator handles decryption
            'mail.from.address' => $cred->email,
            'mail.from.name' => 'Resortwala Admin',
        ]);

        try {
            \Illuminate\Support\Facades\Mail::html($request->body, function($message) use ($request) {
                 $message->to($request->to)
                         ->subject($request->subject);
            });
            
            // 2. Save to Sent Folder (Database)
            EmailMessage::create([
                'email_credential_id' => $cred->id,
                'message_id' => \Illuminate\Support\Str::uuid() . '@resortwala.com', // Fake ID for now
                'subject' => $request->subject,
                'from_email' => $cred->email,
                'from_name' => 'Me',
                'to_email' => $request->to,
                'body_html' => $request->body,
                'body_text' => strip_tags($request->body),
                'date_received' => now(),
                'is_read' => true,
                'folder' => 'SENT'
            ]);

            return response()->json(['message' => 'Email sent successfully']);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
