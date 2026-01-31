<?php

namespace App\Services;

use App\Models\VendorOnboardingMilestone;
use Illuminate\Support\Facades\DB;

class OnboardingService
{
    /**
     * Get or create milestone record for vendor
     */
    public function getMilestones(int $vendorId): VendorOnboardingMilestone
    {
        return VendorOnboardingMilestone::firstOrCreate(
            ['vendor_id' => $vendorId]
        );
    }

    /**
     * Update a specific milestone
     */
    public function updateMilestone(int $vendorId, string $milestone): VendorOnboardingMilestone
    {
        $record = $this->getMilestones($vendorId);

        // Define allowable milestones and their corresponding timestamp columns
        $milestones = [
            'profile_completed' => 'profile_completed_at',
            'property_added' => 'property_added_at',
            'pricing_set' => 'pricing_set_at',
            'availability_updated' => 'availability_updated_at',
            'photos_uploaded' => 'photos_uploaded_at',
            'property_published' => 'property_published_at',
            'first_booking_received' => 'first_booking_received_at',
            'payout_setup' => 'payout_setup_at',
        ];

        if (!array_key_exists($milestone, $milestones)) {
            return $record; // Invalid milestone
        }

        if (!$record->{$milestone}) {
            $record->{$milestone} = true;
            $record->{$milestones[$milestone]} = now();

            // Recalculate completion percentage
            $completedCount = 0;
            foreach ($milestones as $key => $ts) {
                if ($record->{$key})
                    $completedCount++;
            }

            $totalMilestones = count($milestones);
            $record->completion_percentage = ($completedCount / $totalMilestones) * 100;

            // Check if fully completed
            if ($record->completion_percentage >= 100 && !$record->onboarding_completed) {
                $record->onboarding_completed = true;
                $record->onboarding_completed_at = now();
            }

            $record->save();
        }

        return $record;
    }
}
