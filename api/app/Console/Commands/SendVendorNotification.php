<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use App\Mail\GenericNotificationMail;

class SendVendorNotification extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notify:vendors {message="Notification is on"}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send a notification email to all vendors';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $messageContent = $this->argument('message');
        
        $this->info("Fetching vendors...");
        
        $vendors = User::where('role', 'vendor')->get();
        
        $count = $vendors->count();
        
        if ($count === 0) {
            $this->warn("No vendors found.");
            return;
        }
        
        $this->info("Found {$count} vendors. Sending notifications...");
        
        $bar = $this->output->createProgressBar($count);
        $bar->start();
        
        foreach ($vendors as $vendor) {
            if ($vendor->email) {
                try {
                    Mail::to($vendor->email)->send(new GenericNotificationMail("Platform Notification", $messageContent));
                } catch (\Exception $e) {
                    $this->error("\nFailed to send to {$vendor->email}: " . $e->getMessage());
                }
            }
            $bar->advance();
        }
        
        $bar->finish();
        $this->newLine();
        $this->info("Notifications sent successfully!");
    }
}
