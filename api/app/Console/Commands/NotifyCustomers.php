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
        $this->warn("NOTE: Firebase Push Notifications have been removed from this system.");

        $bar = $this->output->createProgressBar($customers->count());
        $bar->start();

        $tokens = $customers->pluck('fcm_token')->toArray();
        $chunks = array_chunk($tokens, 500);

        foreach ($chunks as $chunk) {
            // Stubbed: Log the notification intent
            Log::info("Notification Stub: Sending to " . count($chunk) . " devices: $title - $body");

            $bar->advance(count($chunk));
        }

        $bar->finish();
        $this->newLine();
        $this->info("Done! (Check logs for summary)");
    }
}
