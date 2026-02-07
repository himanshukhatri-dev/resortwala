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
            \Illuminate\Support\Facades\Log::info('Property Search Full URL:', ['url' => $request->fullUrl()]);

            $query = PropertyMaster::with('images')
                ->where('is_approved', 1);

            // STRICT DEV ONLY FILTER
            // Only show developer_only properties if explicit dev_mode flag is sent (from localhost)
            $devMode = $request->input('dev_mode') === 'true' || $request->input('dev_mode') === '1';
            \Illuminate\Support\Facades\Log::info('Dev Mode Check:', [
                'dev_mode_param' => $request->input('dev_mode'),
                'is_dev_mode' => $devMode,
                'will_filter' => !$devMode
            ]);

            if (!$devMode) {
                // Hide all properties marked as developer_only
                // Handle both boolean true/1 and ensure NULL/0/false are shown
                $query->where(function ($q) {
                    $q->where('is_developer_only', '!=', 1)
                        ->orWhereNull('is_developer_only');
                });
                \Illuminate\Support\Facades\Log::info('Applied developer_only filter - hiding dev properties');
            }

            // 0. GEOSPATIAL FILTER (Distance)
            if ($request->has('lat') && $request->has('lon')) {
                $lat = floatval($request->input('lat'));
                $lon = floatval($request->input('lon'));
                $radius = intval($request->input('radius', 50));

                // Using NOWDOC for cleaner SQL, standard Haversine
                // We use HAVING for distance filtering
                // Improved Haversine: Fallback to CityLatitude/CityLongitude if property specific coords are missing.
                $latCol = "COALESCE(Latitude, CityLatitude)";
                $lonCol = "COALESCE(Longitude, CityLongitude)";

                $haversine = "( 6371 * acos( cos( radians($lat) ) * cos( radians( $latCol ) ) * cos( radians( $lonCol ) - radians($lon) ) + sin( radians($lat) ) * sin( radians( $latCol ) ) ) )";

                $query->select('*', DB::raw("{$haversine} as distance_km"));
                // Include properties within radius OR with no coordinates (NULL distance)
                $query->havingRaw("distance_km <= ? OR distance_km IS NULL", [$radius]);
                // Sort by: Valid distances first, then NULLs
                $query->orderByRaw('CASE WHEN distance_km IS NULL THEN 1 ELSE 0 END, distance_km ASC');
            } else {
                // Default Sorting
                if (!$request->has('sort') && !$request->has('location') && !$request->has('lat')) {
                    // Apply Smart Default Sorting
                    $prefs = $request->input('preferences', []);
                    if (is_string($prefs)) {
                        $prefs = json_decode($prefs, true) ?? [];
                    }
                    $sortingService = app(\App\Services\SmartSortingService::class);
                    $query = $sortingService->applySmartSorting($query, $prefs);
                } elseif ($request->has('sort')) {
                    switch ($request->input('sort')) {
                        case 'price_low':
                            $query->orderBy('Price', 'asc');
                            break;
                        case 'price_high':
                            $query->orderBy('Price', 'desc');
                            break;
                        case 'rating':
                            $query->orderBy('customer_avg_rating', 'desc');
                            break;
                        default: // newest
                            $query->orderBy('created_at', 'desc');
                    }
                } else {
                    $query->orderBy('created_at', 'desc');
                }
            }

            // 1. SMART SEARCH (Name, Location, City, Description)
            if ($request->has('location') && !empty($request->input('location')) && !$request->has('lat')) {
                $term = $request->input('location');
                $likeTerm = '%' . $term . '%';

                $query->where(function ($q) use ($likeTerm) {
                    $q->where('Name', 'like', $likeTerm)
                        ->orWhere('Location', 'like', $likeTerm)
                        ->orWhere('CityName', 'like', $likeTerm)
                        ->orWhere('Address', 'like', $likeTerm)
                        ->orWhere('PropertyType', 'like', $likeTerm);
                });

                // Weighted Ranking: Name > City/Location > Address > Others
                // Note: We use raw SQL for ordering by relevance
                $query->orderByRaw("
                    CASE 
                        WHEN Name LIKE ? THEN 10
                        WHEN CityName LIKE ? THEN 8
                        WHEN Location LIKE ? THEN 8
                        WHEN PropertyType LIKE ? THEN 5
                        WHEN Address LIKE ? THEN 2
                        ELSE 0
                    END DESC
                ", [$likeTerm, $likeTerm, $likeTerm, $likeTerm, $likeTerm]);
            }

            // 2. Type Filter
            if ($request->has('type') && $request->input('type') !== 'all') {
                $type = $request->input('type');
                if ($type == 'villas') {
                    $query->where('PropertyType', 'Villa');
                } elseif ($type == 'waterpark') {
                    $query->where(function ($q) {
                        $q->where('PropertyType', 'like', '%Resort%')
                            ->orWhere('PropertyType', 'like', '%Water%') // Added explicitly
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

            // 4. Guests & Bedrooms Filter
            if ($request->has('guests') && $request->input('guests') > 1) {
                $guests = intval($request->input('guests'));
                $query->where(function ($q) use ($guests) {
                    $q->where('MaxGuests', '>=', $guests)
                        ->orWhere('MaxCapacity', '>=', $guests);
                });
            }

            if ($request->has('bedrooms')) {
                $bedrooms = intval($request->input('bedrooms'));
                $query->where(function ($q) use ($bedrooms) {
                    $q->where('NoofRooms', '>=', $bedrooms);
                });
            }

            // 5. Veg Only
            if ($request->has('veg_only') && $request->input('veg_only') == 'true') {
                // Check common column names
                $query->where(function ($q) {
                    $q->where('IsVeg', 1)
                        ->orWhere('FoodType', 'Veg');
                });
            }

            // Pagination
            $limit = intval($request->input('limit', 10));
            $properties = $query->paginate($limit);
            \Illuminate\Support\Facades\Log::info('Query Result:', ['total_found' => $properties->total(), 'per_page' => $limit]);

            // POST-PROCESS: Add Pricing Intelligence & Review Logic
            $properties->getCollection()->transform(function ($p) {
                // Pricing is now handled by model appends (display_price)
                $p->lowest_price_next_30 = $p->display_price;

                // Ensure Dev Only flag is visible
                $p->makeVisible(['is_developer_only', 'Rating']);

                return $p;
            });

            return response()->json($properties);
        } catch (\Exception $e) {
            // Return 200 with empty data to prevent client crash? No, 500 is better for debugging, 
            // but for user experience 'No properties' is better than crash.
            // But we already handle catch in frontend.
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function show($idOrSlug)
    {
        try {
            // 1. Try finding by ID first
            if (is_numeric($idOrSlug)) {
                $property = PropertyMaster::with(['images', 'videos', 'holidays', 'dailyRates'])->find($idOrSlug);

                // If found by ID and has a slug, we SHOULD return the property but 
                // ideally the frontend should know to update its URL.
                // For SEO, we'll include the slug in the response so the frontend can canonicalize.
                if ($property) {
                    return response()->json($property);
                }
            }

            // 2. Try finding by Slug
            $property = PropertyMaster::with(['images', 'videos', 'holidays', 'dailyRates'])
                ->where('slug', $idOrSlug)
                ->first();

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

            $formatted = $locations->map(function ($item) {
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
