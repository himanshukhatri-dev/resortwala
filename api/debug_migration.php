<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "--- MANUAL MIGRATION DIAGNOSTIC ---\n";

try {
    echo "Creating learning_modules...\n";
    if (!Schema::hasTable('learning_modules')) {
        Schema::create('learning_modules', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('category')->default('onboarding');
            $table->string('difficulty')->default('beginner');
            $table->integer('duration_seconds')->default(0);
            $table->boolean('is_active')->default(true);
            $table->json('meta_tags')->nullable();
            $table->timestamps();
        });
        echo "Created learning_modules.\n";
    } else {
        echo "learning_modules already exists.\n";
    }

    echo "Creating learning_steps...\n";
    if (!Schema::hasTable('learning_steps')) {
        Schema::create('learning_steps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->constrained('learning_modules')->onDelete('cascade');
            $table->integer('step_order');
            $table->string('action_type', 50);
            $table->string('selector')->nullable();
            $table->string('path')->nullable();
            $table->json('payload')->nullable();
            $table->text('narration_text')->nullable();
            $table->string('audio_url')->nullable();
            $table->timestamps();
            $table->index(['module_id', 'step_order']);
        });
        echo "Created learning_steps.\n";
    } else {
        echo "learning_steps already exists.\n";
    }

    echo "Creating vendor_learning_progress...\n";
    if (!Schema::hasTable('vendor_learning_progress')) {
        Schema::create('vendor_learning_progress', function (Blueprint $table) {
            $table->id();
            // POTENTIAL FAILURE POINT: users table might not exist or be named 'vendors'
            $table->foreignId('vendor_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('module_id')->constrained('learning_modules')->onDelete('cascade');
            $table->string('status', 20)->default('started');
            $table->integer('current_step')->default(0);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->unique(['vendor_id', 'module_id']);
        });
        echo "Created vendor_learning_progress.\n";
    } else {
        echo "vendor_learning_progress already exists.\n";
    }

} catch (\Exception $e) {
    echo "\n[EXCEPTION] " . $e->getMessage() . "\n";
}
