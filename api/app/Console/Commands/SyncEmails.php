<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\EmailCredential;
use App\Services\ImapService;
use Illuminate\Support\Facades\Log;

class SyncEmails extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'email:sync {email? : Specific email to sync}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync emails from configured IMAP accounts';

    /**
     * Execute the console command.
     */
    public function handle(ImapService $imapService)
    {
        $email = $this->argument('email');
        
        $query = EmailCredential::where('is_active', true);
        if ($email) {
            $query->where('email', $email);
        }
        
        $credentials = $query->get();
        
        $this->info("Found " . $credentials->count() . " active credentials.");

        foreach ($credentials as $cred) {
            $this->info("Syncing {$cred->email}...");
            
            try {
                $result = $imapService->sync($cred);
                
                if (isset($result['status']) && $result['status'] === 'success') {
                    $this->info("Done. New emails: " . $result['count']);
                } else {
                     $msg = $result['message'] ?? 'Unknown error';
                     $this->error("Failed: $msg");
                }
                
            } catch (\Exception $e) {
                $this->error("Exception: " . $e->getMessage());
                Log::error("Sync Command Failed for {$cred->email}: " . $e->getMessage());
            }
        }
        
        return 0;
    }
}
