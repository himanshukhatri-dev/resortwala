<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddVerificationColumnsToUsers extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            // Email verification - only add if doesn't exist
            if (!Schema::hasColumn('users', 'email_verified_at')) {
                $table->timestamp('email_verified_at')->nullable()->after('email');
            }
            if (!Schema::hasColumn('users', 'email_verification_token')) {
                $table->string('email_verification_token', 10)->nullable()->after('email_verified_at');
            }
            
            // Phone verification - only add if doesn't exist
            if (!Schema::hasColumn('users', 'phone_verified_at')) {
                $table->timestamp('phone_verified_at')->nullable()->after('phone');
            }
            if (!Schema::hasColumn('users', 'phone_verification_token')) {
                $table->string('phone_verification_token', 10)->nullable()->after('phone_verified_at');
            }
        });
        
        // Add notes column to wishlists table
        if (Schema::hasTable('wishlists')) {
            Schema::table('wishlists', function (Blueprint $table) {
                if (!Schema::hasColumn('wishlists', 'notes')) {
                    $table->text('notes')->nullable()->after('property_id');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $columnsToDrop = [];
            
            if (Schema::hasColumn('users', 'email_verified_at')) {
                $columnsToDrop[] = 'email_verified_at';
            }
            if (Schema::hasColumn('users', 'email_verification_token')) {
                $columnsToDrop[] = 'email_verification_token';
            }
            if (Schema::hasColumn('users', 'phone_verified_at')) {
                $columnsToDrop[] = 'phone_verified_at';
            }
            if (Schema::hasColumn('users', 'phone_verification_token')) {
                $columnsToDrop[] = 'phone_verification_token';
            }
            
            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
        
        if (Schema::hasTable('wishlists')) {
            Schema::table('wishlists', function (Blueprint $table) {
                if (Schema::hasColumn('wishlists', 'notes')) {
                    $table->dropColumn('notes');
                }
            });
        }
    }
}
