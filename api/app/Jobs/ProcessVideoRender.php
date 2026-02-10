<?php

namespace App\Jobs;

use App\Models\VideoRenderJob;
use App\Services\VideoRenderingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessVideoRender implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $jobRecord;

    /**
     * The number of seconds the job can run before timing out.
     *
     * @var int
     */
    public $timeout = 600; // 10 minutes for video rendering

    /**
     * Create a new job instance.
     *
     * @return void
     */
    public function __construct(VideoRenderJob $jobRecord)
    {
        $this->jobRecord = $jobRecord;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle(VideoRenderingService $service)
    {
        Log::info("Starting Background Video Rendering Job", ['job_id' => $this->jobRecord->id]);

        try {
            $service->processJob($this->jobRecord);
            Log::info("Background Video Rendering Job Completed Successfully", ['job_id' => $this->jobRecord->id]);
        } catch (\Exception $e) {
            Log::error("Background Video Rendering Job Failed", [
                'job_id' => $this->jobRecord->id,
                'error' => $e->getMessage()
            ]);

            $this->jobRecord->update([
                'status' => 'failed',
                'error_message' => $e->getMessage()
            ]);

            throw $e;
        }
    }
}
