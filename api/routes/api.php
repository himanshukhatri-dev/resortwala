<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PropertyMasterController;
use App\Http\Controllers\ForgotPasswordController;
use App\Http\Controllers\StatusController;


// Debug Route
require_once __DIR__ . '/debug_route.php';

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// System Status Route (Public)
Route::get('/status', [StatusController::class, 'check']);
Route::post('/events/batch', [\App\Http\Controllers\Admin\AnalyticsController::class, 'batch']);
Route::post('/analytics/track', [\App\Http\Controllers\Admin\AnalyticsController::class, 'track']);
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
Route::get('/properties/locations', [PropertyMasterController::class, 'getLocations']); // Locations aggregation
Route::get('/properties/{id}', [PropertyMasterController::class, 'show']);
Route::get('/properties/{id}/images', [\App\Http\Controllers\PropertyImageController::class, 'getImages']);
Route::post('/bookings', [\App\Http\Controllers\BookingController::class, 'store']);
Route::get('/bookings/search', [\App\Http\Controllers\BookingController::class, 'search']);
Route::post('/bookings/{id}/cancel', [\App\Http\Controllers\BookingController::class, 'cancel']);
Route::get('/properties/{id}/booked-dates', [PropertyMasterController::class, 'getBookedDates']);
Route::post('/coupons/check', [\App\Http\Controllers\CouponController::class, 'check']);

// Event Tracking (Analytics)
Route::post('/analytics/track', [\App\Http\Controllers\Admin\AnalyticsController::class, 'track']);
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
    
    // Booking Details & Invoice
    Route::get('/customer/bookings', [\App\Http\Controllers\BookingController::class, 'index']);
    Route::get('/customer/bookings/{id}', [\App\Http\Controllers\BookingController::class, 'show']);
    Route::get('/customer/invoices/{id}/download', [\App\Http\Controllers\InvoiceController::class, 'download']);
    // Notifications
    Route::post('/notifications/token', [App\Http\Controllers\NotificationController::class, 'registerToken']);
    Route::post('/notifications/send', [App\Http\Controllers\NotificationController::class, 'send']);
    Route::get('/notifications/logs', [App\Http\Controllers\NotificationController::class, 'logs']);
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
Route::get('/debug-sdk', function () {
    $path = base_path('vendor/phonepe');
    if (!is_dir($path)) {
        return "Path not found: $path";
    }
    
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($path, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );
    
    $files = [];
    foreach ($iterator as $file) {
        $files[] = $file->getPathname();
    }
    return $files;
});
Route::match(['get', 'post'], '/payment/callback', [\App\Http\Controllers\PaymentController::class, 'callback'])
    ->withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class])
    ->name('payment.callback');

Route::get('/test-email-public', function (Illuminate\Http\Request $request) {
    $email = $request->query('email', 'himanshukhatri.1988@gmail.com');
    try {
        \Illuminate\Support\Facades\Mail::raw('This is a public test from ResortWala API. Time: ' . now(), function ($msg) use ($email) {
            $msg->to($email)
                ->subject('ResortWala Public Test Email');
        });
        return response()->json(['status' => 'success', 'message' => "Email sent to $email"]);
    } catch (\Exception $e) {
        return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
    }
});

/**
 * COMPREHENSIVE EMAIL TEST SUITE
 * Triggers all 4 main template types to the provided email.
 * Usage: /test-email-suite?email=your@email.com
 */
Route::get('/test-email-suite', function (Illuminate\Http\Request $request) {
    $email = $request->query('email');
    if (!$email) return response()->json(['error' => 'Please provide ?email=...'], 400);

    $results = [];

    // --- DUMMY DATA ---
    $vendor = new \App\Models\User(['name' => 'Test Vendor', 'email' => $email]);
    $client = new \App\Models\User(['name' => 'Test Client', 'email' => $email]);
    
    $property = new \App\Models\PropertyMaster();
    $property->Name = "Grand Resort Lonavala";
    $property->Location = "Lonavala";
    $property->vendor = $vendor;
    
    $booking = new \App\Models\Booking();
    $booking->BookingId = 1001;
    $booking->booking_reference = "TEST-REF-1001";
    $booking->CustomerName = "Test Client";
    $booking->CustomerEmail = $email;
    $booking->CheckInDate = now()->addDays(2);
    $booking->CheckOutDate = now()->addDays(4);
    $booking->Guests = 2;
    $booking->TotalAmount = 5000;
    $booking->Status = "Confirmed";
    $booking->property = $property;

    $coupon = (object)['code' => 'WELCOME50', 'amount' => 500];

    // --- HELPER ---
    $send = function($key, $mailable) use (&$results, $email) {
        try {
            \Illuminate\Support\Facades\Mail::to($email)->send($mailable);
            $results[$key] = 'Sent';
        } catch (\Exception $e) { $results[$key] = 'Error: ' . $e->getMessage(); }
    };

    // --- PHASES START ---

    // 1. AUTH / ONBOARDING
    $send('1_OtpMail', new \App\Mail\OtpMail('999999', 'login'));
    $send('2_VendorWelcome', new \App\Mail\UserOnboardingMail("New Vendor", "http://link", "vendor", "welcome"));
    $send('3_VendorApproved', new \App\Mail\UserOnboardingMail("New Vendor", "http://link", "vendor", "approved"));
    $send('4_VendorRejected', new \App\Mail\UserOnboardingMail("New Vendor", "http://link", "vendor", "rejected"));
    $send('5_ClientWelcome', new \App\Mail\ClientWelcomeMail($client));

    // 2. PROPERTY LIFECYCLE
    $send('6_PropertyAdded', new \App\Mail\PropertyAddedMail($property, $vendor));
    $send('7_PropertyApproved', new \App\Mail\PropertyActionMail($property, 'approved'));
    $send('8_PropertyRejected', new \App\Mail\PropertyActionMail($property, 'rejected')); // Rejection reason optional in template?
    $send('9_PropertyDeleted', new \App\Mail\PropertyActionMail($property, 'deleted'));

    // 3. PROPERTY EDITS
    $send('10_EditSubmitted', new \App\Mail\PropertyEditMail($property, 'submitted'));
    $send('11_EditApproved', new \App\Mail\PropertyEditMail($property, 'approved'));
    $send('12_EditRejected', new \App\Mail\PropertyEditMail($property, 'rejected'));

    // 4. CALENDAR
    $send('13_PriceUpdate', new \App\Mail\CalendarUpdateMail($property, 'price_update', now(), now(), 5000));
    $send('14_DateFreeze', new \App\Mail\CalendarUpdateMail($property, 'freeze', now(), now()));
    
    // 5. MANUAL BOOKING / REQUESTS
    $send('15_ClientRequest', new \App\Mail\ManualBookingMail($booking, 'client_request'));
    $send('16_VendorApprove', new \App\Mail\ManualBookingMail($booking, 'vendor_approve'));
    $send('17_VendorReject', new \App\Mail\ManualBookingMail($booking, 'vendor_reject'));

    // 6. BOOKING FLOW (APP)
    $send('18_BookingNewAdmin', new \App\Mail\BookingMail($booking, 'new_request_admin')); // Admin Alert
    $send('19_BookingNewVendor', new \App\Mail\BookingMail($booking, 'new_request_vendor')); // Vendor Alert
    $send('20_BookingConfirmedClient', new \App\Mail\BookingMail($booking, 'confirmed_customer')); // Customer Receipt
    $send('21_StayReminder', new \App\Mail\StayReminderMail($booking));
    $send('22_Cancellation', new \App\Mail\BookingCancellationMail($booking));

    // 7. COUPONS & REFUNDS
    $send('23_CouponPurchased', new \App\Mail\CouponPurchasedMail($coupon, $client));
    $send('24_RefundInitiated', new \App\Mail\RefundInitiatedMail($booking));
    $send('25_RefundCompleted', new \App\Mail\RefundCompletedMail($booking));

    // 8. WHATSAPP (Simulation)
    try {
        $wa = new \App\Services\WhatsApp\WhatsAppService();
        $wa->send(\App\Services\WhatsApp\WhatsAppMessage::template('919876543210', 'test_full_suite', ['param' => 'check_logs']));
        $results['26_WhatsApp_Sim'] = 'Logged';
    } catch (\Exception $e) { $results['26_WhatsApp_Sim'] = $e->getMessage(); }

    return response()->json([
        'status' => 'Completed Full Suite',
        'target_email' => $email,
        'results' => $results,
        'total_sent' => count($results)
    ]);
});

Route::post('/payment/simulate', [\App\Http\Controllers\PaymentSimulationController::class, 'simulate']);


// Admin Intelligence
Route::prefix('admin/intelligence')->middleware(['auth:sanctum', 'verified'])->group(function () {
    Route::get('/schema', [App\Http\Controllers\Admin\AdminIntelligenceController::class, 'getSchema']);
    Route::get('/data/{table}', [App\Http\Controllers\Admin\AdminIntelligenceController::class, 'getTableData']);
    Route::put('/data/{table}/{id}', [App\Http\Controllers\Admin\AdminIntelligenceController::class, 'updateTableData']);
    Route::delete('/data/{table}/{id}', [App\Http\Controllers\Admin\AdminIntelligenceController::class, 'deleteTableData']);
    
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
    Route::get('/admin/stats/sidebar', [\App\Http\Controllers\AdminController::class, 'getSidebarStats']);
    Route::get('/admin/search', [\App\Http\Controllers\AdminController::class, 'globalSearch']);
    Route::get('/admin/vendors', [\App\Http\Controllers\AdminController::class, 'getAllVendors']);
    Route::get('/admin/vendors/pending', [\App\Http\Controllers\AdminController::class, 'getPendingVendors']);
    Route::get('/admin/vendors/{id}', [\App\Http\Controllers\AdminController::class, 'getVendor']);
    Route::post('/admin/vendors/{id}/approve', [\App\Http\Controllers\AdminController::class, 'approveVendor']);
    Route::delete('/admin/vendors/{id}/reject', [\App\Http\Controllers\AdminController::class, 'rejectVendor']);
    
    // Admin Property Management
    Route::get('/admin/bulk-upload/template', [\App\Http\Controllers\Admin\BulkUploadController::class, 'downloadTemplate']);
    Route::prefix('admin/bulk-upload')->group(function () {
        Route::post('init', [\App\Http\Controllers\Admin\BulkUploadController::class, 'initUpload']);
        Route::get('{id}', [\App\Http\Controllers\Admin\BulkUploadController::class, 'show']);
        Route::get('{id}/entries', [\App\Http\Controllers\Admin\BulkUploadController::class, 'entries']);
        Route::post('{id}/import', [\App\Http\Controllers\Admin\BulkUploadController::class, 'import']);
    });
    Route::post('/admin/properties', [\App\Http\Controllers\AdminPropertyController::class, 'store']);
    Route::get('/admin/properties', [\App\Http\Controllers\AdminController::class, 'getAllProperties']);
    Route::get('/admin/properties/pending', [\App\Http\Controllers\AdminController::class, 'getPendingProperties']);
    Route::get('/admin/properties/{id}/calendar', [\App\Http\Controllers\AdminPropertyController::class, 'getCalendar']);
    
    // Analytics routes (Admin)
    Route::prefix('admin/analytics')->group(function () {
        Route::get('/dashboard', [\App\Http\Controllers\Admin\AnalyticsController::class, 'dashboard']);
        Route::get('/events', [\App\Http\Controllers\Admin\AnalyticsController::class, 'getEventLogs']);
        Route::get('/stats', [\App\Http\Controllers\Admin\AnalyticsController::class, 'getEventStats']);
        Route::get('/filters', [\App\Http\Controllers\Admin\AnalyticsController::class, 'getEventFilters']);
    });
    
    // Vendor CRM routes
    Route::prefix('admin/crm')->group(function () {
        Route::get('/leads', [\App\Http\Controllers\Admin\VendorCrmController::class, 'index']);
        Route::post('/leads', [\App\Http\Controllers\Admin\VendorCrmController::class, 'store']);
        Route::get('/leads/{id}', [\App\Http\Controllers\Admin\VendorCrmController::class, 'show']);
        Route::put('/leads/{id}', [\App\Http\Controllers\Admin\VendorCrmController::class, 'update']);
        Route::delete('/leads/{id}', [\App\Http\Controllers\Admin\VendorCrmController::class, 'destroy']);
        Route::post('/leads/{id}/interactions', [\App\Http\Controllers\Admin\VendorCrmController::class, 'logInteraction']);
        Route::get('/stats', [\App\Http\Controllers\Admin\VendorCrmController::class, 'stats']);
        Route::get('/agents', [\App\Http\Controllers\Admin\VendorCrmController::class, 'getAgents']);
        Route::get('/funnel', [\App\Http\Controllers\Admin\VendorCrmController::class, 'funnel']);
        Route::get('/export', [\App\Http\Controllers\Admin\VendorCrmController::class, 'export']);
    });

    // Admin Finance & Reconciliation (Phase 7)
    Route::prefix('admin/finance')->group(function () {
        Route::get('/transactions', [\App\Http\Controllers\Admin\FinanceController::class, 'index']);
        Route::get('/stats', [\App\Http\Controllers\Admin\FinanceController::class, 'stats']);
    });

    // Admin Coupon Management
    Route::prefix('admin/coupons')->group(function () {
        Route::get('/', [\App\Http\Controllers\Admin\CouponManagementController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Admin\CouponManagementController::class, 'store']);
        Route::put('/{id}', [\App\Http\Controllers\Admin\CouponManagementController::class, 'update']);
        Route::delete('/{id}', [\App\Http\Controllers\Admin\CouponManagementController::class, 'destroy']);
    });

    // Admin Reconciliation (Phase 9)
    Route::prefix('admin/finance/reconciliation')->group(function () {
        Route::get('/', [\App\Http\Controllers\Admin\ReconciliationController::class, 'index']);
        Route::post('/upload', [\App\Http\Controllers\Admin\ReconciliationController::class, 'upload']);
        Route::get('/{id}', [\App\Http\Controllers\Admin\ReconciliationController::class, 'show']);
        Route::post('/link', [\App\Http\Controllers\Admin\ReconciliationController::class, 'linkRecord']);
        Route::put('/record/{id}', [\App\Http\Controllers\Admin\ReconciliationController::class, 'updateRecordStatus']);
    });

    // Admin Revenue (Phase 10)
    Route::prefix('admin/revenue')->group(function () {
        Route::get('/', [\App\Http\Controllers\Admin\RevenueController::class, 'index']);
        Route::get('/properties', [\App\Http\Controllers\Admin\RevenueController::class, 'properties']);
        Route::put('/properties/{id}/rates', [\App\Http\Controllers\Admin\RevenueController::class, 'updateRates']);
        Route::get('/analytics', [\App\Http\Controllers\Admin\RevenueController::class, 'analytics']);
    });

    Route::put('/admin/properties/{id}/approve', [\App\Http\Controllers\AdminPropertyController::class, 'approve']);
    Route::put('/admin/properties/{id}/pricing', [\App\Http\Controllers\AdminPropertyController::class, 'updatePricing']);
    Route::get('/admin/properties/{id}', [\App\Http\Controllers\AdminPropertyController::class, 'show']);
    Route::post('/admin/properties/{id}/photos', [\App\Http\Controllers\AdminPropertyController::class, 'addPhotos']);
    Route::delete('/admin/properties/{id}/reject', [\App\Http\Controllers\AdminController::class, 'rejectProperty']);
    
    // Change Requests
    Route::post('/admin/properties/import', [\App\Http\Controllers\Admin\ImportController::class, 'import']);
    Route::get('/admin/property-changes', [\App\Http\Controllers\AdminPropertyController::class, 'getChangeRequests']);
    Route::get('/admin/property-changes/{id}', [\App\Http\Controllers\AdminPropertyController::class, 'getChangeRequest']);

    // Admin Calendar Routes (Added for parity with Vendor)
    Route::get('/admin/bookings', [\App\Http\Controllers\AdminController::class, 'getAllBookings']);
    Route::post('/admin/bookings/lock', [\App\Http\Controllers\AdminController::class, 'lockDates']); 
    Route::post('/admin/bookings/{id}/approve', [\App\Http\Controllers\AdminController::class, 'approveBooking']); 
    Route::post('/admin/bookings/{id}/reject', [\App\Http\Controllers\AdminController::class, 'rejectBooking']); 
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
    
    // Admin Communications
    Route::prefix('admin/communications')->group(function () {
        Route::get('/logs', [\App\Http\Controllers\Admin\CommunicationController::class, 'index']);
        Route::post('/broadcast', [\App\Http\Controllers\Admin\CommunicationController::class, 'broadcast']);
    });

    // Admin Settings
    Route::prefix('admin/settings')->group(function () {
        Route::get('/', [\App\Http\Controllers\Admin\SettingsController::class, 'index']);
        Route::post('/update', [\App\Http\Controllers\Admin\SettingsController::class, 'update']);
    });

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

    // Admin Intelligence Interface (Removed duplicate block - already defined above)
    // See lines 328-339 using AdminIntelligenceController

    // Admin Communication Logs (Phase 5)
    Route::prefix('admin/communications')->group(function () {
        Route::get('/logs', [\App\Http\Controllers\Admin\CommunicationController::class, 'index']);
        Route::get('/stats', [\App\Http\Controllers\Admin\CommunicationController::class, 'stats']);
    });

    // Revenue Control (Admin Only)
    Route::prefix('admin/revenue')->group(function () {
        Route::get('/properties', [\App\Http\Controllers\Admin\RevenueController::class, 'index']);
        Route::put('/properties/{id}/rates', [\App\Http\Controllers\Admin\RevenueController::class, 'updateRates']);
        
        // Add-ons
        Route::get('/properties/{id}/addons', [\App\Http\Controllers\Admin\RevenueController::class, 'getAddons']);
        Route::post('/properties/{id}/addons', [\App\Http\Controllers\Admin\RevenueController::class, 'storeAddon']);
        Route::delete('/properties/{id}/addons/{addonId}', [\App\Http\Controllers\Admin\RevenueController::class, 'deleteAddon']);
    });

    // Admin Connector Management
    Route::prefix('admin/connectors')->group(function () {
        Route::get('/', [\App\Http\Controllers\Admin\ConnectorController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Admin\ConnectorController::class, 'store']);
        Route::put('/{id}', [\App\Http\Controllers\Admin\ConnectorController::class, 'update']);
        Route::put('/{id}/status', [\App\Http\Controllers\Admin\ConnectorController::class, 'toggleStatus']);
    });

    // Connector Property Assignment
    Route::post('/admin/properties/{id}/connector', [\App\Http\Controllers\Admin\ConnectorController::class, 'assignToProperty']);
    Route::get('/admin/properties/{id}/connectors', [\App\Http\Controllers\Admin\ConnectorController::class, 'getPropertyConnectors']);

    // Internal DevOps Control (Developer Only)
    // NOTE: Restricted to Super Admin / Dev roles in middleware/controller
    Route::prefix('internal/db-control')->group(function () {
        Route::get('/backups', [\App\Http\Controllers\Internal\DbControlController::class, 'index']);
        Route::post('/backups', [\App\Http\Controllers\Internal\DbControlController::class, 'triggerBackup']);
        Route::get('/backups/{id}/download', [\App\Http\Controllers\Internal\DbControlController::class, 'download']);
        Route::post('/backups/{id}/restore', [\App\Http\Controllers\Internal\DbControlController::class, 'restore']);
        Route::get('/audit-logs', [\App\Http\Controllers\Internal\DbControlController::class, 'auditLogs']);
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
