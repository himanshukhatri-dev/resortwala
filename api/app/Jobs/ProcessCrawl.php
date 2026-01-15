<?php

namespace App\Jobs;

use App\Models\CrawlJob;
use App\Services\Intelligence\LeadPipelineService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessCrawl implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $jobId;
    protected $limit;

    /**
     * Create a new job instance.
     */
    public function __construct($jobId, $limit = 10)
    {
        $this->jobId = $jobId;
        $this->limit = $limit;
    }

    /**
     * Execute the job.
     */
    public function handle(LeadPipelineService $pipeline): void
    {
        $crawlJob = CrawlJob::find($this->jobId);

        if (!$crawlJob) {
            Log::error("ProcessCrawl: Job ID {$this->jobId} not found.");
            return;
        }

        try {
            Log::info("ProcessCrawl: Starting job {$this->jobId} for city {$crawlJob->city} ({$crawlJob->category}) with limit {$this->limit}");
            
            // Pass the limit to the service
            $pipeline->runCrawler($crawlJob, $this->limit);
            
        } catch (\Exception $e) {
            Log::error("ProcessCrawl: Job failed - " . $e->getMessage());
            $crawlJob->status = 'failed';
            $crawlJob->error_count = 1; // Mark critical failure
            $crawlJob->error_message = $e->getMessage();
            $crawlJob->save();
        }
    }
}
