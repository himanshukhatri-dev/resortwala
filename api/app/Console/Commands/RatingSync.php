<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\PropertyMaster;
use App\Models\PropertyReview;
use App\Models\VendorLead;
use Illuminate\Support\Facades\DB;

class RatingSync extends Command
{
    protected $signature = 'resortwala:rating-sync';
    protected $description = 'Sync and calculate weighted ratings for properties';

    public function handle()
    {
        $this->info("Starting Rating Sync...");
        $properties = PropertyMaster::all();

        foreach ($properties as $property) {
            // 1. Internal Rating
            $internalStats = PropertyReview::where('property_id', $property->PropertyId)
                ->select(DB::raw('AVG(rating) as avg_rating'), DB::raw('COUNT(*) as review_count'))
                ->first();

            $internalRating = floatval($internalStats->avg_rating ?? 0);
            $internalCount = intval($internalStats->review_count ?? 0);

            // 2. Google Rating (Look up in leads by name/phone match if no external_id)
            $googleLead = VendorLead::where('name', 'like', '%' . $property->Name . '%')
                ->where('source', 'google')
                ->first();

            $googleRating = $googleLead ? floatval($googleLead->rating ?? 0) : 0;
            $googleCount = $googleLead ? intval($googleLead->review_count ?? 0) : 0;

            // 3. Weighted Calculation
            // Rule: 70% Internal, 30% Google
            // If internal is 0, use Google only (but with 80% weight of its score as safety)
            // If both 0, 0

            $weightedRating = 0;
            if ($internalCount > 0 && $googleCount > 0) {
                $weightedRating = ($internalRating * 0.7) + ($googleRating * 0.3);
            } elseif ($internalCount > 0) {
                $weightedRating = $internalRating;
            } elseif ($googleCount > 0) {
                $weightedRating = $googleRating * 0.9; // Slight penalty for 3rd party only
            }

            $property->update([
                'internal_rating' => $internalRating,
                'internal_review_count' => $internalCount,
                'google_rating' => $googleRating,
                'google_review_count' => $googleCount,
                'customer_avg_rating' => round($weightedRating, 2)
            ]);
        }

        $this->info("Rating Sync Completed.");
    }
}
