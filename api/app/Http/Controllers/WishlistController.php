<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\PropertyMaster;
use Illuminate\Support\Facades\DB;

class WishlistController extends Controller
{
    // Get all wishlisted properties for the authenticated user
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $favorites = DB::table('wishlists')
            ->where('user_id', $user->id)
            ->pluck('property_id');

        // Fetch property details with images
        $properties = PropertyMaster::with(['images', 'primaryImage'])->whereIn('PropertyId', $favorites)->get();

        return response()->json($properties);
    }

    // Toggle wishlist status
    public function toggle(Request $request)
    {
        $request->validate([
            'property_id' => 'required|exists:property_masters,PropertyId'
        ]);

        $user = $request->user();
        $propertyId = $request->property_id;

        $exists = DB::table('wishlists')
            ->where('user_id', $user->id)
            ->where('property_id', $propertyId)
            ->exists();

        if ($exists) {
            DB::table('wishlists')
                ->where('user_id', $user->id)
                ->where('property_id', $propertyId)
                ->delete();
            return response()->json(['message' => 'Removed from wishlist', 'status' => 'removed']);
        } else {
            DB::table('wishlists')->insert([
                'user_id' => $user->id,
                'property_id' => $propertyId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            return response()->json(['message' => 'Added to wishlist', 'status' => 'added']);
        }
    }
}
