<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use App\Models\PropertyMaster;
use Carbon\Carbon;

class SmartSortingService
{
    /**
     * Apply weighted scoring to the property query based on user preferences and business signals.
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param array $prefs User preferences from cookies
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function applySmartSorting($query, array $prefs = [])
    {
        $now = Carbon::now();
        $isWeekend = in_array($now->dayOfWeek, [Carbon::FRIDAY, Carbon::SATURDAY, Carbon::SUNDAY]);

        // Weights (Configurable via env or config)
        $weights = [
            'relevance' => 50,
            'availability' => 30,
            'popularity' => 15,
            'trust' => 15,
            'recency' => 5
        ];

        // 1. Relevance Signals (Category, Location, Price)
        $lastCategory = $prefs['cat'] ?? null;
        $lastLocation = $prefs['loc'] ?? null;
        $prefMinPrice = floatval($prefs['p_min'] ?? 0);
        $prefMaxPrice = floatval($prefs['p_max'] ?? 1000000);

        // 2. Availability Signal (Boost properties available today or this weekend)
        // For simplicity, we characterize "Busy" properties by their recent booking count.
        // A property with high recent bookings but NOT fully booked is high discovery.

        // 3. Trust Signal (Rating)

        // Construction of Raw Scoring SQL
        $relevanceSql = $this->buildRelevanceSql($lastCategory, $lastLocation, $prefMinPrice, $prefMaxPrice);
        $trustSql = "COALESCE(Rating, 0) * 3"; // Rating 5 = 15 points
        $recencySql = "CASE WHEN created_at >= '" . $now->subDays(30)->toDateTimeString() . "' THEN 5 ELSE 0 END";

        // Popularity Signal: Subquery for recent bookings (last 90 days)
        $popularitySubquery = "(SELECT COUNT(*) FROM bookings WHERE bookings.PropertyId = property_masters.PropertyId AND bookings.created_at >= '" . Carbon::now()->subDays(90)->toDateTimeString() . "')";

        $finalScoreSql = "({$relevanceSql}) + ({$trustSql}) + ({$recencySql}) + (({$popularitySubquery}) * 2)";

        $query->select('*', DB::raw("($finalScoreSql) as discovery_score"));

        // If sorting isn't explicitly requested, use discovery_score
        return $query->orderBy('discovery_score', 'desc')
            ->orderBy('customer_avg_rating', 'desc');
    }

    /**
     * Build the relevance part of the scoring SQL.
     */
    private function buildRelevanceSql($category, $location, $minPrice, $maxPrice)
    {
        $clauses = [];

        // Category Match
        if ($category) {
            $cat = strtolower($category);
            $clauses[] = "CASE WHEN LOWER(PropertyType) LIKE '%{$cat}%' THEN 40 ELSE 0 END";
        }

        // Location Match
        if ($location) {
            $loc = strtolower($location);
            $clauses[] = "CASE WHEN LOWER(Location) LIKE '%{$loc}%' OR LOWER(CityName) LIKE '%{$loc}%' THEN 30 ELSE 0 END";
        }

        // Price Range Match
        if ($minPrice > 0 || $maxPrice < 1000000) {
            $clauses[] = "CASE WHEN Price BETWEEN {$minPrice} AND {$maxPrice} THEN 30 ELSE 0 END";
        }

        return !empty($clauses) ? implode(' + ', $clauses) : "0";
    }
}
