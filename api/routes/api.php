<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PropertyMasterController;
use App\Http\Controllers\ForgotPasswordController;
use App\Http\Controllers\StatusController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// System Status Route (Public)
Route::get('/status', [StatusController::class, 'check']);
Route::get('/admin/system-info', [\App\Http\Controllers\AdminController::class, 'getSystemInfo']);

Route::post('/forgot-password', [ForgotPasswordController::class, 'sendOtp']);
Route::post('/verify-otp', [ForgotPasswordController::class, 'verifyOtp']);
Route::post('/reset-password', [ForgotPasswordController::class, 'resetPassword']);

// New Generic OTP System
Route::post('/otp/send', [\App\Http\Controllers\OtpController::class, 'send']);
Route::post('/otp/verify', [\App\Http\Controllers\OtpController::class, 'verify']);

// Fallback login route for Sanctum unauthenticated redirection
Route::get('/login', function () {
    return response()->json(['message' => 'Unauthenticated.'], 401);
})->name('login');

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Client-Customer Routes
Route::get('/properties', [PropertyMasterController::class, 'index']);
Route::get('/properties/{id}', [PropertyMasterController::class, 'show']);
Route::get('/properties/{id}/images', [\App\Http\Controllers\PropertyImageController::class, 'getImages']);
Route::post('/bookings', [\App\Http\Controllers\BookingController::class, 'store']);
Route::get('/bookings/search', [\App\Http\Controllers\BookingController::class, 'search']);
Route::post('/bookings/{id}/cancel', [\App\Http\Controllers\BookingController::class, 'cancel']);
Route::get('/properties/{id}/booked-dates', [PropertyMasterController::class, 'getBookedDates']);
Route::post('/coupons/check', [\App\Http\Controllers\CouponController::class, 'check']);

// Event Tracking (Analytics)
Route::post('/events/track', [\App\Http\Controllers\EventController::class, 'track']);
Route::post('/events/batch', [\App\Http\Controllers\EventController::class, 'batchTrack']);


// Customer Authentication Routes
// Public Availability (Shareable Links)
Route::get('/public/properties/{id}/calendar', [\App\Http\Controllers\PublicController::class, 'getPropertyCalendar']);
Route::get('/public/vendors/{id}/calendar', [\App\Http\Controllers\PublicController::class, 'getVendorMasterCalendar']);
Route::post('/public/bookings/request', [\App\Http\Controllers\PublicAvailabilityController::class, 'request']);
// Alternative path using unique top-level segment to avoid any properties resource conflicts
Route::post('/request-booking', [\App\Http\Controllers\PublicAvailabilityController::class, 'request']);

// Route::post('/register', [AuthController::class, 'register']);

Route::post('/customer/register', [\App\Http\Controllers\CustomerAuthController::class, 'register']);
Route::post('/customer/login', [\App\Http\Controllers\CustomerAuthController::class, 'login']);
Route::post('/customer/login-otp', [\App\Http\Controllers\CustomerAuthController::class, 'loginOtp']);
Route::post('/customer/login-email-otp', [\App\Http\Controllers\CustomerAuthController::class, 'loginWithEmailOtp']);

// Customer Protected Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/customer/profile', [\App\Http\Controllers\CustomerAuthController::class, 'profile']);
    Route::post('/customer/logout', [\App\Http\Controllers\CustomerAuthController::class, 'logout']);
    
    // Wishlist Routes
    Route::get('/customer/wishlist', [\App\Http\Controllers\WishlistController::class, 'index']);
    Route::post('/customer/wishlist/toggle', [\App\Http\Controllers\WishlistController::class, 'toggle']);
    
    // Verification Routes
    Route::post('/customer/send-verification-email', [\App\Http\Controllers\VerificationController::class, 'sendEmailVerification']);
    Route::post('/customer/verify-email', [\App\Http\Controllers\VerificationController::class, 'verifyEmail']);
    Route::post('/customer/send-verification-phone', [\App\Http\Controllers\VerificationController::class, 'sendPhoneVerification']);
    Route::post('/customer/verify-phone', [\App\Http\Controllers\VerificationController::class, 'verifyPhone']);
    Route::put('/customer/profile', [\App\Http\Controllers\VerificationController::class, 'updateProfile']);
    Route::post('/customer/device-token', [\App\Http\Controllers\CustomerAuthController::class, 'updateDeviceToken']);
});



// Vendor Authentication Routes
Route::post('/vendor/register', [\App\Http\Controllers\VendorController::class, 'register']);
Route::post('/vendor/login', [\App\Http\Controllers\VendorController::class, 'login']);
Route::post('/vendor/login-demo', [\App\Http\Controllers\VendorController::class, 'loginDemo']);
Route::post('/vendor/send-otp', [\App\Http\Controllers\VendorController::class, 'sendOTP']);
Route::post('/vendor/verify-otp', [\App\Http\Controllers\VendorController::class, 'verifyOTP']);
Route::post('/vendor/register-send-otp', [\App\Http\Controllers\VendorController::class, 'registerSendOTP']);
Route::post('/vendor/register-verify-otp', [\App\Http\Controllers\VendorController::class, 'registerVerifyOTP']);

// Admin routes for vendor management
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/admin/vendors/{id}/approve', [\App\Http\Controllers\VendorController::class, 'approveVendor']);
    Route::post('/admin/vendors/{id}/reject', [\App\Http\Controllers\VendorController::class, 'rejectVendor']);
});

// Public Utility Routes
Route::get('/ping', function () {
    return response()->json(['status' => 'ok', 'message' => 'PHP is reachable']);
});

Route::get('/health', [StatusController::class, 'check']); // Alias for status

// Public Holiday Route (for pricing calculation)
Route::get('/holidays', [\App\Http\Controllers\HolidayController::class, 'index']);
Route::get('/holidays/fix-approve', [\App\Http\Controllers\HolidayController::class, 'approveAll']);

// DEBUG ROUTE - REMOVE AFTER FIXING 500 ERROR
Route::get('/debug-db', function() {
    try {
        \Illuminate\Support\Facades\DB::connection()->getPdo();
        $dbName = \Illuminate\Support\Facades\DB::connection()->getDatabaseName();
        // Try reading a table
        $count = \App\Models\User::count();
        return response()->json([
            'status' => 'success', 
            'message' => "Connected to database: $dbName",
            'user_count' => $count,
            'env_db_host' => env('DB_HOST'),
            'env_db_name' => env('DB_DATABASE'),
            'env_db_user' => env('DB_USERNAME'),
            // Do NOT print password
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage(),
            'code' => $e->getCode(),
            'env_db_host' => env('DB_HOST'),
            'env_db_name' => env('DB_DATABASE'),
            'env_db_user' => env('DB_USERNAME'),
        ], 500);
    }
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/vendor/profile', [\App\Http\Controllers\VendorController::class, 'profile']);
    Route::put('/vendor/profile', [\App\Http\Controllers\VendorController::class, 'updateProfile']);
    Route::post('/vendor/logout', [\App\Http\Controllers\VendorController::class, 'logout']);
    Route::get('/vendor/stats', [\App\Http\Controllers\VendorController::class, 'getStats']);
    Route::get('/vendor/bookings', [\App\Http\Controllers\VendorController::class, 'getBookings']);
    
    Route::get('/vendor/bookings', [\App\Http\Controllers\VendorController::class, 'getBookings']);
    Route::get('/vendor/bookings/property/{id}', [\App\Http\Controllers\VendorController::class, 'getPropertyBookings']);

    // Protected routes
    Route::post('/vendor/bookings/{id}/status', [\App\Http\Controllers\VendorController::class, 'updateBookingStatus']);
    Route::post('/vendor/bookings/freeze', [\App\Http\Controllers\VendorController::class, 'freezeDate']);
    Route::post('/holidays', [\App\Http\Controllers\HolidayController::class, 'store']);
    Route::delete('/holidays/{id}', [\App\Http\Controllers\HolidayController::class, 'destroy']);

    // Vendor Property Management
    Route::get('/vendor/properties', [\App\Http\Controllers\VendorPropertyController::class, 'index']);
    Route::post('/vendor/properties', [\App\Http\Controllers\VendorPropertyController::class, 'store']);
    Route::get('/vendor/properties/{id}', [\App\Http\Controllers\VendorPropertyController::class, 'show']);
    Route::put('/vendor/properties/{id}', [\App\Http\Controllers\VendorPropertyController::class, 'update']);
    Route::delete('/vendor/properties/{id}', [\App\Http\Controllers\VendorPropertyController::class, 'destroy']);
    
    // Property Images
    Route::post('/vendor/properties/{id}/images', [\App\Http\Controllers\PropertyImageController::class, 'upload']);
    Route::delete('/vendor/properties/{propertyId}/images/{imageId}', [\App\Http\Controllers\PropertyImageController::class, 'delete']);
    Route::put('/vendor/properties/{propertyId}/images/{imageId}/primary', [\App\Http\Controllers\PropertyImageController::class, 'setPrimary']);
    Route::put('/vendor/properties/{propertyId}/images/order', [\App\Http\Controllers\PropertyImageController::class, 'updateOrder']);

    // Property Videos
    Route::delete('/vendor/properties/videos/{videoId}', [\App\Http\Controllers\VendorPropertyController::class, 'deleteVideo']);

    // Vendor Calendar & Automation
    Route::get('/vendor/properties/{id}/calendar', [App\Http\Controllers\VendorCalendarController::class, 'index']);
    Route::post('/vendor/bookings/lock', [App\Http\Controllers\VendorCalendarController::class, 'lock']);
    Route::post('/vendor/bookings/{id}/approve', [App\Http\Controllers\VendorCalendarController::class, 'approve']);
    Route::post('/vendor/bookings/{id}/reject', [App\Http\Controllers\VendorCalendarController::class, 'reject']);
});

Route::post('/vendor/calendar/seed', [App\Http\Controllers\VendorCalendarController::class, 'seed']);

// --- Payment Gateway Routes (PhonePe) ---
// Route::post('/payment/initiate', [\App\Http\Controllers\PaymentController::class, 'initiate'])->name('payment.initiate'); // Deprecated: Handled by BookingController
Route::post('/payment/callback', [\App\Http\Controllers\PaymentController::class, 'callback'])
    ->withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class])
    ->name('payment.callback');


// Admin Intelligence
Route::prefix('admin/intelligence')->middleware(['auth:sanctum', 'verified'])->group(function () {
    Route::get('/schema', [App\Http\Controllers\Admin\AdminIntelligenceController::class, 'getSchema']);
    Route::get('/data/{table}', [App\Http\Controllers\Admin\AdminIntelligenceController::class, 'getTableData']);
    Route::put('/data/{table}/{id}', [App\Http\Controllers\Admin\AdminIntelligenceController::class, 'updateTableData']);
    
    // Database Backups
    Route::get('/backups', [App\Http\Controllers\Admin\BackupController::class, 'index']);
    Route::post('/backups', [App\Http\Controllers\Admin\BackupController::class, 'create']); // Changed from store to create to match controller
    Route::post('/backups/{filename}/restore', [App\Http\Controllers\Admin\BackupController::class, 'restore']); // Fixed route param
    Route::get('/backups/{filename}/download', [App\Http\Controllers\Admin\BackupController::class, 'download']); // Added download
    Route::delete('/backups/{filename}', [App\Http\Controllers\Admin\BackupController::class, 'delete']); // Changed from destroy to delete
});

// Admin Authentication Routes
Route::post('/admin/login', [\App\Http\Controllers\AdminController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/admin/profile', [\App\Http\Controllers\AdminController::class, 'profile']);
    Route::post('/admin/logout', [\App\Http\Controllers\AdminController::class, 'logout']);
    Route::get('/admin/stats', [\App\Http\Controllers\AdminController::class, 'getStats']);
    Route::get('/admin/search', [\App\Http\Controllers\AdminController::class, 'globalSearch']);
    Route::get('/admin/vendors', [\App\Http\Controllers\AdminController::class, 'getAllVendors']);
    Route::get('/admin/vendors/pending', [\App\Http\Controllers\AdminController::class, 'getPendingVendors']);
    Route::get('/admin/vendors/{id}', [\App\Http\Controllers\AdminController::class, 'getVendor']);
    Route::post('/admin/vendors/{id}/approve', [\App\Http\Controllers\AdminController::class, 'approveVendor']);
    Route::delete('/admin/vendors/{id}/reject', [\App\Http\Controllers\AdminController::class, 'rejectVendor']);
    
    // Admin Property Management
    Route::post('/admin/properties', [\App\Http\Controllers\AdminPropertyController::class, 'store']);
    Route::get('/admin/properties', [\App\Http\Controllers\AdminController::class, 'getAllProperties']);
    Route::get('/admin/properties/pending', [\App\Http\Controllers\AdminController::class, 'getPendingProperties']);
    Route::get('/admin/properties/{id}/calendar', [\App\Http\Controllers\AdminPropertyController::class, 'getCalendar']);
    
    // Analytics routes (Admin)
    Route::get('/admin/analytics/events', [\App\Http\Controllers\Admin\AnalyticsController::class, 'getEventLogs']);
    Route::get('/admin/analytics/stats', [\App\Http\Controllers\Admin\AnalyticsController::class, 'getEventStats']);
    Route::get('/admin/analytics/filters', [\App\Http\Controllers\Admin\AnalyticsController::class, 'getEventFilters']);
    Route::put('/admin/properties/{id}/approve', [\App\Http\Controllers\AdminPropertyController::class, 'approve']);
    Route::put('/admin/properties/{id}/pricing', [\App\Http\Controllers\AdminPropertyController::class, 'updatePricing']);
    Route::get('/admin/properties/{id}', [\App\Http\Controllers\AdminPropertyController::class, 'show']);
    Route::delete('/admin/properties/{id}/reject', [\App\Http\Controllers\AdminController::class, 'rejectProperty']);
    
    // Change Requests
    Route::post('/admin/properties/import', [\App\Http\Controllers\Admin\ImportController::class, 'import']);
    Route::get('/admin/property-changes', [\App\Http\Controllers\AdminPropertyController::class, 'getChangeRequests']);
    Route::get('/admin/property-changes/{id}', [\App\Http\Controllers\AdminPropertyController::class, 'getChangeRequest']);

    // Admin Calendar Routes (Added for parity with Vendor)
    Route::get('/admin/bookings', [\App\Http\Controllers\AdminController::class, 'getAllBookings']);
    Route::post('/admin/bookings/lock', [\App\Http\Controllers\AdminController::class, 'lockDates']); // Needs implementation
    Route::post('/admin/bookings/{id}/approve', [\App\Http\Controllers\AdminController::class, 'approveBooking']); // Needs impl
    Route::post('/admin/bookings/{id}/reject', [\App\Http\Controllers\AdminController::class, 'rejectBooking']); // Needs impl
    Route::post('/admin/properties/{id}/changes/approve', [\App\Http\Controllers\AdminPropertyController::class, 'approveChanges']);
    Route::post('/admin/properties/{id}/changes/reject', [\App\Http\Controllers\AdminPropertyController::class, 'rejectChanges']);

    // Admin Holiday Approval
    Route::post('/admin/holidays/bulk-action', [\App\Http\Controllers\AdminController::class, 'bulkHolidayAction']);
    Route::get('/admin/holidays', [\App\Http\Controllers\AdminController::class, 'getAllHolidays']);
    Route::get('/admin/holidays/pending', [\App\Http\Controllers\AdminController::class, 'getPendingHolidays']);
    Route::post('/admin/holidays/{id}/approve', [\App\Http\Controllers\AdminController::class, 'approveHoliday']);
    Route::post('/admin/holidays/{id}/reject', [\App\Http\Controllers\AdminController::class, 'rejectHoliday']);
    
    // Admin Booking Management
    Route::get('/admin/bookings', [\App\Http\Controllers\AdminController::class, 'getAllBookings']);
    Route::post('/admin/bookings/{id}/status', [\App\Http\Controllers\AdminController::class, 'updateBookingStatus']);
    Route::post('/admin/bookings/{id}/resend-email', [\App\Http\Controllers\BookingController::class, 'resendConfirmation']);
    
    // User Management
    Route::get('/admin/users/admins', [\App\Http\Controllers\AdminUserController::class, 'getAdmins']);
    Route::post('/admin/users/admins', [\App\Http\Controllers\AdminUserController::class, 'createAdmin']);

    Route::get('/admin/users/vendors', [\App\Http\Controllers\AdminUserController::class, 'getVendors']);
    Route::post('/admin/users/vendors', [\App\Http\Controllers\AdminUserController::class, 'createVendor']);
    
    // Generic User Update (Admin & Vendor) & Delete
    Route::put('/admin/users/{id}', [\App\Http\Controllers\AdminUserController::class, 'updateUser']);
    Route::put('/admin/users/{id}/role', [\App\Http\Controllers\AdminUserController::class, 'updateRole']);
    Route::delete('/admin/users/{id}', [\App\Http\Controllers\AdminUserController::class, 'deleteUser']);

    Route::get('/admin/users/customers', [\App\Http\Controllers\AdminUserController::class, 'getCustomers']);
    Route::post('/admin/users/customers', [\App\Http\Controllers\AdminUserController::class, 'createCustomer']);
    Route::put('/admin/users/customers/{id}', [\App\Http\Controllers\AdminUserController::class, 'updateCustomer']);
    Route::delete('/admin/users/customers/{id}', [\App\Http\Controllers\AdminUserController::class, 'deleteCustomer']);

    // Admin Intelligence Interface
    Route::prefix('admin/intelligence')->group(function () {
        Route::get('/schema', [\App\Http\Controllers\IntelligenceController::class, 'getSchema']);
        Route::get('/routes', [\App\Http\Controllers\IntelligenceController::class, 'getRoutes']);
        Route::get('/logs', [\App\Http\Controllers\IntelligenceController::class, 'getLogs']);
        
        // Live Data Editor
        Route::get('/data/{table}', [\App\Http\Controllers\IntelligenceController::class, 'getData']);
        Route::put('/data/{table}/{id}', [\App\Http\Controllers\IntelligenceController::class, 'updateData']);
    });
});




// Onboarding Routes (Public for setting password)
Route::post('/onboard/complete', [\App\Http\Controllers\OnboardingController::class, 'complete']);
Route::get('/onboard/verify/{token}', [\App\Http\Controllers\OnboardingController::class, 'verifyToken']);
Route::post('/onboard/set-password', [\App\Http\Controllers\OnboardingController::class, 'setPassword']);

// Admin Onboarding Initialization
Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/admin/impersonate/{userId}', [\App\Http\Controllers\ImpersonationController::class, 'impersonate']);
    Route::post('/admin/onboard', [\App\Http\Controllers\OnboardingController::class, 'onboard']);
});
