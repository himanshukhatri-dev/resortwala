<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\VideoRenderJob;
use App\Models\PropertyMaster;
use App\Services\VideoRenderingService;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class VideoGeneratorController extends Controller
{
    protected $service;

    public function __construct(VideoRenderingService $service)
    {
        $this->service = $service;
    }

    /**
     * Start a new video generation job
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'property_id' => 'required|exists:property_masters,PropertyId',
            'template_id' => 'required|string',
            'options' => 'sometimes|array',
            'options.title' => 'nullable|string',
            'options.subtitle' => 'nullable|string',
            'options.music_style' => 'nullable|string',
            'options.media_ids' => 'sometimes|array'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $job = new VideoRenderJob();
        $job->property_id = $request->property_id;
        $job->template_id = $request->template_id;
        $job->status = 'pending';
        $job->options = $request->options;
        $job->save();

        $job->save();

        // --- ASYNC PROCESSING FIX (504 Timeout) ---
        // Instead of processing strictly synchronously, we spawn a background process.
        
        // 1. Path to PHP binary (Standard on Ubuntu/Linux)
        $phpBinary = 'php'; 
        
        // 2. Path to Artisan
        $artisanPath = base_path('artisan');
        
        // 3. Construct Command: "php artisan video:process {id} > /dev/null 2>&1 &"
        // The "&" at the end puts it in background. nohup ensures it survives session.
        $command = "nohup {$phpBinary} {$artisanPath} video:process {$job->id} > /dev/null 2>&1 &";
        
        // 4. Execute
        exec($command);

        return response()->json([
            'message' => 'Video generation started (Async)',
            'job_id' => $job->id,
            'status' => 'pending', // Pending until background worker picks it up
            'job' => $job
        ], 201);
    }

    /**
     * Check job status
     */
    public function show($id)
    {
        $job = VideoRenderJob::findOrFail($id);
        
        $response = [
            'id' => $job->id,
            'status' => $job->status,
            'progress' => $job->status === 'completed' ? 100 : ($job->status === 'processing' ? 50 : 0),
            'url' => null
        ];

        if ($job->status === 'completed' && $job->output_path) {
            // Generate full URL
            // Assuming storage link is set up: php artisan storage:link
            $response['url'] = asset('storage/' . $job->output_path);
        }

        if ($job->status === 'failed') {
            $response['error'] = $job->error_message;
        }

        return response()->json($response);
    }

    /**
     * List recent jobs
     */
    public function index()
    {
        $jobs = VideoRenderJob::with('property:PropertyId,Name')
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();
            
        return response()->json($jobs);
    }
}
