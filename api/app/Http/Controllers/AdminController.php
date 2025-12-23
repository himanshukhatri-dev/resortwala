<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Booking;
use App\Models\PropertyMaster;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AdminController extends Controller
{
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

        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access only.'], 403);
        }

        $token = $user->createToken('admin-token')->plainTextToken;

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

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully'
        ]);
    }

    public function getStats(Request $request)
    {
        $stats = [
            'total_properties' => PropertyMaster::count(),
            'total_bookings' => Booking::count(),
            'pending_vendors' => User::where('role', 'vendor')->where('is_approved', false)->count(),
            'approved_vendors' => User::where('role', 'vendor')->where('is_approved', true)->count(),
        ];

        return response()->json($stats);
    }

    public function getPendingVendors(Request $request)
    {
        $vendors = User::where('role', 'vendor')
            ->where('is_approved', false)
            ->select('id', 'name', 'email', 'business_name', 'phone', 'vendor_type', 'created_at')
            ->get();

        return response()->json($vendors);
    }

    public function approveVendor(Request $request, $id)
    {
        $vendor = User::where('role', 'vendor')->findOrFail($id);
        $vendor->is_approved = true;
        $vendor->save();

        return response()->json([
            'message' => 'Vendor approved successfully',
            'vendor' => $vendor
        ]);
    }

    public function rejectVendor(Request $request, $id)
    {
        $vendor = User::where('role', 'vendor')->findOrFail($id);
        
        // Check for existing properties
        if ($vendor->properties()->exists()) {
             return response()->json(['message' => 'Cannot delete vendor. They have existing properties. Please delete properties first.'], 422);
        }
        
        // Cascade delete onboarding tokens
        \App\Models\OnboardingToken::where('user_id', $id)
            ->where('user_type', 'user')
            ->delete();

        $vendor->delete();

        return response()->json([
            'message' => 'Vendor rejected and removed'
        ]);
    }

    public function getAllVendors(Request $request)
    {
        $vendors = User::where('role', 'vendor')
            ->select('id', 'name', 'email', 'business_name', 'phone', 'vendor_type', 'is_approved', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($vendors);
    }

    public function getVendor(Request $request, $id)
    {
        $vendor = User::where('role', 'vendor')
            ->where('id', $id)
            ->firstOrFail();

        // Include any related data if needed, e.g., properties
        // $vendor->load('properties'); 

        return response()->json($vendor);
    }

    public function getAllProperties(Request $request)
    {
        $properties = PropertyMaster::with('vendor:id,name,business_name,email')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($properties);
    }

    public function getPendingProperties(Request $request)
    {
        $properties = PropertyMaster::with('vendor:id,name,business_name')
            ->where('is_approved', false)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($properties);
    }

    public function approveProperty(Request $request, $id)
    {
        \App\Helpers\Profiler::checkpoint('Start approveProperty');
        
        $property = PropertyMaster::findOrFail($id);
        \App\Helpers\Profiler::checkpoint('After findOrFail');
        
        $property->is_approved = true;
        \App\Helpers\Profiler::checkpoint('After setting is_approved');
        
        $property->save();
        \App\Helpers\Profiler::checkpoint('After save');

        return response()->json([
            'message' => 'Property approved successfully',
            'property' => $property
        ]);
    }

    public function rejectProperty(Request $request, $id)
    {
        $property = PropertyMaster::findOrFail($id);
        $property->delete();

        return response()->json([
            'message' => 'Property rejected and removed'
        ]);
    }

    public function getAllBookings(Request $request)
    {
        $bookings = Booking::with(['property:PropertyId,Name,Location'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($bookings);
    }

    public function updateBookingStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:confirmed,rejected,cancelled'
        ]);

        $booking = Booking::findOrFail($id);
        $booking->Status = $request->status;
        $booking->save();

        return response()->json([
            'message' => 'Booking status updated successfully',
            'booking' => $booking
        ]);
    }

    public function globalSearch(Request $request)
    {
        $query = $request->query('query');
        if (!$query) {
            return response()->json([]);
        }

        $results = [];

        // 1. Search Users (Admin/Vendors)
        $users = User::where('name', 'LIKE', "%{$query}%")
            ->orWhere('email', 'LIKE', "%{$query}%")
            ->orWhere('phone', 'LIKE', "%{$query}%")
            ->orWhere('business_name', 'LIKE', "%{$query}%")
            ->select('id', 'name', 'email', 'phone', 'role', 'business_name')
            ->limit(5)
            ->get()
            ->map(function($u) {
                $u->type = 'user';
                return $u;
            });
        $results = array_merge($results, $users->toArray());

        // 2. Search Customers
        $customers = \App\Models\Customer::where('name', 'LIKE', "%{$query}%")
            ->orWhere('email', 'LIKE', "%{$query}%")
            ->orWhere('phone', 'LIKE', "%{$query}%")
            ->select('id', 'name', 'email', 'phone')
            ->limit(5)
            ->get()
            ->map(function($c) {
                $c->type = 'customer';
                return $c;
            });
        $results = array_merge($results, $customers->toArray());

        // 3. Search Properties
        $properties = PropertyMaster::where('Name', 'LIKE', "%{$query}%")
            ->orWhere('Location', 'LIKE', "%{$query}%")
            ->select('PropertyId as id', 'Name as name', 'Location')
            ->limit(5)
            ->get()
            ->map(function($p) {
                $p->type = 'property';
                return $p;
            });
        $results = array_merge($results, $properties->toArray());

        // 4. Search Bookings
        $bookings = Booking::where('BookingId', 'LIKE', "%{$query}%")
            ->orWhere('CustomerName', 'LIKE', "%{$query}%")
            ->select('BookingId as id', 'CustomerName as name', 'Status')
            ->limit(5)
            ->get()
            ->map(function($b) {
                $b->type = 'booking';
                return $b;
            });
        $results = array_merge($results, $bookings->toArray());

        return response()->json($results);
    }
}
