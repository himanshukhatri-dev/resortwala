<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Customer;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NotifyCustomers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notify:customers 
                            {--title=ResortWala Update : Notification Title} 
                            {--body=Check out our latest offers! : Notification Body} 
                            {--image= : Optional Image URL}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send Push Notification to all Customers';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $title = $this->option('title');
        $body = $this->option('body');
        $image = $this->option('image');

        $this->info("Preparing to send notification...");
        $this->info("Title: $title");
        $this->info("Body: $body");
        
        $customers = Customer::whereNotNull('fcm_token')->get();
        
        if ($customers->isEmpty()) {
            $this->warn("No customers with registered devices found.");
            return;
        }

        $this->info("Found " . $customers->count() . " target devices.");

        // NOTE: Firebase Server Key is required here.
        // You can get this from Project Settings > Cloud Messaging > Cloud Messaging API (Legacy)
        // Or set up Service Account for HTTP v1 (more complex)
        
        // We will try to fetch from ENV, or warn user
        $serverKey = env('FIREBASE_SERVER_KEY');
        
        if (!$serverKey) {
            $this->warn("FIREBASE_SERVER_KEY is missing in .env. Performing DRY RUN (Logging only).");
        }

        $bar = $this->output->createProgressBar($customers->count());
        $bar->start();

        $tokens = $customers->pluck('fcm_token')->toArray();
        
        // For better performance, FCM supports multicast (up to 1000 tokens per request)
        // We will do chunks of 500
        $chunks = array_chunk($tokens, 500);

        foreach ($chunks as $chunk) {
            if ($serverKey) {
                // Actual Send Logic (Legacy API is easiest for simple script)
                try {
                    $response = Http::withHeaders([
                        'Authorization' => 'key=' . $serverKey,
                        'Content-Type' => 'application/json',
                    ])->post('https://fcm.googleapis.com/fcm/send', [
                        'registration_ids' => $chunk,
                        'notification' => [
                            'title' => $title,
                            'body' => $body,
                            'image' => $image,
                            'icon' => 'https://resortwala.com/logo.png' // Default icon
                        ],
                        'priority' => 'high'
                    ]);
                    
                    if ($response->failed()) {
                        Log::error('FCM Send Failed: ' . $response->body());
                    }
                } catch (\Exception $e) {
                    Log::error('FCM Exception: ' . $e->getMessage());
                }
            } else {
                // Dry Run
                Log::info("DRY RUN: Sending to " . count($chunk) . " devices: $title - $body");
            }
            
            $bar->advance(count($chunk));
        }

        $bar->finish();
        $this->newLine();
        $this->info("Done! (Check logs if Key was missing)");
    }
}
