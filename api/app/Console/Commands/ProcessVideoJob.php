<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\VideoRenderJob;
use App\Services\VideoRenderingService;
use Illuminate\Support\Facades\Log;

class ProcessVideoJob extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'video:process {id}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process a video render job by ID';

    protected $service;

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct(VideoRenderingService $service)
    {
        parent::__construct();
        $this->service = $service;
    }

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $id = $this->argument('id');
        Log::info("Starting Video Job processing for ID: {$id}");

        $job = VideoRenderJob::find($id);

        if (!$job) {
            Log::error("Video Job ID {$id} not found.");
            return 1;
        }

        try {
            // Increase memory and time limits for the CLI process
            ini_set('memory_limit', '1024M');
            set_time_limit(0); // Infinite time for CLI

            $this->service->processJob($job);
            
            Log::info("Video Job ID {$id} completed.");
            return 0;
        } catch (\Exception $e) {
            Log::error("Video Job ID {$id} failed: " . $e->getMessage());
            return 1;
        }
    }
}
