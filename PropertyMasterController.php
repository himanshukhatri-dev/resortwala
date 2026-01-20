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

            // 1. SMART SEARCH (Name, Location, City, Description)
            if ($request->has('location') && !empty($request->input('location')) && !$request->has('lat')) {
                $term = $request->input('location');
                $likeTerm = '%' . $term . '%';

                $query->where(function($q) use ($likeTerm) {
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
            
            // 4. Guests & Bedrooms Filter
            if ($request->has('guests') && $request->input('guests') > 1) {
                $guests = intval($request->input('guests'));
                $query->where(function($q) use ($guests) {
                     $q->where('MaxGuests', '>=', $guests)
                       ->orWhere('MaxCapacity', '>=', $guests);
                });
            }

            if ($request->has('bedrooms')) {
                $bedrooms = intval($request->input('bedrooms'));
                $query->where(function($q) use ($bedrooms) {
                    $q->where('NoofRooms', '>=', $bedrooms);
                });
            }

            // 5. Veg Only
            if ($request->has('veg_only') && $request->input('veg_only') == 'true') {
                 // Check common column names
                 $query->where(function($q) {
                     $q->where('IsVeg', 1)
                       ->orWhere('FoodType', 'Veg');
                 });
            }

            // Pagination
            $limit = intval($request->input('limit', 10));
            $properties = $query->paginate($limit);

            // POST-PROCESS: Add Pricing Intelligence & Review Logic
            $properties->getCollection()->transform(function ($p) {
                // 1. PRICING INTELLIGENCE (Dynamic Pricing)
                // Determine today's price based on day of week
                $today = now();
                $dayOfWeek = $today->dayOfWeek; // 0 (Sun) - 6 (Sat)
                
                $calculatedPrice = $p->Price; // Default fallback

                // A. Check Specific Date Override (from dailyRates relation if loaded)
                $dailyRate = $p->dailyRates->firstWhere('day_of_week', $dayOfWeek);
                
                // Day names for admin_pricing lookup
                $days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                $todayName = $days[$dayOfWeek];
                $isWeekend = in_array($todayName, ['friday', 'saturday', 'sunday']);
                $adminPricing = $p->admin_pricing ?? [];

                if ($dailyRate) {
                    $calculatedPrice = $dailyRate->base_price;
                } elseif (strtolower($p->PropertyType) == 'waterpark') {
                    // Waterpark Logic
                    $wpKey = $isWeekend ? 'adult_weekend' : 'adult_weekday';
                    
                    if (isset($adminPricing[$wpKey]['final']) && $adminPricing[$wpKey]['final'] > 0) {
                        $calculatedPrice = $adminPricing[$wpKey]['final'];
                    } elseif (isset($adminPricing['adult_rate']['discounted'])) {
                        $calculatedPrice = $adminPricing['adult_rate']['discounted'];
                    } elseif (isset($adminPricing['adult']['discounted'])) {
                        $calculatedPrice = $adminPricing['adult']['discounted'];
                    }
                } elseif (isset($adminPricing[$todayName]['villa']['final']) && $adminPricing[$todayName]['villa']['final'] > 0) {
                    // Villa 7-day Matrix
                    $calculatedPrice = $adminPricing[$todayName]['villa']['final'];
                } else {
                    // Column fallbacks
                    if ($dayOfWeek >= 1 && $dayOfWeek <= 4) { // Mon(1) - Thu(4)
                        $calculatedPrice = $p->price_mon_thu ?? $calculatedPrice;
                    } elseif ($dayOfWeek == 6) { // Sat(6)
                        $calculatedPrice = $p->price_sat ?? $calculatedPrice;
                    } else { // Fri(5) & Sun(0)
                        $calculatedPrice = $p->price_fri_sun ?? $calculatedPrice;
                    }
                }


                $p->display_price = $calculatedPrice;
                $p->lowest_price_next_30 = $calculatedPrice; // Simplified for now

                // 2. REVIEW LOGIC (Google Fallback)
                $internalReviewsCount = 0; // distinct from $p->reviews->count()
                $internalRating = 0;
                
                if ($internalReviewsCount > 0) {
                    $p->display_rating = $internalRating;
                    $p->is_verified_rating = true;
                } else {
                    $googleRating = floatval($p->Rating ?? 4.0);
                    $multiplier = ($googleRating < 4.0) ? 1.2 : (($googleRating <= 4.5) ? 1.1 : 1.0);
                    
                    $p->display_rating = round($googleRating * $multiplier, 1);
                    $p->display_rating_label = "Estimated";
                    $p->is_verified_rating = false;
                }

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

    public function compare(Request $request)
    {
        try {
            $ids = $request->input('ids');
            if (empty($ids)) {
                return response()->json([], 200);
            }

            if (is_string($ids)) {
                $ids = explode(',', $ids);
            }

            $properties = PropertyMaster::with(['images', 'dailyRates'])
                ->whereIn('id', $ids)
                ->where('is_approved', 1)
                ->get();

            $formatted = $properties->map(function ($p) {
                $amenities = $p->onboarding_data['amenities'] ?? [];
                $policies = $p->onboarding_data['policies'] ?? [];
                $propDetails = $p->onboarding_data['property_details'] ?? [];
                $pricing = $p->onboarding_data['pricing'] ?? [];
                
                // Determine display price (simplified logic for compare context)
                $price = $p->Price;
                $todayName = strtolower(now()->format('l'));
                if (isset($p->admin_pricing[$todayName]['villa']['final']) && $p->admin_pricing[$todayName]['villa']['final'] > 0) {
                     $price = $p->admin_pricing[$todayName]['villa']['final'];
                }

                return [
                    'id' => $p->id,
                    'PropertyId' => $p->PropertyId, // Compat
                    'Name' => $p->Name,
                    'PropertyType' => $p->PropertyType,
                    'Location' => $p->Location,
                    'City' => $p->CityName,
                    'image_url' => $p->images->first()->image_url ?? ($p->images[0]['image_url'] ?? null),
                    'rating' => $p->Rating ?? 4.5, // Mock if missing, usually from Google
                    'review_count' => $p->reviews_count ?? 10,
                    
                    // Flattened Details
                    'details' => [
                        'guests' => $p->MaxGuests ?? $propDetails['max_guests'] ?? 0,
                        'bedrooms' => $p->NoofRooms ?? $propDetails['bedroom_count'] ?? 0,
                        'bathrooms' => $propDetails['bathroom_count'] ?? 0,
                    ],

                    // Standardized Amenities
                    'amenities' => [
                        'pool' => !empty($amenities['pool']),
                        'parking' => !empty($amenities['parking']),
                        'wifi' => !empty($amenities['wifi']),
                        'ac' => !empty($amenities['ac']),
                        'tv' => !empty($amenities['tv']),
                        'kitchen' => !empty($amenities['kitchen']),
                        'caretaker' => !empty($amenities['caretaker']),
                    ],

                    // Policies
                    'policies' => [
                        'pets_allowed' => !empty($policies['pets_allowed']),
                        'alcohol_allowed' => !empty($policies['alcohol_allowed']),
                        'loud_music_allowed' => !empty($policies['loud_music_allowed']),
                    ],

                    // Pricing
                    'pricing' => [
                         'current_price' => $price,
                         'weekday' => $pricing['base_price_weekday'] ?? 0,
                         'weekend' => $pricing['base_price_weekend'] ?? 0,
                         'security_deposit' => $pricing['security_deposit'] ?? 0
                    ]
                ];
            });

            return response()->json($formatted);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Compare API Error', ['msg' => $e->getMessage()]);
            return response()->json(['error' => 'Comparison failed'], 500);
        }
    }
}
