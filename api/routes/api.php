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

Route::post('/forgot-password', [ForgotPasswordController::class, 'sendOtp']);
Route::post('/verify-otp', [ForgotPasswordController::class, 'verifyOtp']);
Route::post('/reset-password', [ForgotPasswordController::class, 'resetPassword']);

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
Route::get('/properties/{id}/booked-dates', [PropertyMasterController::class, 'getBookedDates']);
Route::post('/coupons/check', [\App\Http\Controllers\CouponController::class, 'check']);

// Customer Authentication Routes
Route::post('/customer/register', [\App\Http\Controllers\CustomerAuthController::class, 'register']);
Route::post('/customer/login', [\App\Http\Controllers\CustomerAuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/customer/profile', [\App\Http\Controllers\CustomerAuthController::class, 'profile']);
    Route::post('/customer/logout', [\App\Http\Controllers\CustomerAuthController::class, 'logout']);
});


// Vendor Authentication Routes
Route::post('/vendor/register', [\App\Http\Controllers\VendorController::class, 'register']);
Route::post('/vendor/login', [\App\Http\Controllers\VendorController::class, 'login']);

// Public Utility Routes
Route::get('/ping', function () {
    return response()->json(['status' => 'ok', 'message' => 'PHP is reachable']);
});

Route::get('/health', [StatusController::class, 'check']); // Alias for status

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/vendor/profile', [\App\Http\Controllers\VendorController::class, 'profile']);
    Route::put('/vendor/profile', [\App\Http\Controllers\VendorController::class, 'updateProfile']);
    Route::post('/vendor/logout', [\App\Http\Controllers\VendorController::class, 'logout']);
    Route::get('/vendor/stats', [\App\Http\Controllers\VendorController::class, 'getStats']);
    Route::get('/vendor/bookings', [\App\Http\Controllers\VendorController::class, 'getBookings']);
    
    Route::get('/holidays', [\App\Http\Controllers\HolidayController::class, 'index']);

    // Protected routes
    Route::post('/vendor/bookings/{id}/status', [\App\Http\Controllers\VendorController::class, 'updateBookingStatus']);
    Route::post('/vendor/bookings/freeze', [\App\Http\Controllers\VendorController::class, 'freezeDate']);
    Route::post('/holidays', [\App\Http\Controllers\HolidayController::class, 'store']);

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

    // Vendor Calendar & Automation
    Route::get('/vendor/properties/{id}/calendar', [App\Http\Controllers\VendorCalendarController::class, 'index']);
    Route::post('/vendor/bookings/lock', [App\Http\Controllers\VendorCalendarController::class, 'lock']);
    Route::post('/vendor/bookings/{id}/approve', [App\Http\Controllers\VendorCalendarController::class, 'approve']);
});

// Admin Authentication Routes
Route::post('/admin/login', [\App\Http\Controllers\AdminController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/admin/profile', [\App\Http\Controllers\AdminController::class, 'profile']);
    Route::post('/admin/logout', [\App\Http\Controllers\AdminController::class, 'logout']);
    Route::get('/admin/stats', [\App\Http\Controllers\AdminController::class, 'getStats']);
    Route::get('/admin/vendors', [\App\Http\Controllers\AdminController::class, 'getAllVendors']);
    Route::get('/admin/vendors/pending', [\App\Http\Controllers\AdminController::class, 'getPendingVendors']);
    Route::post('/admin/vendors/{id}/approve', [\App\Http\Controllers\AdminController::class, 'approveVendor']);
    Route::delete('/admin/vendors/{id}/reject', [\App\Http\Controllers\AdminController::class, 'rejectVendor']);
    
    // Admin Property Management
    Route::get('/admin/properties', [\App\Http\Controllers\AdminController::class, 'getAllProperties']);
    Route::get('/admin/properties/pending', [\App\Http\Controllers\AdminController::class, 'getPendingProperties']);
    Route::post('/admin/properties/{id}/approve', [\App\Http\Controllers\AdminController::class, 'approveProperty']);
    Route::delete('/admin/properties/{id}/reject', [\App\Http\Controllers\AdminController::class, 'rejectProperty']);
    
    // Admin Booking Management
    Route::get('/admin/bookings', [\App\Http\Controllers\AdminController::class, 'getAllBookings']);
    Route::post('/admin/bookings/{id}/status', [\App\Http\Controllers\AdminController::class, 'updateBookingStatus']);
    
    // User Management
    Route::get('/admin/users/admins', [\App\Http\Controllers\AdminUserController::class, 'getAdmins']);
    Route::post('/admin/users/admins', [\App\Http\Controllers\AdminUserController::class, 'createAdmin']);

    Route::get('/admin/users/vendors', [\App\Http\Controllers\AdminUserController::class, 'getVendors']);
    Route::post('/admin/users/vendors', [\App\Http\Controllers\AdminUserController::class, 'createVendor']);
    
    // Generic User Update (Admin & Vendor) & Delete
    Route::put('/admin/users/{id}', [\App\Http\Controllers\AdminUserController::class, 'updateUser']);
    Route::delete('/admin/users/{id}', [\App\Http\Controllers\AdminUserController::class, 'deleteUser']);

    Route::get('/admin/users/customers', [\App\Http\Controllers\AdminUserController::class, 'getCustomers']);
    Route::post('/admin/users/customers', [\App\Http\Controllers\AdminUserController::class, 'createCustomer']);
    Route::put('/admin/users/customers/{id}', [\App\Http\Controllers\AdminUserController::class, 'updateCustomer']);
    Route::delete('/admin/users/customers/{id}', [\App\Http\Controllers\AdminUserController::class, 'deleteCustomer']);
});

// Public Availability (Shareable Links)
Route::prefix('public')->group(function () {
    Route::get('properties/{uuid}/calendar', [App\Http\Controllers\PublicAvailabilityController::class, 'show']);
    Route::post('bookings/request', [App\Http\Controllers\PublicAvailabilityController::class, 'request']);
});

// ZERO-SHOT DEV ROUTE - REMOVE AFTER USE
Route::get('/dev/assign-vendors', function () {
    $vendors = \App\Models\User::where('role', 'vendor')->pluck('id');
    if ($vendors->isEmpty()) return response()->json(['error' => 'No vendors found'], 404);
    
    $properties = \App\Models\PropertyMaster::all();
    $count = 0;
    foreach ($properties as $prop) {
        $prop->VendorId = $vendors->random();
        $prop->save();
        $count++;
    }
    
    return response()->json([
        'message' => "Assigned random vendors to $count properties",
        'vendors' => $vendors
    ]);
});
