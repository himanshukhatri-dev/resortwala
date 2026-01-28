<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\NotificationEngine;
use App\Services\NotificationService;

class NotificationServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->singleton(NotificationEngine::class, function ($app) {
            return new NotificationEngine();
        });

        $this->app->singleton(NotificationService::class, function ($app) {
            return new NotificationService($app->make(NotificationEngine::class));
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
