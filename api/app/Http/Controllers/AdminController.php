<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Booking;
use App\Models\PropertyMaster;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Mail;
use App\Mail\HolidayStatusUpdatedMail;

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

        // Validation: Ensure Price is updated before approval
        $hasPriceUpdate = $request->anyFilled(['admin_pricing', 'Price']);
        $hasExistingPrice = !empty($property->admin_pricing) || $property->Price > 0;

        if (!$hasPriceUpdate && !$hasExistingPrice) {
            return response()->json([
                'message' => 'Cannot approve property. Please update the pricing details first.'
            ], 422);
        }

        // Update fields from request
        $property->fill($request->only([
            'Name', 'Location', 'ShortDescription', 'LongDescription', 
            'Occupancy', 'MaxCapacity', 'NoofRooms', 
            'checkInTime', 'checkOutTime', 
            'PropertyRules', 'BookingSpecailMessage',
            'admin_pricing',
            'GoogleMapLink', 'Website', 'Address', 'ContactPerson', 'MobileNo', 'Email', 'PropertyType'
        ]));

        // Merge Admin updates into onboarding_data
        $obData = $property->onboarding_data ?? [];
        
        // Helper to Merge
        $fieldsToMerge = ['Amenities', 'RoomConfig', 'otherAmenities', 'otherAttractions', 'otherRules', 'latitude', 'longitude'];
        foreach($fieldsToMerge as $field) {
            if ($request->has($field)) {
                $obData[$field] = $request->$field;
            }
        }
        
        // Prepare strict update array for DB::table
        // Only include columns that DEFINITELY exist in Schema
        $updateData = $request->only([
            'Name', 'Location', 'ShortDescription', 'LongDescription', 
            'Occupancy', 'MaxCapacity', 'NoofRooms', 
            'checkInTime', 'checkOutTime', 
            'PropertyRules', 'BookingSpecailMessage',
            'GoogleMapLink', 'Website', 'Address', 'ContactPerson', 'MobileNo', 'Email', 'PropertyType'
        ]);

        $updateData['is_approved'] = true;
        $updateData['onboarding_data'] = json_encode($obData); // Manual JSON encode for DB facade
        
        if ($request->has('admin_pricing')) {
            $updateData['admin_pricing'] = json_encode($request->admin_pricing);
        }

        // Use DB Facade to bypass Eloquent Model Magic/Attributes
        \Illuminate\Support\Facades\DB::table('property_masters')
            ->where('PropertyId', $id)
            ->update($updateData);

        return response()->json([
            'message' => 'Property approved successfully'
        ]);

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
        $bookings = Booking::with(['property' => function($q) {
            $q->select('PropertyId', 'Name', 'Location', 'vendor_id', 'PropertyType') // Select needed columns
              ->with('vendor:id,name,email,business_name,phone');
        }])
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

    // --- Calendar Actions for Admin ---

    public function lockDates(Request $request)
    {
        $request->validate([
            'property_id' => 'required',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $booking = new Booking();
        $booking->PropertyId = $request->property_id;
        $booking->CheckInDate = $request->start_date;
        $booking->CheckOutDate = $request->end_date;
        $booking->CustomerName = 'Admin Blocked'; // Distinct name
        $booking->Status = 'Blocked';
        $booking->CustomerMobile = 'N/A';
        $booking->Guests = 0;
        $booking->TotalAmount = 0;
        $booking->booked_by = 'admin'; // Track who blocked it if column exists
        $booking->save();

        return response()->json(['message' => 'Dates blocked successfully']);
    }

    public function approveBooking(Request $request, $id)
    {
        $booking = Booking::findOrFail($id);
        $booking->Status = 'Confirmed';
        $booking->save();
        return response()->json(['message' => 'Booking Approved']);
    }

    public function rejectBooking(Request $request, $id)
    {
        $booking = Booking::findOrFail($id);
        $booking->Status = 'Cancelled'; // Or Rejected
        $booking->save();
        return response()->json(['message' => 'Booking Rejected']);
    }

    // --- Holiday Approval ---
    public function getPendingHolidays(Request $request)
    {
        $holidays = \App\Models\Holiday::with('property:PropertyId,Name')
            ->where('approved', 0)
            ->get();
        return response()->json($holidays);
    }

    public function getAllHolidays(Request $request)
    {
        $holidays = \App\Models\Holiday::with('property:PropertyId,Name')
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($holidays);
    }

    public function approveHoliday(Request $request, $id)
    {
        $holiday = \App\Models\Holiday::with('property.vendor')->findOrFail($id);
        $holiday->approved = 1;
        $holiday->save();

        // Send Email
        if ($holiday->property && $holiday->property->vendor && $holiday->property->vendor->email) {
            try {
                Mail::to($holiday->property->vendor->email)->send(new HolidayStatusUpdatedMail($holiday, 'approved'));
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Failed to send holiday approval email: ' . $e->getMessage());
            }
        }

        return response()->json(['message' => 'Holiday Approved']);
    }

    public function rejectHoliday(Request $request, $id)
    {
        $request->validate([
            'reason' => 'required|string|max:1000'
        ]);

        $holiday = \App\Models\Holiday::with('property.vendor')->findOrFail($id);
        
        // Send Email before deleting
        if ($holiday->property && $holiday->property->vendor && $holiday->property->vendor->email) {
            try {
                Mail::to($holiday->property->vendor->email)->send(new HolidayStatusUpdatedMail($holiday, 'rejected', $request->reason));
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Failed to send holiday rejection email: ' . $e->getMessage());
            }
        }

        $holiday->delete();
        return response()->json(['message' => 'Holiday Rejected']);
    }

    public function bulkHolidayAction(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:holidays,id',
            'action' => 'required|in:approve,reject',
            'reason' => 'required_if:action,reject|nullable|string'
        ]);

        $ids = $request->ids;
        $action = $request->action;
        $reason = $request->reason;
        
        $holidays = \App\Models\Holiday::with('property.vendor')->whereIn('id', $ids)->get();
        $processedCount = 0;

        foreach ($holidays as $holiday) {
            // Skip already approved if action is approve? Or mostly just re-approve is fine.
            // Actually, pending checking logic is handled by frontend mostly, but good to be safe.
            
            if ($action === 'approve') {
                $holiday->approved = 1;
                $holiday->save();
                
                // Send Email
                if ($holiday->property && $holiday->property->vendor && $holiday->property->vendor->email) {
                    try {
                        Mail::to($holiday->property->vendor->email)->queue(new HolidayStatusUpdatedMail($holiday, 'approved'));
                    } catch (\Exception $e) {
                        \Illuminate\Support\Facades\Log::error('Failed to send holiday approval email: ' . $e->getMessage());
                    }
                }
            } elseif ($action === 'reject') {
                // Send Email
                if ($holiday->property && $holiday->property->vendor && $holiday->property->vendor->email) {
                    try {
                        Mail::to($holiday->property->vendor->email)->queue(new HolidayStatusUpdatedMail($holiday, 'rejected', $reason));
                    } catch (\Exception $e) {
                         \Illuminate\Support\Facades\Log::error('Failed to send holiday rejection email: ' . $e->getMessage());
                    }
                }
                $holiday->delete();
            }
            $processedCount++;
        }

        return response()->json([
            'message' => ucfirst($action) . 'd ' . $processedCount . ' holidays successfully',
            'count' => $processedCount
        ]);
    }
    public function getSystemInfo(Request $request)
    {
        return response()->json([
            'environment' => config('app.env'),
            'database' => config('database.connections.mysql.database'),
            'host' => config('database.connections.mysql.host'),
            'server_ip' => request()->server('SERVER_ADDR'),
            // Mask host if it's external IP, but show localhost clearly
        ]);
    }
}
