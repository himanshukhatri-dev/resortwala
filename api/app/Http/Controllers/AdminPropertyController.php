<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\PropertyMaster;

class AdminPropertyController extends Controller
{
    /**
     * Approve a property and verify admin pricing.
     */
    public function approve(\App\Http\Requests\ApprovePropertyRequest $request, $id)
    {
        return \Illuminate\Support\Facades\DB::transaction(function () use ($request, $id) {
            $property = PropertyMaster::findOrFail($id);

            // Initialize/Get existing onboarding data
            $obData = $property->onboarding_data ?: [];

            // 1. Handle JSON-stored fields (Amenities, RoomConfig, Pricing)
            if ($request->has('Amenities')) {
                $obData['amenities'] = $request->Amenities; // Standardize to lowercase
                $obData['Amenities'] = $request->Amenities; // Keep uppercase for safety
            }
            if ($request->has('RoomConfig')) {
                $obData['roomConfig'] = $request->RoomConfig; // Standardize to lowercase
                $obData['RoomConfig'] = $request->RoomConfig; // Keep uppercase for safety
            }
            if ($request->has('otherAmenities')) {
                $obData['otherAmenities'] = $request->otherAmenities;
            }
            if ($request->has('waterpark_pricing')) {
                $obData['pricing'] = $request->waterpark_pricing;
            }
            $property->onboarding_data = $obData;

                // 2. Handle Admin Pricing (Villa Matrix)
            if ($request->has('admin_pricing')) {
                $adminPricing = is_string($request->admin_pricing) 
                    ? json_decode($request->admin_pricing, true) 
                    : $request->admin_pricing;
                
                $property->admin_pricing = $adminPricing;
                
                // DETECT FORMAT: New (monday key) vs Old (mon_thu key)
                if (isset($adminPricing['monday'])) {
                    // NEW 7-DAY FORMAT
                    // Map Legacy Columns for backward compatibility
                    if (isset($adminPricing['monday']['villa']['current'])) $property->Price = $adminPricing['monday']['villa']['current'];
                    
                    if (isset($adminPricing['monday']['villa']['final'])) {
                        $property->ResortWalaRate = $adminPricing['monday']['villa']['final'];
                        $property->price_mon_thu = $adminPricing['monday']['villa']['final'];
                        $property->DealPrice = $adminPricing['monday']['villa']['final'];
                    }
                    if (isset($adminPricing['friday']['villa']['final'])) $property->price_fri_sun = $adminPricing['friday']['villa']['final'];
                    if (isset($adminPricing['saturday']['villa']['final'])) $property->price_sat = $adminPricing['saturday']['villa']['final'];

                } else {
                    // LEGACY 3-BUCKET FORMAT
                    if (isset($adminPricing['mon_thu']['villa']['current'])) {
                        $property->Price = $adminPricing['mon_thu']['villa']['current'];
                    }
                    if (isset($adminPricing['mon_thu']['villa']['final'])) {
                        $property->ResortWalaRate = $adminPricing['mon_thu']['villa']['final'];
                        $property->price_mon_thu = $adminPricing['mon_thu']['villa']['final'];
                        $property->DealPrice = $adminPricing['mon_thu']['villa']['final']; // Sync DealPrice
                    }
                    if (isset($adminPricing['fri_sun']['villa']['final'])) {
                        $property->price_fri_sun = $adminPricing['fri_sun']['villa']['final'];
                    }
                    if (isset($adminPricing['sat']['villa']['final'])) {
                        $property->price_sat = $adminPricing['sat']['villa']['final'];
                    }
                }
            }

            // 3. Handle Resource Deletion (Images)
            if ($request->has('deletedImages') && is_array($request->deletedImages)) {
                \App\Models\PropertyImage::whereIn('id', $request->deletedImages)
                    ->where('property_id', $id)
                    ->delete();
            }

            // 4. Update using DB Facade to bypass Eloquent "Unknown Column" errors
            // This is critical because bulk uploads push fields like 'otherAttractions' 
            // that don't match DB columns.
            
            // Prepare STRICT update array
            // Only include columns that DEFINITELY exist in Schema
            $updateData = $request->only([
                'Name', 'Location', 'ShortDescription', 'LongDescription', 
                'Occupancy', 'MaxCapacity', 'NoofRooms', 
                'checkInTime', 'checkOutTime', 
                'PropertyRules', 'BookingSpecailMessage',
                'GoogleMapLink', 'Website', 'Address', 'ContactPerson', 'MobileNo', 'Email', 'PropertyType'
            ]);

            $updateData['is_approved'] = true;
            $updateData['IsActive'] = true;
            $updateData['PropertyStatus'] = true;
            $updateData['onboarding_data'] = json_encode($obData);
            
            if ($request->has('admin_pricing')) {
                 $adminPricing = is_string($request->admin_pricing) ? json_decode($request->admin_pricing, true) : $request->admin_pricing;
                 $updateData['admin_pricing'] = json_encode($adminPricing);
                 
                 // Sync Pricing columns
                 if (isset($adminPricing['monday'])) {
                     // NEW FORMAT
                     if (isset($adminPricing['monday']['villa']['current'])) $updateData['Price'] = $adminPricing['monday']['villa']['current'];
                     if (isset($adminPricing['monday']['villa']['final'])) {
                         $updateData['ResortWalaRate'] = $adminPricing['monday']['villa']['final'];
                         $updateData['price_mon_thu'] = $adminPricing['monday']['villa']['final'];
                         $updateData['DealPrice'] = $adminPricing['monday']['villa']['final'];
                     }
                     if (isset($adminPricing['friday']['villa']['final'])) $updateData['price_fri_sun'] = $adminPricing['friday']['villa']['final'];
                     if (isset($adminPricing['saturday']['villa']['final'])) $updateData['price_sat'] = $adminPricing['saturday']['villa']['final'];
                 } else {
                     // OLD FORMAT
                     if (isset($adminPricing['mon_thu']['villa']['current'])) $updateData['Price'] = $adminPricing['mon_thu']['villa']['current'];
                     if (isset($adminPricing['mon_thu']['villa']['final'])) {
                         $updateData['ResortWalaRate'] = $adminPricing['mon_thu']['villa']['final'];
                         $updateData['price_mon_thu'] = $adminPricing['mon_thu']['villa']['final'];
                         $updateData['DealPrice'] = $adminPricing['mon_thu']['villa']['final'];
                     }
                     if (isset($adminPricing['fri_sun']['villa']['final'])) $updateData['price_fri_sun'] = $adminPricing['fri_sun']['villa']['final'];
                     if (isset($adminPricing['sat']['villa']['final'])) $updateData['price_sat'] = $adminPricing['sat']['villa']['final'];
                 }
                 
                 // Sync to Daily Rates Table
                 $this->syncDailyRates($id, $adminPricing);
            }

            // Execute Direct Update
            \Illuminate\Support\Facades\DB::table('property_masters')
                ->where('PropertyId', $id)
                ->update($updateData);

            return response()->json([
                'message' => 'Property approved and details updated successfully',
                'property' => PropertyMaster::find($id) // Reload clean model
            ]);
        });
    }

    /**
     * Helper to sync admin_pricing JSON to property_daily_rates table.
     * This should be called after a successful save of the main property.
     */
    private function syncDailyRates($propertyId, $adminPricing)
    {
        if (!is_array($adminPricing)) return;

        // Map day names to 0-6 (Sunday=0, Monday=1, ...)
        $dayMap = [
            'sunday' => 0, 'monday' => 1, 'tuesday' => 2, 'wednesday' => 3, 
            'thursday' => 4, 'friday' => 5, 'saturday' => 6
        ];

        // 1. Delete existing daily rates (simple full replace strategy for now)
        \App\Models\PropertyDailyRate::where('property_id', $propertyId)->delete();

        // 2. Insert new rates
        $now = now();
        $inserts = [];

        // Check if New or Old Format
        if (isset($adminPricing['monday'])) {
            // New Format
            foreach ($dayMap as $key => $val) {
                if (isset($adminPricing[$key])) {
                    $dayData = $adminPricing[$key];
                    $inserts[] = [
                        'property_id' => $propertyId,
                        'day_of_week' => $val,
                        'base_price' => $dayData['villa']['final'] ?? 0,
                        'extra_person_price' => $dayData['extra_person']['final'] ?? 0,
                        'child_price' => 0, // Not explicitly in matrix yet, maybe in future
                        'effective_from' => $now,
                        'effective_to' => null,
                        'created_at' => $now,
                        'updated_at' => $now
                    ];
                }
            }
        } else {
            // Legacy Format - Expand buckets to days
            $bucketMap = [
                'mon_thu' => [1, 2, 3, 4],
                'fri_sun' => [5, 0],
                'sat' => [6]
            ];

            foreach ($bucketMap as $bucket => $days) {
                if (isset($adminPricing[$bucket])) {
                    $bData = $adminPricing[$bucket];
                    foreach ($days as $dVal) {
                        $inserts[] = [
                            'property_id' => $propertyId,
                            'day_of_week' => $dVal,
                            'base_price' => $bData['villa']['final'] ?? 0,
                            'extra_person_price' => $bData['extra_person']['final'] ?? 0,
                            'child_price' => 0,
                            'effective_from' => $now,
                            'effective_to' => null,
                            'created_at' => $now,
                            'updated_at' => $now
                        ];
                    }
                }
            }
        }

        if (!empty($inserts)) {
            \App\Models\PropertyDailyRate::insert($inserts);
        }
    }

    /**
     * Update pricing matrix without changing approval status (or re-approving).
     */
    public function updatePricing(Request $request, $id)
    {
        $property = PropertyMaster::findOrFail($id);

        $validated = $request->validate([
            'admin_pricing' => 'required|array',
            'admin_pricing.mon_thu' => 'required|array',
            'admin_pricing.fri_sun' => 'required|array',
            'admin_pricing.sat' => 'required|array',
        ]);

        $property->admin_pricing = $validated['admin_pricing'];
        
        // Update main price columns
        if (isset($validated['admin_pricing']['monday'])) {
            // New 7-Day Format
            if (isset($validated['admin_pricing']['monday']['villa']['current'])) $property->Price = $validated['admin_pricing']['monday']['villa']['current'];
            if (isset($validated['admin_pricing']['monday']['villa']['final'])) {
                $property->ResortWalaRate = $validated['admin_pricing']['monday']['villa']['final'];
                $property->price_mon_thu = $validated['admin_pricing']['monday']['villa']['final'];
                $property->DealPrice = $validated['admin_pricing']['monday']['villa']['final'];
            }
            if (isset($validated['admin_pricing']['friday']['villa']['final'])) $property->price_fri_sun = $validated['admin_pricing']['friday']['villa']['final'];
            if (isset($validated['admin_pricing']['saturday']['villa']['final'])) $property->price_sat = $validated['admin_pricing']['saturday']['villa']['final'];

        } else {
            // Legacy Format
            if (isset($validated['admin_pricing']['mon_thu']['villa']['current'])) {
                $property->Price = $validated['admin_pricing']['mon_thu']['villa']['current'];
            }
            if (isset($validated['admin_pricing']['mon_thu']['villa']['final'])) {
                $property->ResortWalaRate = $validated['admin_pricing']['mon_thu']['villa']['final'];
                $property->price_mon_thu = $validated['admin_pricing']['mon_thu']['villa']['final'];
                $property->DealPrice = $validated['admin_pricing']['mon_thu']['villa']['final']; // Sync DealPrice
            }
            if (isset($validated['admin_pricing']['fri_sun']['villa']['final'])) {
                $property->price_fri_sun = $validated['admin_pricing']['fri_sun']['villa']['final'];
            }
            if (isset($validated['admin_pricing']['sat']['villa']['final'])) {
                $property->price_sat = $validated['admin_pricing']['sat']['villa']['final'];
            }
        }

        $property->save();

        // Sync to Daily Rates Table
        $this->syncDailyRates($id, $validated['admin_pricing']);

        return response()->json([
            'message' => 'Pricing updated successfully',
            'property' => $property
        ]);
    }
    
    /**
     * Get property details for admin review
     */
    /**
     * Get property details for admin review
     */
    public function show($id)
    {
        $property = PropertyMaster::with(['images', 'videos', 'vendor'])->findOrFail($id);
        // Attach checking for pending changes?
        // Let's load it as a relationship if possible, or manual query
        $pendingChanges = \App\Models\PropertyEditRequest::where('property_id', $id)
            ->where('status', 'pending')
            ->first();
            
        $property->pending_changes = $pendingChanges;

        return response()->json($property);
    }

    /* --- Change Request Management --- */

    public function getChangeRequests()
    {
        $requests = \App\Models\PropertyEditRequest::where('status', 'pending')
            ->with(['property', 'vendor'])
            ->orderBy('created_at', 'asc')
            ->get();
            
        return response()->json($requests);
    }

    public function getChangeRequest($id)
    {
        $request = \App\Models\PropertyEditRequest::with(['property', 'vendor'])->findOrFail($id);
        return response()->json($request);
    }

    public function approveChanges(Request $request, $id)
    {
        // Approve specific changes for a property
        $editRequest = \App\Models\PropertyEditRequest::where('property_id', $id)
            ->with(['vendor'])
            ->where('status', 'pending')
            ->firstOrFail();

        $property = PropertyMaster::findOrFail($id);
        
        // Apply Changes
        $changes = $editRequest->changes_json;
        $property->update($changes);
        
        $editRequest->status = 'approved';
        $editRequest->save();

        // Notify Vendor
        try {
            if ($editRequest->vendor && $editRequest->vendor->email) {
                \Illuminate\Support\Facades\Mail::to($editRequest->vendor->email)->send(
                    new \App\Mail\PropertyEditRequestActioned($property, $editRequest->vendor, 'approved')
                );
            }
        } catch (\Exception $e) {
            \Log::error('Failed to notify vendor of approval: ' . $e->getMessage());
        }

        $editRequest->delete(); // Soft delete if trait exists, or hard delete
        
        return response()->json(['message' => 'Changes approved and applied successfully']);
    }

    public function rejectChanges(Request $request, $id)
    {
        $editRequest = \App\Models\PropertyEditRequest::where('property_id', $id)
            ->with(['vendor'])
            ->where('status', 'pending')
            ->firstOrFail();

        $property = PropertyMaster::findOrFail($id); // Get property for name in email

        $editRequest->status = 'rejected';
        // $editRequest->admin_feedback = $request->feedback;
        $editRequest->save();

        // Notify Vendor
        try {
            if ($editRequest->vendor && $editRequest->vendor->email) {
                \Illuminate\Support\Facades\Mail::to($editRequest->vendor->email)->send(
                    new \App\Mail\PropertyEditRequestActioned($property, $editRequest->vendor, 'rejected')
                );
            }
        } catch (\Exception $e) {
            \Log::error('Failed to notify vendor of rejection: ' . $e->getMessage());
        }

        $editRequest->delete();

        return response()->json(['message' => 'Changes rejected']);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'Name' => 'required|string|max:255',
            'vendor_id' => 'required|exists:users,id',
            'PropertyType' => 'required|string',
            'Price' => 'required|numeric',
            'Location' => 'nullable|string',
            'description' => 'nullable|string',
            // Allow all other fields
            'onboarding_data' => 'nullable',
            'price_mon_thu' => 'nullable',
            'price_fri_sun' => 'nullable',
            'price_sat' => 'nullable',
            'MaxCapacity' => 'nullable',
            'NoofRooms' => 'nullable',
            'Occupancy' => 'nullable',
            'CityName' => 'nullable',
            'Address' => 'nullable',
            'ContactPerson' => 'nullable',
            'MobileNo' => 'nullable',
            'Email' => 'nullable',
            'Website' => 'nullable',
            'ShortDescription' => 'nullable',
        ]);

        // Decode JSON string if present
        $onboardingData = null;
        if ($request->has('onboarding_data')) {
             $onboardingData = is_string($request->onboarding_data) 
                ? json_decode($request->onboarding_data, true) 
                : $request->onboarding_data;
        }

        return \Illuminate\Support\Facades\DB::transaction(function () use ($request, $validated, $onboardingData) {
            
            // 1. Create Property
            $property = PropertyMaster::create([
                'Name' => $validated['Name'],
                'vendor_id' => $validated['vendor_id'],
                'PropertyType' => $validated['PropertyType'],
                'Price' => $validated['Price'],
                'Location' => $validated['Location'] ?? null,
                'Description' => $validated['description'] ?? null,
                'is_approved' => true, // Admin created = Auto Approved
                'IsActive' => true,
                'PropertyStatus' => true,
                'created_at' => now(),
                'updated_at' => now(),
                
                // Advanced Fields
                'CityName' => $request->CityName,
                'Address' => $request->Address,
                'ContactPerson' => $request->ContactPerson,
                'MobileNo' => $request->MobileNo,
                'Email' => $request->Email,
                'Website' => $request->Website,
                'ShortDescription' => $request->ShortDescription,

                // Sync Pricing & Capacity
                'price_mon_thu' => $request->price_mon_thu ?? $validated['Price'],
                'price_fri_sun' => $request->price_fri_sun ?? $validated['Price'],
                'price_sat' => $request->price_sat ?? $validated['Price'],
                'MaxCapacity' => $request->MaxCapacity,
                'NoofRooms' => $request->NoofRooms,
                'Occupancy' => $request->Occupancy,

                // JSON Data
                'onboarding_data' => $onboardingData
            ]);

            // 2. Handle Images (if any)
            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $index => $image) {
                    $filename = \Illuminate\Support\Str::random(40) . '.' . $image->getClientOriginalExtension();
                    $image->storeAs('properties/' . $property->PropertyId, $filename, 'public');
                    
                    \App\Models\PropertyImage::create([
                        'property_id' => $property->PropertyId,
                        'image_path' => $property->PropertyId . '/' . $filename,
                        'is_primary' => $index === 0,
                        'display_order' => $index
                    ]);
                }
            }
            
            // 3. Handle Videos (if any)
            if ($request->hasFile('videos')) {
                foreach ($request->file('videos') as $index => $video) {
                    $filename = \Illuminate\Support\Str::random(40) . '.' . $video->getClientOriginalExtension();
                    $video->storeAs('properties/' . $property->PropertyId . '/videos', $filename, 'public');
                    
                    \App\Models\PropertyVideo::create([
                        'property_id' => $property->PropertyId,
                        'video_path' => $property->PropertyId . '/videos/' . $filename,
                        'display_order' => $index
                    ]);
                }
            }

            return response()->json([
                'message' => 'Property created successfully',
                'property' => $property
            ], 201);
        });
    }

    public function addPhotos(Request $request, $id)
    {
        $request->validate([
            'images.*' => 'image|mimes:jpeg,png,jpg,webp|max:10240', // 10MB max
        ]);

        $property = PropertyMaster::findOrFail($id);
        $uploadedImages = [];

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $filename = \Illuminate\Support\Str::random(40) . '.' . $image->getClientOriginalExtension();
                $image->storeAs('properties/' . $id, $filename, 'public');

                $maxOrder = \App\Models\PropertyImage::where('property_id', $id)->max('display_order') ?? -1;

                $propertyImage = \App\Models\PropertyImage::create([
                    'property_id' => $id,
                    'image_path' => $id . '/' . $filename,
                    'is_primary' => \App\Models\PropertyImage::where('property_id', $id)->count() === 0,
                    'display_order' => $maxOrder + 1
                ]);

                $uploadedImages[] = $propertyImage;
            }
        }

        return response()->json([
            'message' => count($uploadedImages) . ' photos added successfully',
            'images' => $uploadedImages
        ]);
    }
}
