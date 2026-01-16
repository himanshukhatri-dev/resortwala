<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use App\Models\PropertyMaster;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $properties = PropertyMaster::whereNull('Latitude')->orWhereNull('Longitude')->get();

        foreach ($properties as $property) {
            $data = $property->onboarding_data; // Casted to array in model
            
            // Typical Google Maps API structure: geometry -> location -> lat/lng
            // Onboarding data might save it directly or nested.
            // Based on grep, LeadPipelineService uses $data['geometry']['location']['lat']
            
            $lat = $data['geometry']['location']['lat'] ?? $data['lat'] ?? $data['latitude'] ?? null;
            $lng = $data['geometry']['location']['lng'] ?? $data['lng'] ?? $data['longitude'] ?? null;

            // Fallback: Parse GoogleMapLink
            if ((!$lat || !$lng) && !empty($property->GoogleMapLink)) {
                $url = $property->GoogleMapLink;
                // Regex for @lat,lng
                if (preg_match('/@(-?\d+\.\d+),(-?\d+\.\d+)/', $url, $matches)) {
                    $lat = $matches[1];
                    $lng = $matches[2];
                }
                // Regex for ?q=lat,lng
                elseif (preg_match('/q=(-?\d+\.\d+),(-?\d+\.\d+)/', $url, $matches)) {
                    $lat = $matches[1];
                    $lng = $matches[2];
                }
                // Regex for plain lat,lng (rare but possible in query)
                elseif (preg_match('/(-?\d+\.\d+),\s*(-?\d+\.\d+)/', $url, $matches)) {
                    // Check if looks like valid coord
                    if (abs($matches[1]) <= 90 && abs($matches[2]) <= 180) {
                        $lat = $matches[1];
                        $lng = $matches[2];
                    }
                }
            }

            if ($lat && $lng) {
                DB::table('property_masters')
                    ->where('PropertyId', $property->PropertyId)
                    ->update([
                        'Latitude' => floatval($lat),
                        'Longitude' => floatval($lng)
                    ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No reverse needed really, we are just filling missing data
    }
};
