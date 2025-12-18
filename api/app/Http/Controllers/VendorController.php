<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class VendorController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'business_name' => 'required|string|max:255',
            'phone' => 'required|string|max:15',
            'vendor_type' => 'required|in:Resort,WaterPark,Villa',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'vendor',
            'business_name' => $validated['business_name'],
            'phone' => $validated['phone'],
            'vendor_type' => $validated['vendor_type'],
            'is_approved' => false, // Requires admin approval
        ]);

        $token = $user->createToken('vendor-token')->plainTextToken;

        return response()->json([
            'message' => 'Vendor registered successfully. Awaiting admin approval.',
            'user' => $user,
            'token' => $token
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if ($user->role !== 'vendor') {
            return response()->json(['message' => 'Unauthorized. Vendor access only.'], 403);
        }

        $token = $user->createToken('vendor-token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'user' => $user,
            'token' => $token
        ]);
    }

    public function profile(Request $request)
    {
        return response()->json([
            'user' => $request->user()
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:15',
            'business_name' => 'nullable|string|max:255',
            'business_logo' => 'nullable|string|max:2048', // Allow URL or path
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'zip_code' => 'nullable|string|max:20',
            'description' => 'nullable|string',
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully'
        ]);
    }

    public function getBookings(Request $request)
    {
        $vendor = $request->user();
        
        // Get all bookings for properties owned by this vendor
        $bookings = \App\Models\Booking::whereHas('property', function($query) use ($vendor) {
            $query->where('vendor_id', $vendor->id);
        })
        ->with(['property:PropertyId,Name,Location'])
        ->orderBy('created_at', 'desc')
        ->get();

        return response()->json($bookings);
    }

    public function getStats(Request $request)
    {
        $vendor = $request->user();
        
        // Get vendor's properties
        $totalProperties = \App\Models\PropertyMaster::where('vendor_id', $vendor->id)->count();
        $approvedProperties = \App\Models\PropertyMaster::where('vendor_id', $vendor->id)
            ->where('is_approved', true)
            ->count();
        $pendingProperties = \App\Models\PropertyMaster::where('vendor_id', $vendor->id)
            ->where('is_approved', false)
            ->count();

        // Get bookings for vendor's properties
        $totalBookings = \App\Models\Booking::whereHas('property', function($query) use ($vendor) {
            $query->where('vendor_id', $vendor->id);
        })->count();

        // Get recent bookings (last 5)
        $recentBookings = \App\Models\Booking::whereHas('property', function($query) use ($vendor) {
            $query->where('vendor_id', $vendor->id);
        })
        ->with(['property:PropertyId,Name,Location'])
        ->orderBy('created_at', 'desc')
        ->limit(5)
        ->get();

        // Calculate total revenue (if you have pricing in bookings)
        $totalRevenue = \App\Models\Booking::whereHas('property', function($query) use ($vendor) {
            $query->where('vendor_id', $vendor->id);
        })->sum('TotalAmount') ?? 0;

        // Chart Data (Last 7 Days)
        $chartData = collect(range(6, 0))->map(function ($daysAgo) use ($vendor) {
            $date = now()->subDays($daysAgo);
            return [
                'name' => $date->format('D'),
                'bookings' => \App\Models\Booking::whereHas('property', function ($q) use ($vendor) {
                    $q->where('vendor_id', $vendor->id);
                })->whereDate('created_at', $date->toDateString())->count(),
                'views' => rand(15, 80) // Placeholder for view analytics
            ];
        })->values();

        return response()->json([
            'total_properties' => $totalProperties,
            'approved_properties' => $approvedProperties,
            'pending_properties' => $pendingProperties,
            'total_bookings' => $totalBookings,
            'total_revenue' => $totalRevenue,
            'recent_bookings' => $recentBookings,
            'chart_data' => $chartData,
            'approval_status' => $vendor->is_approved ? 'approved' : 'pending'
        ]);
    }

    public function updateBookingStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:confirmed,rejected,cancelled'
        ]);

        $vendor = $request->user();
        $booking = \App\Models\Booking::findOrFail($id);
        
        // Verify ownership
        $property = \App\Models\PropertyMaster::where('PropertyId', $booking->PropertyId)
            ->where('vendor_id', $vendor->id)
            ->first();

        if (!$property) {
            return response()->json(['message' => 'Unauthorized access to this booking'], 403);
        }

        $booking->Status = $request->status;
        $booking->save();

        return response()->json([
            'message' => 'Booking status updated successfully',
            'booking' => $booking
        ]);
    }

    public function freezeDate(Request $request)
    {
        $request->validate([
            'property_id' => 'required|exists:property_masters,PropertyId',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'nullable|string'
        ]);

        $vendor = $request->user();
        
        // Verify ownership
        $property = \App\Models\PropertyMaster::where('PropertyId', $request->property_id)
            ->where('vendor_id', $vendor->id)
            ->first();

        if (!$property) {
            return response()->json(['message' => 'Unauthorized access to this property'], 403);
        }

        // Check for existing blocking overlaps? 
        // For now, we allow multiple bookings (maybe multiple rooms?). 
        // If strict single unit, we should block.
        // Assuming multi-unit or let vendor manage conflicts.

        $booking = new \App\Models\Booking();
        $booking->PropertyId = $request->property_id;
        $booking->CustomerName = 'Vendor Block' . ($request->reason ? ': ' . $request->reason : '');
        $booking->CustomerMobile = $vendor->phone;
        $booking->CustomerEmail = $vendor->email;
        $booking->CheckInDate = $request->start_date;
        $booking->CheckOutDate = $request->end_date;
        $booking->Guests = 0;
        $booking->TotalAmount = 0;
        $booking->Status = 'blocked';
        $booking->save();

        return response()->json(['message' => 'Dates frozen successfully', 'booking' => $booking], 201);
    }
}
