<?php

namespace App\Services;

use App\Models\LearningVideo;
use App\Models\VendorLearningProgress;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class LearningService
{
    /**
     * Get learning videos with user progress
     */
    public function getVideos(int $vendorId, ?string $category = null): Collection
    {
        $query = LearningVideo::query()
            ->where('is_active', true)
            ->with([
                'progress' => function ($q) use ($vendorId) {
                    $q->where('vendor_id', $vendorId);
                }
            ]);

        if ($category) {
            $query->where('category', $category);
        }

        return $query->orderBy('display_order')->get();
    }

    /**
     * Get a single video by slug with progress
     */
    public function getVideoBySlug(string $slug, int $vendorId): ?LearningVideo
    {
        return LearningVideo::query()
            ->where('slug', $slug)
            ->where('is_active', true)
            ->with([
                'progress' => function ($q) use ($vendorId) {
                    $q->where('vendor_id', $vendorId);
                }
            ])
            ->first();
    }

    /**
     * Update video progress
     */
    public function updateProgress(int $vendorId, int $videoId, array $data): VendorLearningProgress
    {
        return VendorLearningProgress::updateOrCreate(
            ['vendor_id' => $vendorId, 'video_id' => $videoId],
            array_merge($data, [
                'last_viewed_at' => now(),
                'status' => $this->determineStatus($data)
            ])
        );
    }

    /**
     * Determine status based on percentage
     */
    private function determineStatus(array $data): string
    {
        if (isset($data['status']))
            return $data['status'];

        $percentage = $data['completion_percentage'] ?? 0;

        if ($percentage >= 95)
            return 'completed';
        if ($percentage > 0)
            return 'in_progress';
        return 'not_started';
    }
}
