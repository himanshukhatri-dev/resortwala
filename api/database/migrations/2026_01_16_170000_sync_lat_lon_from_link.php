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
        // Select properties where Coords are still missing
        $properties = PropertyMaster::whereNull('Latitude')->orWhereNull('Longitude')->get();

        foreach ($properties as $property) {
            $lat = null;
            $lng = null;
            
            // Try Parsing GoogleMapLink
            if (!empty($property->GoogleMapLink)) {
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
                // Regex for plain lat,lng
                elseif (preg_match('/(-?\d+\.\d+),\s*(-?\d+\.\d+)/', $url, $matches)) {
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
        //
    }
};
