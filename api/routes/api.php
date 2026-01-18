<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PropertyMasterController;
use App\Http\Controllers\ForgotPasswordController;
use App\Http\Controllers\StatusController;

// EMERGENCY FIX: Manually load Controller if Autoloader is stale
if (file_exists(app_path('Http/Controllers/Admin/VoiceStudioController.php'))) {
    require_once app_path('Http/Controllers/Admin/VoiceStudioController.php');
}

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
// Route::post('/events/batch', [\App\Http\Controllers\EventController::class, 'batchTrack']); // Duplicate


// Customer Authentication Routes
// Public Availability (Shareable Links)
Route::get('/public/properties/{id}/calendar', [\App\Http\Controllers\PublicController::class, 'getPropertyCalendar']);
Route::get('/public/vendors/{id}/calendar', [\App\Http\Controllers\PublicController::class, 'getVendorMasterCalendar']);
Route::post('/public/bookings/request', [\App\Http\Controllers\PublicAvailabilityController::class, 'request']);
// Alternative path using unique top-level segment to avoid any properties resource conflicts
Route::post('/request-booking', [\App\Http\Controllers\PublicAvailabilityController::class, 'request']);

// Chatbot Public Routes
Route::get('/chatbot/config', [\App\Http\Controllers\ChatbotController::class, 'config']);
Route::post('/chatbot/track', [\App\Http\Controllers\ChatbotController::class, 'track']);
Route::post('/chatbot/query', [\App\Http\Controllers\ChatbotController::class, 'query']);
Route::post('/chatbot/submit', [\App\Http\Controllers\ChatbotController::class, 'submitQuery']);
Route::get('/chatbot/search', [\App\Http\Controllers\ChatbotController::class, 'searchProperties']);

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
    // Lead Intelligence
    Route::get('/intelligence/leads/export', [App\Http\Controllers\Admin\LeadCrawlerController::class, 'export']);
    Route::get('/intelligence/leads', [App\Http\Controllers\Admin\LeadCrawlerController::class, 'index']);
    Route::get('/intelligence/jobs', [App\Http\Controllers\Admin\LeadCrawlerController::class, 'jobs']);
    Route::post('/intelligence/trigger', [App\Http\Controllers\Admin\LeadCrawlerController::class, 'trigger']);
    Route::put('/intelligence/leads/{id}', [App\Http\Controllers\Admin\LeadCrawlerController::class, 'update']);
    Route::post('/intelligence/leads/{id}/convert', [App\Http\Controllers\Admin\LeadCrawlerController::class, 'convert']);

    // Notifications

    // Notifications
    Route::post('/notifications/token', [App\Http\Controllers\NotificationController::class, 'registerToken']);
    Route::post('/notifications/send', [App\Http\Controllers\NotificationController::class, 'send']);
    Route::get('/notifications/logs', [App\Http\Controllers\NotificationController::class, 'logs']);
    
    // In-App Notifications
    Route::get('/notifications', [App\Http\Controllers\NotificationController::class, 'myNotifications']);
    Route::post('/notifications/{id}/read', [App\Http\Controllers\NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [App\Http\Controllers\NotificationController::class, 'markAllRead']);
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

Route::match(['get', 'post'], '/payment/callback', [\App\Http\Controllers\PaymentController::class, 'callback'])
    ->withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class])
    ->name('payment.callback');



Route::post('/payment/simulate', [\App\Http\Controllers\PaymentSimulationController::class, 'simulate']);


// Admin Intelligence
Route::prefix('admin/intelligence')->middleware(['auth:sanctum', 'verified'])->group(function () {
    Route::get('/schema', [App\Http\Controllers\Admin\AdminIntelligenceController::class, 'getSchema']);
    Route::get('/data/{table}', [App\Http\Controllers\Admin\AdminIntelligenceController::class, 'getTableData']);
    Route::put('/data/{table}/{id}', [App\Http\Controllers\Admin\AdminIntelligenceController::class, 'updateTableData']);
    Route::delete('/data/{table}/{id}', [App\Http\Controllers\Admin\AdminIntelligenceController::class, 'deleteTableData']);
    
    // 🧾 Accounts Center
    Route::prefix('accounts')->group(function () {
        Route::get('/summary', [\App\Http\Controllers\Admin\AccountsController::class, 'summary']);
        Route::get('/', [\App\Http\Controllers\Admin\AccountsController::class, 'index']);
        Route::get('/{id}', [\App\Http\Controllers\Admin\AccountsController::class, 'show']);
        Route::post('/adjust', [\App\Http\Controllers\Admin\AccountsController::class, 'adjust']);
    });

    // Dashboard
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

    // Admin Media SRE (Restore & Watermark)
    // Admin Media SRE (Restore & Watermark)
    Route::prefix('admin/media')->group(function () {
        Route::get('/stats', [\App\Http\Controllers\Admin\MediaController::class, 'stats']);
        Route::get('/debug-tts', [\App\Http\Controllers\Admin\MediaController::class, 'debugTts']);
        Route::get('/compare/{id}', [\App\Http\Controllers\Admin\MediaController::class, 'compareImage']);
        Route::get('/backups', [\App\Http\Controllers\Admin\MediaController::class, 'index']);
        Route::delete('/backups', [\App\Http\Controllers\Admin\MediaController::class, 'purgeBackups']); // New Purge
        Route::post('/upload', [\App\Http\Controllers\Admin\MediaController::class, 'uploadMedia']); // New Upload
        Route::post('/restore-batch', [\App\Http\Controllers\Admin\MediaController::class, 'restoreBatch']); // New Batch Restore
        Route::post('/restore/{id}', [\App\Http\Controllers\Admin\MediaController::class, 'restore']);
        Route::post('/watermark-batch', [\App\Http\Controllers\Admin\MediaController::class, 'triggerWatermark']);
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
        Route::get('/connectors/reports/stats', [\App\Http\Controllers\Admin\ConnectorReportController::class, 'stats']);
        Route::get('/connectors/reports/earnings', [\App\Http\Controllers\Admin\ConnectorReportController::class, 'earnings']);
        Route::post('/connectors/payouts/process', [\App\Http\Controllers\Admin\ConnectorReportController::class, 'processPayout']);
        
        Route::get('/', [\App\Http\Controllers\Admin\ConnectorController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Admin\ConnectorController::class, 'store']);
        Route::put('/{id}', [\App\Http\Controllers\Admin\ConnectorController::class, 'update']);
        Route::put('/{id}/status', [\App\Http\Controllers\Admin\ConnectorController::class, 'toggleStatus']);
    });

    // Tutorial Studio Routes (Correctly Placed)
    Route::prefix('admin/tutorials')->group(function () {
        Route::get('/', [\App\Http\Controllers\Admin\TutorialStudioController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Admin\TutorialStudioController::class, 'store']);
        Route::get('/{id}', [\App\Http\Controllers\Admin\TutorialStudioController::class, 'show']);
        Route::put('/{id}', [\App\Http\Controllers\Admin\TutorialStudioController::class, 'update']);
        Route::delete('/{id}', [\App\Http\Controllers\Admin\TutorialStudioController::class, 'destroy']);
        Route::post('/{id}/media', [\App\Http\Controllers\Admin\TutorialStudioController::class, 'uploadMedia']);
        Route::post('/{id}/steps', [\App\Http\Controllers\Admin\TutorialStudioController::class, 'syncSteps']);
        Route::post('/{id}/render', [\App\Http\Controllers\Admin\TutorialStudioController::class, 'render']);
    });

    // Shared Inbox (New)
    Route::prefix('admin/shared-inbox')->group(function () {
        Route::get('/emails', [\App\Http\Controllers\Admin\SharedInboxController::class, 'index']);
        Route::get('/emails/{id}', [\App\Http\Controllers\Admin\SharedInboxController::class, 'show']);
        Route::put('/emails/{id}', [\App\Http\Controllers\Admin\SharedInboxController::class, 'update']);
        Route::post('/sync', [\App\Http\Controllers\Admin\SharedInboxController::class, 'sync']);
        Route::post('/send', [\App\Http\Controllers\Admin\SharedInboxController::class, 'send']);
        
        // Settings
        Route::get('/settings', [\App\Http\Controllers\Admin\SharedInboxController::class, 'getSettings']);
        Route::post('/settings', [\App\Http\Controllers\Admin\SharedInboxController::class, 'updateSettings']);
    });

    // Connector Property Assignment
    Route::post('/admin/properties/{id}/connector', [\App\Http\Controllers\Admin\ConnectorController::class, 'assignToProperty']);
    Route::get('/admin/properties/{id}/connectors', [\App\Http\Controllers\Admin\ConnectorController::class, 'getPropertyConnectors']);

    // Chatbot Public Routes


    // AI Video Generator
    Route::prefix('admin/video-generator')->group(function () {
        Route::get('/', [\App\Http\Controllers\Admin\VideoGeneratorController::class, 'index']);
        Route::post('/render', [\App\Http\Controllers\Admin\VideoGeneratorController::class, 'store']);
        Route::get('/jobs/{id}', [\App\Http\Controllers\Admin\VideoGeneratorController::class, 'show']);
        Route::post('/jobs/{id}/retry', [\App\Http\Controllers\Admin\VideoGeneratorController::class, 'retry']);
        // New SRE/AI Features
        Route::get('/voices', [\App\Http\Controllers\Admin\VideoGeneratorController::class, 'getVoices']);
        Route::post('/generate-script', [\App\Http\Controllers\Admin\VideoGeneratorController::class, 'generateScript']);
        Route::post('/prompt-generate', [\App\Http\Controllers\Admin\VideoGeneratorController::class, 'storePromptVideo']);
        Route::delete('/jobs/{id}', [\App\Http\Controllers\Admin\VideoGeneratorController::class, 'destroy']);
    });

    // AI Voice Studio
    Route::prefix('admin/voice-studio')->group(function () {
        Route::get('/config', [\App\Http\Controllers\Admin\VoiceStudioController::class, 'getConfig']);
        Route::post('/generate', [\App\Http\Controllers\Admin\VoiceStudioController::class, 'generateAudio']);
        // Video Generation
        Route::post('/create-video', [\App\Http\Controllers\Admin\VideoGeneratorController::class, 'store']);
        Route::get('/jobs/{id}', [\App\Http\Controllers\Admin\VideoGeneratorController::class, 'show']);
        
        // Video Jobs & Retry
        Route::get('/projects', [\App\Http\Controllers\Admin\VoiceStudioController::class, 'index']); // History
        Route::get('/video-jobs', [\App\Http\Controllers\Admin\VideoGeneratorController::class, 'index']); // Video History
        Route::post('/video-jobs/{id}/retry', [\App\Http\Controllers\Admin\VideoGeneratorController::class, 'retry']);
        Route::delete('/video-jobs/{id}', [\App\Http\Controllers\Admin\VideoGeneratorController::class, 'destroy']);
        Route::post('/projects/{id}/render', [\App\Http\Controllers\Admin\VoiceStudioController::class, 'renderVideo']); // Existing route, moved
        Route::get('/setup-db', [\App\Http\Controllers\Admin\VoiceStudioController::class, 'setupDB']); // Auto-Fix
        Route::get('/fix-storage', [\App\Http\Controllers\Admin\VoiceStudioController::class, 'fixStorage']); // Permission Fix (Existing route, moved)
    });

    // Admin Chatbot Management
    Route::prefix('admin/chatbot')->group(function () {
        Route::get('/faqs', [\App\Http\Controllers\AdminChatbotController::class, 'index']);
        Route::post('/faqs', [\App\Http\Controllers\AdminChatbotController::class, 'store']);
        Route::put('/faqs/{id}', [\App\Http\Controllers\AdminChatbotController::class, 'update']);
        Route::delete('/faqs/{id}', [\App\Http\Controllers\AdminChatbotController::class, 'destroy']);
        Route::get('/analytics', [\App\Http\Controllers\AdminChatbotController::class, 'analytics']);
        
        // Customer Queries
        Route::get('/queries', [\App\Http\Controllers\AdminCustomerQueryController::class, 'index']);
        Route::put('/queries/{id}', [\App\Http\Controllers\AdminCustomerQueryController::class, 'update']);
        Route::delete('/queries/{id}', [\App\Http\Controllers\AdminCustomerQueryController::class, 'destroy']);
    });

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
