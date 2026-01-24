<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('property_masters', function (Blueprint $table) {
            $table->decimal('internal_rating', 3, 2)->default(0)->after('PropertyStatus');
            $table->integer('internal_review_count')->default(0)->after('internal_rating');
            $table->decimal('google_rating', 3, 2)->default(0)->after('internal_review_count');
            $table->integer('google_review_count')->default(0)->after('google_rating');
            $table->decimal('customer_avg_rating', 3, 2)->default(0)->after('google_review_count')->index();
        });
    }

    public function down()
    {
        Schema::table('property_masters', function (Blueprint $table) {
            $table->dropColumn([
                'internal_rating',
                'internal_review_count',
                'google_rating',
                'google_review_count',
                'customer_avg_rating'
            ]);
        });
    }
};
