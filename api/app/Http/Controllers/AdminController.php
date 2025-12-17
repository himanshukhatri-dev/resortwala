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
        
        // Option 1: Delete the vendor
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
}
