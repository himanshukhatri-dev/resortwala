<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TrackEventJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $eventData;

    /**
     * Create a new job instance.
     */
    public function __construct(array $eventData)
    {
        $this->eventData = $eventData;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            DB::table('user_events')->insert([
                'session_id' => $this->eventData['session_id'],
                'user_id' => $this->eventData['user_id'] ?? null,
                'event_type' => $this->eventData['event_type'],
                'event_category' => $this->eventData['event_category'],
                'event_data' => json_encode($this->eventData['event_data']),
                'context' => json_encode($this->eventData['context']),
                'created_at' => now()
            ]);

            Log::info('Event tracked', [
                'type' => $this->eventData['event_type'],
                'session' => $this->eventData['session_id']
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to track event', [
                'error' => $e->getMessage(),
                'event' => $this->eventData
            ]);
            throw $e;
        }
    }
}
