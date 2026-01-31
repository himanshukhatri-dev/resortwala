<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\LearningService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LearningVideoController extends Controller
{
    private $learningService;

    public function __construct(LearningService $learningService)
    {
        $this->learningService = $learningService;
    }

    /**
     * Get list of learning videos
     */
    public function index(Request $request)
    {
        $vendorId = Auth::id(); // Assuming vendor is authenticated user
        $category = $request->query('category');

        $videos = $this->learningService->getVideos($vendorId, $category);

        return response()->json([
            'status' => 'success',
            'data' => $videos
        ]);
    }

    /**
     * Get single video details
     */
    public function show($slug)
    {
        $vendorId = Auth::id();
        $video = $this->learningService->getVideoBySlug($slug, $vendorId);

        if (!$video) {
            return response()->json([
                'status' => 'error',
                'message' => 'Video not found'
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $video
        ]);
    }

    /**
     * Update video progress
     */
    public function updateProgress(Request $request, $id)
    {
        $request->validate([
            'watch_duration_seconds' => 'nullable|integer',
            'completion_percentage' => 'nullable|integer|min:0|max:100',
            'status' => 'nullable|in:not_started,in_progress,completed,skipped',
            'is_helpful' => 'nullable|boolean',
            'rating' => 'nullable|integer|min:1|max:5',
            'feedback' => 'nullable|string'
        ]);

        $vendorId = Auth::id();

        $progress = $this->learningService->updateProgress($vendorId, $id, $request->all());

        return response()->json([
            'status' => 'success',
            'data' => $progress
        ]);
    }
}
