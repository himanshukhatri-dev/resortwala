<?php

namespace App\Http\Controllers;

use App\Models\PropertyImage;
use App\Models\PropertyMaster;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PropertyImageController extends Controller
{
    public function upload(Request $request, $propertyId)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg|max:5120', // 5MB max
        ]);

        // Verify property belongs to vendor
        $property = PropertyMaster::where('PropertyId', $propertyId)
            ->where('vendor_id', $request->user()->id)
            ->firstOrFail();

        // Handle file upload
        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $filename = Str::random(40) . '.' . $image->getClientOriginalExtension();
            
            // Store in storage/app/public/properties
            $path = $image->storeAs('properties', $filename, 'public');

            // Get current max display_order
            $maxOrder = PropertyImage::where('property_id', $propertyId)->max('display_order') ?? -1;

            // Create image record
            $propertyImage = PropertyImage::create([
                'property_id' => $propertyId,
                'image_path' => $filename,
                'is_primary' => PropertyImage::where('property_id', $propertyId)->count() === 0, // First image is primary
                'display_order' => $maxOrder + 1
            ]);

            return response()->json([
                'message' => 'Image uploaded successfully',
                'image' => [
                    'id' => $propertyImage->id,
                    'url' => asset('storage/properties/' . $filename),
                    'is_primary' => $propertyImage->is_primary,
                    'display_order' => $propertyImage->display_order
                ]
            ], 201);
        }

        return response()->json(['message' => 'No image provided'], 400);
    }

    public function delete(Request $request, $propertyId, $imageId)
    {
        // Verify property belongs to vendor
        $property = PropertyMaster::where('PropertyId', $propertyId)
            ->where('vendor_id', $request->user()->id)
            ->firstOrFail();

        $image = PropertyImage::where('id', $imageId)
            ->where('property_id', $propertyId)
            ->firstOrFail();

        // Delete file from storage
        Storage::disk('public')->delete('properties/' . $image->image_path);

        // If this was primary, make another image primary
        if ($image->is_primary) {
            $nextImage = PropertyImage::where('property_id', $propertyId)
                ->where('id', '!=', $imageId)
                ->orderBy('display_order')
                ->first();
            
            if ($nextImage) {
                $nextImage->is_primary = true;
                $nextImage->save();
            }
        }

        $image->delete();

        return response()->json(['message' => 'Image deleted successfully']);
    }

    public function setPrimary(Request $request, $propertyId, $imageId)
    {
        // Verify property belongs to vendor
        $property = PropertyMaster::where('PropertyId', $propertyId)
            ->where('vendor_id', $request->user()->id)
            ->firstOrFail();

        // Unset current primary
        PropertyImage::where('property_id', $propertyId)
            ->update(['is_primary' => false]);

        // Set new primary
        $image = PropertyImage::where('id', $imageId)
            ->where('property_id', $propertyId)
            ->firstOrFail();
        
        $image->is_primary = true;
        $image->save();

        return response()->json([
            'message' => 'Primary image updated',
            'image' => $image
        ]);
    }

    public function getImages($propertyId)
    {
        $images = PropertyImage::where('property_id', $propertyId)
            ->orderBy('is_primary', 'desc')
            ->orderBy('display_order')
            ->get()
            ->map(function ($image) {
                return [
                    'id' => $image->id,
                    'url' => asset('storage/properties/' . $image->image_path),
                    'is_primary' => $image->is_primary,
                    'display_order' => $image->display_order
                ];
            });

        return response()->json($images);
    }

    public function updateOrder(Request $request, $propertyId)
    {
        $request->validate([
            'images' => 'required|array',
            'images.*.id' => 'required|exists:property_images,id',
            'images.*.display_order' => 'required|integer'
        ]);

        // Verify property belongs to vendor
        $property = PropertyMaster::where('PropertyId', $propertyId)
            ->where('vendor_id', $request->user()->id)
            ->firstOrFail();

        foreach ($request->images as $imageData) {
            PropertyImage::where('id', $imageData['id'])
                ->where('property_id', $propertyId)
                ->update(['display_order' => $imageData['display_order']]);
        }

        return response()->json(['message' => 'Image order updated']);
    }
}
