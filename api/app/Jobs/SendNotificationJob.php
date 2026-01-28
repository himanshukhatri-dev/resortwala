<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Services\NotificationEngine;
use Illuminate\Support\Facades\Log;

class SendNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $backoff = 30;

    protected $eventName;
    protected $recipient;
    protected $data;

    /**
     * Create a new job instance.
     */
    public function __construct($eventName, $recipient, $data = [])
    {
        $this->eventName = $eventName;
        $this->recipient = $recipient;
        $this->data = $data;
    }

    /**
     * Execute the job.
     */
    public function handle()
    {
        Log::info("SendNotificationJob: Processing '{$this->eventName}' in background");

        $engine = new NotificationEngine();
        $engine->dispatch($this->eventName, $this->recipient, $this->data, true); // true = avoid recursive queueing
    }
}
