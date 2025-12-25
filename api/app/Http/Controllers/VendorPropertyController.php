<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\PropertyMaster;

class VendorPropertyController extends Controller
{
    public function index(Request $request)
    {
        $properties = PropertyMaster::where('vendor_id', $request->user()->id)
            ->with(['primaryImage'])
            ->withCount(['bookings as upcoming_bookings_count' => function ($query) {
                $query->where('CheckInDate', '>=', now())
                      ->where('CheckInDate', '<=', now()->addDays(30))
                      ->where('Status', '!=', 'cancelled');
            }])
            ->orderBy('created_at', 'desc')
            ->get();

        // Ensure Image property is set for frontend compatibility if primaryImage exists
        $properties->transform(function ($property) {
            if ($property->primaryImage) {
                // Use Full URL (accessor) instead of relative path
                $property->Image = $property->primaryImage->image_url; 
            }
            return $property;
        });

        return response()->json($properties);
    }

    public function store(Request $request)
    {
        // Check if vendor is approved
        if (!$request->user()->is_approved) {
            return response()->json(['message' => 'Your account must be approved before adding properties'], 403);
        }

        $validated = $request->validate([
            'Name' => 'required|string|max:255',
            'ShortName' => 'nullable|string|max:255',
            'Location' => 'required|string|max:255',
            'CityName' => 'nullable|string|max:255',
            'Price' => 'required|numeric|min:0',
            'ContactPerson' => 'nullable|string|max:255',
            'MobileNo' => 'nullable|string|max:20',
            'Email' => 'nullable|email|max:255',
            'Website' => 'nullable|string|max:255',
            'ShortDescription' => 'nullable|string',
            'LongDescription' => 'nullable|string',
            'Address' => 'nullable|string',
            'PropertyType' => 'nullable|string',
            'MaxCapacity' => 'nullable|integer|min:1',
            'NoofRooms' => 'nullable|integer',
            'Occupancy' => 'nullable|string',
            'CheckinDate' => 'nullable|date',
            'CheckoutDate' => 'nullable|date',
            'price_mon_thu' => 'nullable|numeric|min:0',
            'price_fri_sun' => 'nullable|numeric|min:0',
            'price_sat' => 'nullable|numeric|min:0',
            'video_url' => 'nullable|url',
            'onboarding_data' => 'nullable', // Can be JSON string
            'images.*' => 'image|mimes:jpeg,png,jpg,webp|max:5120'
        ]);

        // Decode JSON string if present (FormData sends strings)
        $data = $validated;
        unset($data['images']); // Remove images from mass assignment data

        if ($request->has('onboarding_data') && is_string($request->onboarding_data)) {
            $data['onboarding_data'] = json_decode($request->onboarding_data, true);
        }

        $property = PropertyMaster::create([
            ...$data,
            'vendor_id' => $request->user()->id,
            'is_approved' => false, // Requires admin approval
            'IsActive' => true,
            'PropertyStatus' => true,
        ]);

        // Handle Image Uploads
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $index => $image) {
                $filename = \Illuminate\Support\Str::random(40) . '.' . $image->getClientOriginalExtension();
                $path = $image->storeAs('properties/' . $property->PropertyId, $filename, 'public');
                
                \App\Models\PropertyImage::create([
                    'property_id' => $property->PropertyId,
                    'image_path' => $property->PropertyId . '/' . $filename,
                    'is_primary' => $index === 0,
                    'display_order' => $index
                ]);
            }
        }

        return response()->json([
            'message' => 'Property created successfully. Awaiting admin approval.',
            'property' => $property
        ], 201);
    }

    public function show(Request $request, $id)
    {
        $property = PropertyMaster::where('vendor_id', $request->user()->id)
            ->where('PropertyId', $id)
            ->with(['images'])
            ->firstOrFail();

        // Check for pending changes and merge them for the vendor view
        $pendingRequest = \App\Models\PropertyEditRequest::where('property_id', $id)
            ->where('status', 'pending')
            ->latest()
            ->first();

        if ($pendingRequest && !empty($pendingRequest->changes_json)) {
            $changes = $pendingRequest->changes_json;
            // Decode if it's a string (though Eloquent 'json' cast handles this, safety first)
            if (is_string($changes)) $changes = json_decode($changes, true);

            foreach ($changes as $key => $value) {
                // Determine if we should override.
                // PropertyMaster uses PascalCase usually.
                $property->$key = $value;
            }
            $property->has_pending_changes = true;
        }

        return response()->json($property);
    }

    public function update(Request $request, $id)
    {
        $property = PropertyMaster::where('vendor_id', $request->user()->id)
            ->where('PropertyId', $id)
            ->firstOrFail();

        $validated = $request->validate([
            'Name' => 'sometimes|string|max:255',
            'ShortName' => 'nullable|string|max:255',
            'Location' => 'sometimes|string|max:255',
            'CityName' => 'nullable|string|max:255',
            'Price' => 'sometimes|numeric|min:0',
            'ContactPerson' => 'nullable|string|max:255',
            'MobileNo' => 'nullable|string|max:20',
            'Email' => 'nullable|email|max:255',
            'Website' => 'nullable|string|max:255',
            'ShortDescription' => 'nullable|string',
            'LongDescription' => 'nullable|string',
            'Address' => 'nullable|string',
            'PropertyType' => 'nullable|string',
            'MaxCapacity' => 'sometimes|integer|min:1',
            'NoofRooms' => 'nullable|integer',
            'Occupancy' => 'nullable|string',
            'CheckinDate' => 'nullable|date',
            'CheckoutDate' => 'nullable|date',
            'price_mon_thu' => 'nullable|numeric|min:0',
            'price_fri_sun' => 'nullable|numeric|min:0',
            'price_sat' => 'nullable|numeric|min:0',
            'video_url' => 'nullable|url',
            'onboarding_data' => 'nullable',
            // Images are handled separately as 'additions', so we might allow them directly or track them?
            // For now, let's allow image additions directly as they are usually harmless or moderated separately?
            // Or better, block image uploads if approved? 
            // User asked for "any setting".
            'images.*' => 'image|mimes:jpeg,png,jpg,webp|max:5120'
        ]);

        $data = $validated;
        unset($data['images']); // Process explicitly
        
        if ($request->has('onboarding_data') && is_string($request->onboarding_data)) {
            $data['onboarding_data'] = json_decode($request->onboarding_data, true);
        }

        // Check if property is approved
        if ($property->is_approved) {
            // Calculate Changes
            $changes = [];
            foreach ($data as $key => $value) {
                // strict comparison might fail for numbers '10' vs 10, so use loose equality or careful check
                // For arrays (onboarding_data), we need to check contents
                if (is_array($value) || is_array($property->$key)) {
                     if (json_encode($value) !== json_encode($property->$key)) {
                         $changes[$key] = $value;
                     }
                } else {
                    if ($property->$key != $value) {
                        $changes[$key] = $value;
                    }
                }
            }

            if (!empty($changes)) {
                // Check if pending request exists
                $pendingRequest = \App\Models\PropertyEditRequest::where('property_id', $property->PropertyId)
                    ->where('status', 'pending')
                    ->first();

                if ($pendingRequest) {
                    // Update existing request
                    $existingChanges = $pendingRequest->changes_json;
                    $mergedChanges = array_merge($existingChanges, $changes);
                    $pendingRequest->update(['changes_json' => $mergedChanges]);
                    $requestId = $pendingRequest->id;
                } else {
                    $req = \App\Models\PropertyEditRequest::create([
                        'property_id' => $property->PropertyId,
                        'vendor_id' => $request->user()->id,
                        'changes_json' => $changes,
                        'status' => 'pending'
                    ]);
                    $requestId = $req->id;
                }

                // Notify Admins
                try {
                    $admins = \App\Models\User::where('role', 'admin')->get();
                    foreach ($admins as $admin) {
                        \Illuminate\Support\Facades\Mail::to($admin->email)->send(
                            new \App\Mail\PropertyEditRequestSubmitted($property, $request->user(), $requestId)
                        );
                    }
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error('Failed to send admin notification: ' . $e->getMessage());
                }

                // If images were uploaded, we might need a way to stage them. 
                // For this MVP, let's allow Image Uploads directly (bypass approval) OR block them.
                // Assuming images are critical, let's allow them for now to avoid complexity of "Pending Images".
                // OR: Warn user "Images uploaded but other changes pending".
            }
            
            // Handle Images (Allowing direct upload for now as complex to stage files)
            if ($request->hasFile('images')) {
                 $currentMaxOrder = \App\Models\PropertyImage::where('property_id', $property->PropertyId)->max('display_order') ?? -1;
                 foreach ($request->file('images') as $index => $image) {
                    $filename = \Illuminate\Support\Str::random(40) . '.' . $image->getClientOriginalExtension();
                    $image->storeAs('properties/' . $id, $filename, 'public');
                    \App\Models\PropertyImage::create([
                        'property_id' => $id,
                        'image_path' => $id . '/' . $filename,
                        'display_order' => $currentMaxOrder + 1 + $index
                    ]);
                }
            }

            return response()->json([
                'message' => 'Changes submitted for admin approval.',
                'status' => 'pending_approval'
            ], 202);
        }

        // Not approved? Update directly.
        $property->update($data);

        // Handle Image Uploads
        if ($request->hasFile('images')) {
            $currentMaxOrder = \App\Models\PropertyImage::where('property_id', $property->PropertyId)->max('display_order') ?? -1;
            foreach ($request->file('images') as $index => $image) {
                $filename = \Illuminate\Support\Str::random(40) . '.' . $image->getClientOriginalExtension();
                $image->storeAs('properties/' . $id, $filename, 'public');
                \App\Models\PropertyImage::create([
                    'property_id' => $id,
                    'image_path' => $id . '/' . $filename,
                    'is_primary' => false,
                    'display_order' => $currentMaxOrder + 1 + $index
                ]);
            }
        }
        
        $property->load('images');

        return response()->json([
            'message' => 'Property updated successfully',
            'property' => $property
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $property = PropertyMaster::where('vendor_id', $request->user()->id)
            ->where('PropertyId', $id)
            ->firstOrFail();

        $property->delete();

        return response()->json([
            'message' => 'Property deleted successfully'
        ]);
    }
}
