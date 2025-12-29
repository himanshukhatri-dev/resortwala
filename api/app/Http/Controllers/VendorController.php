<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Services\NotificationService;

class VendorController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

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

        // Granular Booking Stats
        $todayBookings = \App\Models\Booking::whereHas('property', function($query) use ($vendor) {
            $query->where('vendor_id', $vendor->id);
        })->whereDate('created_at', now()->toDateString())->count();

        $weekBookings = \App\Models\Booking::whereHas('property', function($query) use ($vendor) {
            $query->where('vendor_id', $vendor->id);
        })->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])->count();

        $monthBookings = \App\Models\Booking::whereHas('property', function($query) use ($vendor) {
            $query->where('vendor_id', $vendor->id);
        })->whereMonth('created_at', now()->month)->count();

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
            'today_bookings' => $todayBookings,
            'week_bookings' => $weekBookings,
            'month_bookings' => $monthBookings,
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

        // Send Notification
        try {
            $this->notificationService->sendBookingStatusUpdate($booking, $request->status);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Notification Error: " . $e->getMessage());
        }

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

    // Demo login for vendor@resortwala (no OTP required)
    public function loginDemo(Request $request)
    {
        $user = User::where('email', 'vendor@resortwala.com')->first();

        if (!$user) {
            return response()->json(['message' => 'Demo account not found'], 404);
        }

        if ($user->role !== 'vendor') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $token = $user->createToken('vendor-token')->plainTextToken;

        return response()->json([
            'message' => 'Demo login successful',
            'user' => $user,
            'token' => $token
        ]);
    }

    // Send OTP for login (to both email and mobile)
    public function sendOTP(Request $request)
    {
        $request->validate([
            'identifier' => 'required|string'
        ]);

        // Try to find user by email or phone
        $user = User::where('email', $request->identifier)
            ->orWhere('phone', $request->identifier)
            ->where('role', 'vendor')
            ->first();

        if (!$user) {
            return response()->json(['message' => 'Vendor not found'], 404);
        }

        // Generate 6-digit OTP
        $otp = rand(100000, 999999);
        
        // Store OTP in cache for 5 minutes
        \Cache::put('vendor_otp_' . $request->identifier, $otp, now()->addMinutes(5));

        // TODO: Send OTP via SMS/Email to both
        \Log::info('Vendor OTP: ' . $otp . ' for ' . $request->identifier);

        return response()->json([
            'message' => 'OTP sent to both email and mobile',
            'otp' => $otp // Remove in production!
        ]);
    }

    // Verify OTP for login
    public function verifyOTP(Request $request)
    {
        $request->validate([
            'identifier' => 'required|string',
            'otp' => 'required|string|size:6'
        ]);

        $storedOTP = \Cache::get('vendor_otp_' . $request->identifier);

        if (!$storedOTP || $storedOTP != $request->otp) {
            return response()->json(['message' => 'Invalid or expired OTP'], 400);
        }

        $user = User::where('email', $request->identifier)
            ->orWhere('phone', $request->identifier)
            ->where('role', 'vendor')
            ->first();

        if (!$user) {
            return response()->json(['message' => 'Vendor not found'], 404);
        }

        // Clear OTP
        \Cache::forget('vendor_otp_' . $request->identifier);

        $token = $user->createToken('vendor-token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'user' => $user,
            'token' => $token
        ]);
    }

    // Send OTP for registration
    public function registerSendOTP(Request $request)
    {
        $request->validate([
            'email' => 'nullable|email|unique:users,email',
            'phone' => 'nullable|string|unique:users,phone',
            'name' => 'required|string',
            'business_name' => 'required|string'
        ]);

        // At least one contact method required
        if (!$request->email && !$request->phone) {
            return response()->json(['message' => 'Please provide at least email or mobile number'], 400);
        }

        $otpService = app(\App\Services\OtpService::class);
        
        // Skip OTP generation if coming from Firebase Phone Auth
        if ($request->skip_otp && $request->phone) {
            // Just cache the data for registration step
            $cacheKey = $request->phone;
             \Cache::put('vendor_reg_data_' . $cacheKey, $request->all(), now()->addMinutes(10));
             return response()->json(['message' => 'OTP handled by Firebase']);
        }
        
        // Generate ONE OTP for both email and phone
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        
        // Store OTP for both identifiers if provided
        try {
            if ($request->email) {
                \App\Models\Otp::create([
                    'identifier' => $request->email,
                    'code' => $otp,
                    'type' => 'vendor_registration',
                    'expires_at' => \Carbon\Carbon::now()->addMinutes(5)
                ]);
                $this->notificationService->sendEmailOTP($request->email, $otp, 'vendor_registration');
                \Log::info("Vendor Registration OTP sent to email: {$request->email}, OTP: {$otp}");
            }
            
            if ($request->phone) {
                \App\Models\Otp::create([
                    'identifier' => $request->phone,
                    'code' => $otp,
                    'type' => 'vendor_registration',
                    'expires_at' => \Carbon\Carbon::now()->addMinutes(5)
                ]);
                $this->notificationService->sendSMSOTP($request->phone, $otp, 'vendor_registration');
                \Log::info("Vendor Registration OTP sent to phone: {$request->phone}, OTP: {$otp}");
            }
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to send OTP: ' . $e->getMessage(),
                'debug_info' => [
                    'mailer' => config('mail.default'),
                    'host' => config('mail.mailers.smtp.host'),
                    'port' => config('mail.mailers.smtp.port'),
                    'encryption' => config('mail.mailers.smtp.encryption'),
                    // Do not expose password
                    'username' => config('mail.mailers.smtp.username') ? 'SET' : 'NOT SET',
                ]
            ], 500);
        }
        
        // Store registration data in cache
        $cacheKey = $request->email ?: $request->phone;
        \Cache::put('vendor_reg_data_' . $cacheKey, $request->all(), now()->addMinutes(10));

        return response()->json([
            'message' => 'OTP sent to ' . ($request->email && $request->phone ? 'both email and mobile' : ($request->email ? 'email' : 'mobile')),
            'debug_otp' => $otp // TEMPORARY: Remove in production
        ]);
    }

    // Verify OTP and complete registration
    public function registerVerifyOTP(Request $request)
    {
        $request->validate([
            'otp' => 'required|string|size:6'
        ]);

        $otpService = app(\App\Services\OtpService::class);
        
        // Try to verify OTP for email or phone
        $isValid = false;
        $cacheKey = null;

        // Verify Firebase Token if present
        if ($request->firebase_token) {
            // TODO: Verify token with Firebase Admin SDK
            // For now, implicit trust as per CustomerAuthController pattern
             $isValid = true;
             $cacheKey = $request->email ?: $request->phone; // Match sendOTP logic
        } else {
             // Normal OTP verification logic

        if ($request->email) {
            $isValid = $otpService->verify($request->email, $request->otp, 'vendor_registration');
            $cacheKey = $request->email;
        }
        
        if (!$isValid && $request->phone) {
                $isValid = $otpService->verify($request->phone, $request->otp, 'vendor_registration');
                $cacheKey = $request->phone;
            }
        }

        if (!$isValid) {
            return response()->json(['message' => 'Invalid or expired OTP'], 400);
        }

        $regData = \Cache::get('vendor_reg_data_' . $cacheKey);

        if (!$regData) {
            return response()->json(['message' => 'Registration data expired. Please start again.'], 400);
        }

        $user = User::create([
            'name' => $regData['name'],
            'email' => $regData['email'] ?? null,
            'phone' => $regData['phone'] ?? null,
            'password' => Hash::make(bin2hex(random_bytes(16))),
            'role' => 'vendor',
            'business_name' => $regData['business_name'],
            'is_approved' => false
        ]);

        // Clear cache
        \Cache::forget('vendor_reg_data_' . $cacheKey);

        // Send registration confirmation email
        $this->notificationService->sendVendorRegistrationEmail($user);

        $token = $user->createToken('vendor-token')->plainTextToken;

        return response()->json([
            'message' => 'Registration successful',
            'user' => $user,
            'token' => $token
        ], 201);
    }

    // Approve vendor account
    public function approveVendor(Request $request, $id)
    {
        $vendor = User::where('id', $id)->where('role', 'vendor')->first();

        if (!$vendor) {
            return response()->json(['message' => 'Vendor not found'], 404);
        }

        $vendor->is_approved = true;
        $vendor->save();

        // Send approval email
        $this->notificationService->sendVendorApprovalEmail($vendor);

        return response()->json([
            'message' => 'Vendor approved successfully',
            'vendor' => $vendor
        ]);
    }

    // Reject vendor account
    public function rejectVendor(Request $request, $id)
    {
        $request->validate([
            'rejection_comment' => 'required|string|min:10'
        ]);

        $vendor = User::where('id', $id)->where('role', 'vendor')->first();

        if (!$vendor) {
            return response()->json(['message' => 'Vendor not found'], 404);
        }

        $vendor->is_approved = false;
        $vendor->rejection_comment = $request->rejection_comment;
        $vendor->save();

        // Send rejection email
        $this->notificationService->sendVendorRejectionEmail($vendor, $request->rejection_comment);

        return response()->json([
            'message' => 'Vendor rejected successfully',
            'vendor' => $vendor
        ]);
    }
}
