<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('purchased_coupons')) {
            Schema::create('purchased_coupons', function (Blueprint $table) {
                $table->id();
                $table->foreignId('booking_id')->constrained('bookings')->onDelete('cascade');
                $table->foreignId('customer_id')->constrained('users', 'id'); // Assuming customers are in users table (or customers table? check schema)
                // Checking BookingController: Booking has CustomerName etc. but Booking table migration?
                // Let's check BookingSeeder or Customers table. 
                // 2025_12_10_040000_create_customers_table.php exists.
                // But Booking has CustomerName (guest). 
                // Let's make customer_id nullable or generic user_id. 
                // Ideally links to User if logged in.
                $table->foreignId('user_id')->nullable()->constrained('users'); 
                
                $table->foreignId('vendor_id')->constrained('users'); // Vendors are Users
                $table->foreignId('property_id')->constrained('property_masters', 'PropertyId');
                
                $table->string('code')->unique(); // The redemption code
                $table->string('status')->default('ISSUED'); // ISSUED, REDEEMED, EXPIRED, CANCELLED
                $table->decimal('total_price', 10, 2);
                $table->date('valid_from');
                $table->date('valid_until');
                
                $table->timestamp('redeemed_at')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchased_coupons');
    }
};
