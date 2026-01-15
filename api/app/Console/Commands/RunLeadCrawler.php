<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\CrawlJob;
use App\Services\Intelligence\LeadPipelineService;

class RunLeadCrawler extends Command
{
    protected $signature = 'crawler:run {city} {--bg}';
    protected $description = 'Crawl vendor leads for a specific city';

    protected $pipeline;

    public function __construct(LeadPipelineService $pipeline)
    {
        parent::__construct();
        $this->pipeline = $pipeline;
    }

    public function handle()
    {
        $city = $this->argument('city');
        $this->info("Starting crawler for city: $city");

        // Create Job Record
        $job = CrawlJob::create([
            'city' => $city,
            'source' => 'google',
            'status' => 'pending',
            'triggered_by' => null // System/CLI
        ]);

        if ($this->option('bg')) {
            // In a real env, dispatch job to queue
            // ProcessPodcast::dispatch($job);
            // sending to bg via queue is better, but valid for now
            $this->info("Job {$job->id} created (Queue mode not fully implemented, running sync for demo)");
        }

        $this->pipeline->runCrawler($job);

        $this->info("Crawler finished. Found: {$job->leads_found}, Added: {$job->leads_added}");
        return 0;
    }
}
