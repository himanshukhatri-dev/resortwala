<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\PropertyReview;
use App\Models\PropertyMaster;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Artisan;

class PropertyReviewController extends Controller
{
    /**
     * Submit a new review
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'property_id' => 'required|exists:property_masters,PropertyId',
            'user_name' => 'required|string|max:255',
            'rating' => 'required|numeric|min:1|max:5',
            'comment' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $review = PropertyReview::create([
            'property_id' => $request->property_id,
            'user_name' => $request->user_name,
            'rating' => $request->rating,
            'comment' => $request->comment,
            'verified' => auth('sanctum')->check() // Default verified if logged in
        ]);

        // Trigger manual rating sync for this property (In future, use a queue or observer)
        Artisan::call('resortwala:rating-sync');

        return response()->json([
            'success' => true,
            'message' => 'Review submitted successfully!',
            'review' => $review
        ]);
    }

    /**
     * Get reviews for a property
     */
    public function index($propertyId)
    {
        $reviews = PropertyReview::where('property_id', $propertyId)
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return response()->json($reviews);
    }
}
