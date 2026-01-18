<?php

namespace App\Services;

use App\Models\EmailCredential;
use App\Models\EmailMessage;
use App\Models\EmailAttachment;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;

class ImapService
{
    /**
     * Connect to IMAP mailbox
     * @param EmailCredential $credential
     * @param string $folder
     * @return resource|false
     */
    protected function connect(EmailCredential $credential, $folder = 'INBOX')
    {
        $server = "{{$credential->imap_host}:{$credential->imap_port}/imap/{$credential->imap_encryption}}";
        $mailbox = $server . $folder;
        $username = $credential->email;
        $password = $credential->password_decrypted; // Accessor

        try {
            // Suppress warnings to handle connection errors gracefully
            $conn = @imap_open($mailbox, $username, $password);
            
            if (!$conn) {
                $error = imap_last_error();
                Log::error("IMAP Connection Failed for {$username}: {$error}");
                $credential->update(['last_error' => "Connection Failed: $error"]);
                return false;
            }
            
            return $conn;
        } catch (\Throwable $e) {
            Log::error("IMAP Exception: " . $e->getMessage());
            $credential->update(['last_error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Sync emails for a credential
     */
    public function sync(EmailCredential $credential)
    {
        $conn = $this->connect($credential);
        if (!$conn) return ['status' => 'error', 'message' => 'Connection failed'];

        // Get unread messages or recent ones
        // Since: "SINCE 1-Jan-2025" or similar logic?
        // Better: Search UNSEEN first, then maybe recent
        $searchCriteria = 'UNSEEN';
        
        // If first sync, maybe restrict to last 3 days to avoid overload?
        if (!$credential->last_synced_at) {
             $since = date('d-M-Y', strtotime('-3 days'));
             $searchCriteria .= " SINCE \"$since\"";
        }

        $emailIds = imap_search($conn, $searchCriteria);
        
        $count = 0;
        if ($emailIds) {
            // Sort newest first
            rsort($emailIds);
            
            foreach ($emailIds as $msgNumber) {
                try {
                    $header = imap_headerinfo($conn, $msgNumber);
                    $structure = imap_fetchstructure($conn, $msgNumber);
                    
                    // Parse Headers
                    $messageId = $header->message_id ?? $header->unique_id ?? md5($header->date . $header->subject);
                    // Standardize MessageID to avoid duplicates (remove < >)
                    $messageId = trim($messageId, '<>');

                    // Check if exists
                    if (EmailMessage::where('message_id', $messageId)->exists()) {
                        continue;
                    }

                    $subject = $this->decodeMimeStr($header->subject ?? '(No Subject)');
                    $fromEmail = $header->from[0]->mailbox . '@' . $header->from[0]->host;
                    $fromName = $this->decodeMimeStr($header->from[0]->personal ?? $fromEmail);
                    $date = date('Y-m-d H:i:s', $header->udate);
                    
                    // Fetch Body
                    $bodyData = $this->fetchBody($conn, $msgNumber, $structure);
                    
                    // Store Message
                    $email = EmailMessage::create([
                        'credential_id' => $credential->id,
                        'message_id' => $messageId,
                        'subject' => $subject,
                        'from_name' => $fromName,
                        'from_email' => $fromEmail,
                        'to_email' => $header->toaddress ?? 'Me', // Simplified
                        'body_html' => $bodyData['html'],
                        'body_text' => $bodyData['text'],
                        'date_received' => $date,
                        'folder' => 'INBOX',
                        'is_read' => false
                    ]);

                    // Handle Attachments
                    if (!empty($bodyData['attachments'])) {
                        foreach ($bodyData['attachments'] as $att) {
                            // Move to storage
                            // $att['data'] is raw content
                            $filename = $att['filename'] ?? 'unknown';
                            $path = 'emails/' . $email->id . '/' . $filename;
                            Storage::put('public/' . $path, $att['data']);
                            
                            EmailAttachment::create([
                                'email_message_id' => $email->id,
                                'filename' => $filename,
                                'path' => $path,
                                'mime_type' => 'application/octet-stream', // TODO: detect
                                'size_bytes' => strlen($att['data'])
                            ]);
                        }
                    }

                    $count++;

                } catch (\Exception $e) {
                    Log::error("Failed to parse email $msgNumber: " . $e->getMessage());
                }
            }
        }

        $credential->update([
            'last_synced_at' => now(),
            'last_error' => null
        ]);
        
        imap_close($conn);
        return ['status' => 'success', 'count' => $count];
    }
    
    // --- Helpers ---

    private function decodeMimeStr($string) {
        $elements = imap_mime_header_decode($string);
        $result = '';
        foreach ($elements as $element) {
            $result .= $element->text;
        }
        return $result;
    }

    private function fetchBody($conn, $msgNumber, $structure) {
        $result = ['text' => '', 'html' => '', 'attachments' => []];
        
        $this->parseStructure($conn, $msgNumber, $structure, "", $result);
        
        // If HTML empty but Text exists, use Text
        if (empty($result['html']) && !empty($result['text'])) {
            $result['html'] = nl2br($result['text']);
        }
        
        return $result;
    }

    private function parseStructure($conn, $msgNumber, $structure, $partNumberStr, &$result) {
        $params = [];
        if (isset($structure->parameters)) {
            foreach ($structure->parameters as $p) $params[strtolower($p->attribute)] = $p->value;
        }
        if (isset($structure->dparameters)) {
            foreach ($structure->dparameters as $p) $params[strtolower($p->attribute)] = $p->value;
        }

        if (isset($structure->parts)) {
            // Multipart
            foreach ($structure->parts as $index => $subStructure) {
                // Warning: Part numbers are 1-based, e.g., 1.1, 1.2
                $prefix = ($partNumberStr) ? $partNumberStr . '.' : '';
                $this->parseStructure($conn, $msgNumber, $subStructure, $prefix . ($index + 1), $result);
            }
        } else {
            // Single Part
            $partNumber = ($partNumberStr) ? $partNumberStr : 1;
            $data = imap_fetchbody($conn, $msgNumber, $partNumber);
            
            // Decode
            if ($structure->encoding == 3) $data = base64_decode($data);
            elseif ($structure->encoding == 4) $data = quoted_printable_decode($data);

            // Access/Disposition
            $isAttachment = false;
            if (isset($structure->disposition) && strtolower($structure->disposition) == 'attachment') {
                $isAttachment = true;
            }
            // Check filename in params
            $filename = $params['filename'] ?? $params['name'] ?? null;
            
            if ($isAttachment || $filename) {
                $result['attachments'][] = [
                    'filename' => $filename,
                    'data' => $data
                ];
            } else {
                // Content
                if ($structure->subtype == 'PLAIN') {
                    $result['text'] .= $data;
                } elseif ($structure->subtype == 'HTML') {
                    $result['html'] .= $data;
                }
            }
        }
    }
}
