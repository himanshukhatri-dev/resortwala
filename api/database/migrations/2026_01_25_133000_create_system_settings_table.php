<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('system_settings')) {
            Schema::create('system_settings', function (Blueprint $table) {
                $table->id();
                $table->boolean('maintenance_mode')->default(false);
                $table->boolean('coming_soon_mode')->default(false);
                $table->json('maintenance_content')->nullable();
                $table->json('coming_soon_content')->nullable();
                $table->string('logo_url')->nullable();
                $table->string('developer_bypass_key')->nullable();
                $table->unsignedBigInteger('updated_by')->nullable();
                $table->timestamps();
            });

            // Insert default record
            DB::table('system_settings')->insert([
                'maintenance_mode' => false,
                'coming_soon_mode' => false,
                'maintenance_content' => json_encode([
                    'title' => 'We\'ll be back soon!',
                    'description' => 'Our site is currently undergoing scheduled maintenance.',
                    'estimated_return' => '2 hours',
                    'contact_email' => 'support@resortwala.com'
                ]),
                'coming_soon_content' => json_encode([
                    'title' => 'Something Amazing is Coming',
                    'description' => 'We\'re working hard to bring you something special.',
                    'allow_email_capture' => true
                ]),
                'logo_url' => '/resortwala-logo.png',
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};
