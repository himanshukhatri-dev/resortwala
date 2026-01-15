<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\PropertyMaster;

class PropertyMasterController extends Controller
{
    public function index(Request $request)
    {
        try {
            \Illuminate\Support\Facades\Log::info('Property Search Params:', $request->all());
            
            $query = PropertyMaster::with('images')
                ->where('is_approved', 1);

            // 0. GEOSPATIAL FILTER (Distance)
            if ($request->has('lat') && $request->has('lon')) {
                $lat = floatval($request->input('lat'));
                $lon = floatval($request->input('lon'));
                $radius = intval($request->input('radius', 50)); 
                
                // Using NOWDOC for cleaner SQL, standard Haversine
                // We use HAVING for distance filtering
                $haversine = "( 6371 * acos( cos( radians($lat) ) * cos( radians( Latitude ) ) * cos( radians( Longitude ) - radians($lon) ) + sin( radians($lat) ) * sin( radians( Latitude ) ) ) )";
                
                $query->select('*', DB::raw("{$haversine} as distance_km"));
                // Include properties within radius OR with no coordinates (NULL distance)
                $query->havingRaw("distance_km <= ? OR distance_km IS NULL", [$radius]);
                // Sort by: Valid distances first, then NULLs
                $query->orderByRaw('CASE WHEN distance_km IS NULL THEN 1 ELSE 0 END, distance_km ASC');
            } else {
                // Default Sorting
                if ($request->has('sort')) {
                    switch ($request->input('sort')) {
                        case 'price_low':
                            $query->orderBy('Price', 'asc');
                            break;
                        case 'price_high':
                            $query->orderBy('Price', 'desc');
                            break;
                        default: // newest
                            $query->orderBy('created_at', 'desc');
                    }
                } else {
                    $query->orderBy('created_at', 'desc');
                }
            }

            // 1. TEXT LOCATION FILTER
            if ($request->has('location') && !empty($request->input('location')) && !$request->has('lat')) {
                $loc = $request->input('location');
                $query->where(function($q) use ($loc) {
                    $q->where('Location', 'like', '%' . $loc . '%')
                      ->orWhere('CityName', 'like', '%' . $loc . '%')
                      ->orWhere('Address', 'like', '%' . $loc . '%');
                });
            }

            // 2. Type Filter
            if ($request->has('type') && $request->input('type') !== 'all') {
                $type = $request->input('type');
                if ($type == 'villas') {
                    $query->where('PropertyType', 'Villa');
                } elseif ($type == 'waterpark') {
                    $query->where(function($q) {
                        $q->where('PropertyType', 'like', '%Resort%')
                          ->orWhere('Name', 'like', '%Water%');
                    });
                }
            }

            // 3. Price Filter
            if ($request->has('min_price') && !empty($request->input('min_price'))) {
                $query->where('Price', '>=', $request->input('min_price'));
            }
            if ($request->has('max_price')) {
                 $query->where('Price', '<=', $request->input('max_price'));
            }
            
            // 4. Guests Filter
            if ($request->has('guests') && $request->input('guests') > 1) {
                $guests = $request->input('guests');
                $query->where(function($q) use ($guests) {
                     $q->where('MaxGuests', '>=', $guests)
                       ->orWhere('MaxCapacity', '>=', $guests);
                });
            }

            // 5. Veg Only
            if ($request->has('veg_only') && $request->input('veg_only') == 'true') {
                 // Logic to be implemented if VegOnly column exists
            }

            // Pagination
            $limit = intval($request->input('limit', 10));
            $properties = $query->paginate($limit);

            return response()->json($properties);
        } catch (\Exception $e) {
            // Return 200 with empty data to prevent client crash? No, 500 is better for debugging, 
            // but for user experience 'No properties' is better than crash.
            // But we already handle catch in frontend.
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        try {
            $property = PropertyMaster::with(['images', 'videos', 'holidays', 'dailyRates'])->find($id);
            if (!$property) {
                return response()->json(['message' => 'Property not found'], 404);
            }
            return response()->json($property);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    
    public function getLocations()
    {
        try {
            $locations = PropertyMaster::where('is_approved', 1)
                ->select('Location', DB::raw('count(*) as total'))
                ->whereNotNull('Location')
                ->where('Location', '!=', '')
                ->groupBy('Location')
                ->orderBy('total', 'desc')
                ->limit(20)
                ->get();

            $formatted = $locations->map(function($item) {
                return [
                    'name' => $item->Location,
                    'count' => $item->total
                ];
            });

            return response()->json($formatted);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
