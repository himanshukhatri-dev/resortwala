<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. learning_videos
        Schema::create('learning_videos', function (Blueprint $table) {
            $table->id();

            // Video Info
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('video_url', 512);
            $table->string('thumbnail_url', 512)->nullable();
            $table->integer('duration_seconds');

            // Categorization
            $table->enum('category', [
                'getting_started',
                'listing_pricing',
                'availability_bookings',
                'payments_payouts',
                'offers_promotions',
                'support_best_practices'
            ]);
            $table->enum('difficulty_level', ['beginner', 'intermediate', 'advanced'])->default('beginner');
            $table->string('subcategory', 100)->nullable();
            $table->json('tags')->nullable()->comment('Search tags');

            // Ordering & Display
            $table->integer('display_order')->default(0);
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_required')->default(false)->comment('Required for onboarding');

            // Content
            $table->text('transcript')->nullable()->comment('For AI search and accessibility');
            $table->json('key_points')->nullable()->comment('Bullet points of main takeaways');
            $table->json('related_features')->nullable()->comment('Panel features covered');

            // Metadata
            $table->integer('view_count')->default(0);
            $table->integer('completion_count')->default(0);
            $table->decimal('avg_rating', 3, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['category', 'display_order']);
            $table->index(['is_featured', 'display_order']);
            $table->index('is_active');
            // Fulltext index support varies by DB, adding raw statement if needed or relying on simple index for now
        });

        // 2. vendor_learning_progress
        Schema::create('vendor_learning_progress', function (Blueprint $table) {
            $table->id();

            // Reference
            $table->unsignedBigInteger('vendor_id');
            $table->unsignedBigInteger('video_id');

            // Progress
            $table->enum('status', ['not_started', 'in_progress', 'completed', 'skipped'])->default('not_started');
            $table->integer('watch_duration_seconds')->default(0);
            $table->integer('completion_percentage')->default(0);

            // Engagement
            $table->boolean('is_helpful')->nullable()->comment('Vendor feedback');
            $table->integer('rating')->nullable()->comment('1-5 stars');
            $table->text('feedback')->nullable();

            // Timestamps
            $table->timestamp('first_viewed_at')->nullable();
            $table->timestamp('last_viewed_at')->nullable();
            $table->timestamp('completed_at')->nullable();

            $table->timestamps();

            $table->unique(['vendor_id', 'video_id']);
            $table->index(['vendor_id', 'status']);
            $table->index(['video_id', 'status']);

            // Assuming 'users' table is the vendors table based on previous migrations
            $table->foreign('vendor_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('video_id')->references('id')->on('learning_videos')->onDelete('cascade');
        });

        // 3. page_walkthroughs
        Schema::create('page_walkthroughs', function (Blueprint $table) {
            $table->id();

            // Page Info
            $table->string('page_route')->unique()->comment('e.g., /vendor/properties');
            $table->string('title');
            $table->string('page_name');
            $table->text('description')->nullable();

            // Walkthrough Steps
            $table->json('steps')->comment('Array of walkthrough steps');

            // Triggers
            $table->boolean('trigger_on_first_visit')->default(true);
            $table->string('trigger_on_feature_flag', 100)->nullable();
            $table->json('trigger_condition')->nullable()->comment('Custom trigger conditions');

            // Display
            $table->boolean('is_active')->default(true);
            $table->integer('priority')->default(0);

            $table->timestamps();

            $table->index('is_active');
        });

        // 4. vendor_walkthrough_progress
        Schema::create('vendor_walkthrough_progress', function (Blueprint $table) {
            $table->id();

            // Reference
            $table->unsignedBigInteger('vendor_id');
            $table->unsignedBigInteger('walkthrough_id');
            $table->string('page_route');

            // Progress
            $table->enum('status', ['not_started', 'in_progress', 'completed', 'skipped', 'dismissed'])->default('not_started');
            $table->integer('current_step')->default(0);
            $table->integer('total_steps');

            // Timestamps
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('last_interaction_at')->nullable();

            $table->timestamps();

            $table->unique(['vendor_id', 'walkthrough_id']);
            $table->index(['vendor_id', 'status']);
            $table->index('page_route');

            $table->foreign('vendor_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('walkthrough_id')->references('id')->on('page_walkthroughs')->onDelete('cascade');
        });

        // 5. vendor_onboarding_milestones
        Schema::create('vendor_onboarding_milestones', function (Blueprint $table) {
            $table->id();

            // Reference
            $table->unsignedBigInteger('vendor_id')->unique();

            // Milestones
            $table->boolean('profile_completed')->default(false);
            $table->timestamp('profile_completed_at')->nullable();

            $table->boolean('property_added')->default(false);
            $table->timestamp('property_added_at')->nullable();

            $table->boolean('pricing_set')->default(false);
            $table->timestamp('pricing_set_at')->nullable();

            $table->boolean('availability_updated')->default(false);
            $table->timestamp('availability_updated_at')->nullable();

            $table->boolean('photos_uploaded')->default(false);
            $table->timestamp('photos_uploaded_at')->nullable();

            $table->boolean('property_published')->default(false);
            $table->timestamp('property_published_at')->nullable();

            $table->boolean('first_booking_received')->default(false);
            $table->timestamp('first_booking_received_at')->nullable();

            $table->boolean('payout_setup')->default(false);
            $table->timestamp('payout_setup_at')->nullable();

            // Overall Progress
            $table->integer('completion_percentage')->default(0);
            $table->boolean('onboarding_completed')->default(false);
            $table->timestamp('onboarding_completed_at')->nullable();

            $table->timestamps();

            $table->index('completion_percentage');
            $table->index('onboarding_completed');

            $table->foreign('vendor_id')->references('id')->on('users')->onDelete('cascade');
        });

        // 6. contextual_help_content
        Schema::create('contextual_help_content', function (Blueprint $table) {
            $table->id();

            // Target
            $table->string('element_id')->comment('CSS selector or element ID');
            $table->string('page_route');

            // Content
            $table->string('title');
            $table->text('content');
            $table->enum('help_type', ['tooltip', 'popover', 'modal'])->default('tooltip');

            // Display
            $table->enum('position', ['top', 'bottom', 'left', 'right', 'auto'])->default('auto');
            $table->enum('trigger', ['hover', 'click', 'focus'])->default('hover');
            $table->enum('icon_type', ['question', 'info', 'lightbulb'])->default('question');

            // Links
            $table->unsignedBigInteger('related_video_id')->nullable();
            $table->unsignedBigInteger('related_walkthrough_id')->nullable();
            $table->string('external_link', 512)->nullable();

            // Metadata
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['element_id', 'page_route']);
            $table->index('page_route');
            $table->index('is_active');

            $table->foreign('related_video_id')->references('id')->on('learning_videos')->onDelete('set null');
            $table->foreign('related_walkthrough_id')->references('id')->on('page_walkthroughs')->onDelete('set null');
        });

        // 7. ai_chat_conversations
        Schema::create('ai_chat_conversations', function (Blueprint $table) {
            $table->id();

            // Reference
            $table->unsignedBigInteger('vendor_id');
            $table->string('session_id');

            // Conversation
            $table->json('messages')->comment('Array of messages with role and content');

            // Context
            $table->string('current_page')->nullable();
            $table->json('vendor_context')->nullable()->comment('Vendor state, onboarding progress, etc.');

            // Status
            $table->enum('status', ['active', 'resolved', 'escalated'])->default('active');
            $table->enum('resolution_type', ['self_service', 'video_helped', 'walkthrough_helped', 'escalated', 'unresolved'])->nullable();

            // Feedback
            $table->boolean('was_helpful')->nullable();
            $table->integer('rating')->nullable()->comment('1-5 stars');
            $table->text('feedback')->nullable();

            // Timestamps
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('last_message_at')->useCurrent();
            $table->timestamp('resolved_at')->nullable();

            $table->timestamps();

            $table->index(['vendor_id', 'started_at']);
            $table->index('session_id');
            $table->index('status');

            $table->foreign('vendor_id')->references('id')->on('users')->onDelete('cascade');
        });

        // 8. help_interaction_analytics
        Schema::create('help_interaction_analytics', function (Blueprint $table) {
            $table->id();

            // Reference
            $table->unsignedBigInteger('vendor_id');

            // Interaction
            $table->enum('interaction_type', ['video_view', 'walkthrough_start', 'walkthrough_complete', 'tooltip_view', 'ai_chat', 'help_search']);
            $table->enum('resource_type', ['video', 'walkthrough', 'tooltip', 'chat', 'search']);
            $table->unsignedBigInteger('resource_id')->nullable();

            // Context
            $table->string('page_route')->nullable();
            $table->enum('trigger_source', ['manual', 'auto', 'suggestion'])->default('manual');

            // Outcome
            $table->boolean('was_helpful')->nullable();
            $table->boolean('led_to_action')->default(false)->comment('Did vendor complete the action after help?');
            $table->string('action_completed')->nullable();

            // Metadata
            $table->string('session_id')->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['vendor_id', 'created_at']);
            $table->index(['interaction_type', 'created_at']);
            $table->index(['resource_type', 'resource_id']);
            $table->index('page_route');

            $table->foreign('vendor_id')->references('id')->on('users')->onDelete('cascade');
        });

        // 9. smart_trigger_rules
        Schema::create('smart_trigger_rules', function (Blueprint $table) {
            $table->id();

            // Rule Info
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('trigger_type', ['hesitation', 'error', 'skip', 'time_based', 'action_based']);

            // Conditions
            $table->string('page_route')->nullable();
            $table->json('conditions')->comment('Trigger conditions');

            // Action
            $table->enum('action_type', ['show_tooltip', 'show_walkthrough', 'show_video', 'show_chat', 'show_notification']);
            $table->json('action_config')->comment('What to show/do');

            // Limits
            $table->integer('max_triggers_per_vendor')->default(1);
            $table->integer('cooldown_hours')->default(24);

            // Status
            $table->boolean('is_active')->default(true);
            $table->integer('priority')->default(0);

            $table->timestamps();

            $table->index('trigger_type');
            $table->index('page_route');
            $table->index(['is_active', 'priority']);
        });

        // 10. vendor_trigger_history
        Schema::create('vendor_trigger_history', function (Blueprint $table) {
            $table->id();

            // Reference
            $table->unsignedBigInteger('vendor_id');
            $table->unsignedBigInteger('trigger_rule_id');

            // Trigger Event
            $table->timestamp('triggered_at')->useCurrent();
            $table->string('page_route')->nullable();
            $table->text('trigger_reason')->nullable();

            // Vendor Response
            $table->enum('vendor_action', ['accepted', 'dismissed', 'ignored', 'completed'])->nullable();
            $table->timestamp('action_taken_at')->nullable();

            // Metadata
            $table->string('session_id')->nullable();

            $table->index(['vendor_id', 'triggered_at']);
            $table->index('trigger_rule_id');

            $table->foreign('vendor_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('trigger_rule_id')->references('id')->on('smart_trigger_rules')->onDelete('cascade');
        });

        // Add Fulltext indexes (DBW specific)
        DB::statement('ALTER TABLE learning_videos ADD FULLTEXT idx_search (title, description, transcript)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vendor_trigger_history');
        Schema::dropIfExists('smart_trigger_rules');
        Schema::dropIfExists('help_interaction_analytics');
        Schema::dropIfExists('ai_chat_conversations');
        Schema::dropIfExists('contextual_help_content');
        Schema::dropIfExists('vendor_onboarding_milestones');
        Schema::dropIfExists('vendor_walkthrough_progress');
        Schema::dropIfExists('page_walkthroughs');
        Schema::dropIfExists('vendor_learning_progress');
        Schema::dropIfExists('learning_videos');
    }
};
