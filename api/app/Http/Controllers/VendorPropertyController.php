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
                $property->Image = $property->primaryImage->image_path; // Verify image_path or correct column name in PropertyImage
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
            'images.*' => 'image|mimes:jpeg,png,jpg,webp|max:5120'
        ]);

        $data = $validated;
        if ($request->has('onboarding_data') && is_string($request->onboarding_data)) {
            $data['onboarding_data'] = json_decode($request->onboarding_data, true);
        }

        $property->update($data);

        // Handle Image Uploads (Appending new images)
        if ($request->hasFile('images')) {
            // Get current max display order
            $currentMaxOrder = \App\Models\PropertyImage::where('property_id', $property->PropertyId)->max('display_order') ?? -1;

            foreach ($request->file('images') as $index => $image) {
                $filename = \Illuminate\Support\Str::random(40) . '.' . $image->getClientOriginalExtension();
                $path = $image->storeAs('properties/' . $property->PropertyId, $filename, 'public');
                
                \App\Models\PropertyImage::create([
                    'property_id' => $property->PropertyId,
                    'image_path' => $property->PropertyId . '/' . $filename,
                    'is_primary' => false, // New images attached on update are not primary by default
                    'display_order' => $currentMaxOrder + 1 + $index
                ]);
            }
        }

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
