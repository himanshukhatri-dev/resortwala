<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->string('coupon_code')->nullable()->after('SpecialRequest');
            $table->decimal('discount_amount', 10, 2)->default(0)->after('TotalAmount');
            $table->decimal('tax_amount', 10, 2)->default(0)->after('discount_amount');
            $table->decimal('base_amount', 10, 2)->nullable()->after('Guests');
            $table->string('payment_method')->default('hotel')->after('tax_amount'); // hotel, card, upi
            $table->string('payment_status')->default('pending')->after('payment_method'); // pending, paid, failed, refunded
            $table->string('razorpay_order_id')->nullable()->after('payment_status');
            $table->string('razorpay_payment_id')->nullable()->after('razorpay_order_id');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn([
                'coupon_code', 
                'discount_amount', 
                'tax_amount', 
                'base_amount', 
                'payment_method', 
                'payment_status',
                'razorpay_order_id',
                'razorpay_payment_id'
            ]);
        });
    }
};
