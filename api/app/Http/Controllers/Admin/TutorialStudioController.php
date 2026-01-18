<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Tutorial;
use App\Models\TutorialStep;
use Illuminate\Support\Facades\Storage;

class TutorialStudioController extends Controller
{
    // List all tutorials
    public function index()
    {
        return Tutorial::orderBy('created_at', 'desc')->get();
    }

    // Create a new tutorial container
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'category' => 'required|string',
            'target_role' => 'required|string'
        ]);

        $tutorial = Tutorial::create([
            'title' => $request->title,
            'description' => $request->description,
            'category' => $request->category,
            'target_role' => $request->target_role,
            'is_published' => false
        ]);

        return response()->json($tutorial, 201);
    }

    // Get single tutorial with steps
    public function show($id)
    {
        return Tutorial::with('steps')->findOrFail($id);
    }

    // Update tutorial details
    public function update(Request $request, $id)
    {
        $tutorial = Tutorial::findOrFail($id);
        $tutorial->update($request->only(['title', 'description', 'category', 'target_role', 'is_published']));
        return response()->json($tutorial);
    }

    // Upload Media for a step
    public function uploadMedia(Request $request, $id)
    {
        $request->validate([
            'file' => 'required|file|mimes:jpg,jpeg,png,mp4|max:10240', // 10MB max
        ]);

        if ($request->hasFile('file')) {
            $path = $request->file('file')->store('tutorials/media', 'public');
            return response()->json(['path' => $path]);
        }
        
        return response()->json(['error' => 'No file uploaded'], 400);
    }

    // Save/Sync Steps
    public function syncSteps(Request $request, $id)
    {
        $tutorial = Tutorial::findOrFail($id);
        
        // Expecting array of steps
        $stepsData = $request->input('steps', []);
        
        // Delete existing steps (simplest approach for sync)
        $tutorial->steps()->delete();

        foreach ($stepsData as $index => $step) {
            $tutorial->steps()->create([
                'order_index' => $index,
                'script_content' => $step['script_content'] ?? '',
                'media_path' => $step['media_path'] ?? null,
                'media_type' => $step['media_type'] ?? 'image',
                'visual_metadata' => $step['visual_metadata'] ?? null,
                'duration' => $step['duration'] ?? 5.0
            ]);
        }

        // Update total duration
        $totalDuration = $tutorial->steps()->sum('duration');
        $tutorial->update(['duration_seconds' => ceil($totalDuration)]);

        return response()->json($tutorial->load('steps'));
    }

    public function destroy($id)
    {
        $tutorial = Tutorial::findOrFail($id);
        $tutorial->delete();
        return response()->noContent();
    }

    // Trigger Video Render
    public function render(Request $request, $id)
    {
        $tutorial = Tutorial::with('steps')->findOrFail($id);
        
        // Create a Job to track this
        $job = \App\Models\VideoRenderJob::create([
             'template_id' => 'tutorial',
             'status' => 'pending',
             'options' => [
                 'tutorial_id' => $id,
                 'title' => $tutorial->title
             ]
        ]);

        // Dispatch background process (or run sync for now mostly sync for debugging)
        // Ideally: Artisan::call('video:process', ['jobId' => $job->id]);
        
        // For immediate feedback in V1, let's try direct service call via Exec helper like VideoGenerator
        // But better to use the logic we have in VideoGeneratorController which calls the artisan command
        
        // Let's use the artisan command we created earlier: video:process
        // NOTE: We need to update VideoRenderingService::processJob to handle 'tutorial' template type
        // which calls buildTutorialCommand instead of buildVideoCommand.
        
        // To avoid Service complexity right now, let's just create the job. 
        // AND we need to update VideoRenderingService to switch logic based on template_id
        
        return response()->json(['job_id' => $job->id, 'status' => 'pending']);
    }
    // List Recent Render Jobs
    public function jobs()
    {
        return \App\Models\VideoRenderJob::where('template_id', 'tutorial')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();
    }
}
