<?php

namespace App\Services;

use App\Models\PageWalkthrough;
use App\Models\VendorWalkthroughProgress;
use Illuminate\Support\Collection;

class WalkthroughService
{
    /**
     * Get walkthrough for a specific page route
     */
    public function getWalkthroughForPage(string $route, int $vendorId): ?PageWalkthrough
    {
        $walkthrough = PageWalkthrough::query()
            ->where('page_route', $route)
            ->where('is_active', true)
            ->first();

        if (!$walkthrough)
            return null;

        // Check if already completed or dismissed
        $progress = VendorWalkthroughProgress::where('vendor_id', $vendorId)
            ->where('walkthrough_id', $walkthrough->id)
            ->first();

        // If completed/dismissed, don't show automatically (unless requested explicitly)
        // Logic can be refined based on trigger type (e.g. manual restart)

        // Attach progress to the model instance for the controller to use
        $walkthrough->vendor_progress = $progress;

        return $walkthrough;
    }

    /**
     * Update walkthrough progress
     */
    public function updateProgress(int $vendorId, int $walkthroughId, array $data): VendorWalkthroughProgress
    {
        $progress = VendorWalkthroughProgress::updateOrCreate(
            ['vendor_id' => $vendorId, 'walkthrough_id' => $walkthroughId],
            array_merge($data, ['last_interaction_at' => now()])
        );

        // Check for completion
        if (($data['status'] ?? '') === 'completed') {
            $progress->completed_at = now();
            $progress->save();
        }

        return $progress;
    }
}
