<?php

namespace App\Services;

use App\Models\LearningModule;
use App\Models\VendorLearningProgress;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class LearningService
{
    /**
     * Get learning modules with user progress
     */
    public function getVideos(int $vendorId, ?string $category = null): Collection
    {
        // Renaming method conceptually but keeping name for Controller compatibility for now
        $query = LearningModule::query()
            ->where('is_active', true)
            ->with([
                'progress' => function ($q) use ($vendorId) {
                    $q->where('vendor_id', $vendorId);
                },
                'steps' // Added steps here
            ]);

        if ($category) {
            $query->where('category', $category);
        }

        // Default sort by id since we don't have display_order yet
        return $query->orderBy('id')->get();
    }

    /**
     * Get a single module by slug with progress and steps
     */
    public function getVideoBySlug(string $slug, int $vendorId): ?LearningModule
    {
        return LearningModule::query()
            ->where('slug', $slug)
            ->where('is_active', true)
            ->with([
                'progress' => function ($q) use ($vendorId) {
                    $q->where('vendor_id', $vendorId);
                },
                'steps' // Eager load steps
            ])
            ->first();
    }

    /**
     * Update module progress
     */
    public function updateProgress(int $vendorId, int $moduleId, array $data): VendorLearningProgress
    {
        return VendorLearningProgress::updateOrCreate(
            ['vendor_id' => $vendorId, 'module_id' => $moduleId],
            array_merge($data, [
                'completed_at' => isset($data['status']) && $data['status'] === 'completed' ? now() : null,
                // 'status' => $this->determineStatus($data) // status is usually passed directly now
            ])
        );
    }
}
