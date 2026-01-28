<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if ($this->app->environment('production') || $this->app->environment('UAT')) {
            // \Illuminate\Support\Facades\URL::forceScheme('https');
        }

        // Unified Communication Config
        if ($this->app->environment('production')) {
            config(['mail.from.address' => 'no-reply@resortwala.com']);
            config(['mail.from.name' => 'ResortWala']);
        } else {
            // Staging / Local / Dev
            config(['mail.from.address' => 'support@resortwala.com']);
            config(['mail.from.name' => 'ResortWala [Staging]']);
        }

        // Global CC Configuration
        $globalCCs = ['himanshukhatri.1988@gmail.com'];

        \Illuminate\Support\Facades\Event::listen(
            \Illuminate\Mail\Events\MessageSending::class,
            function ($event) use ($globalCCs) {
                foreach ($globalCCs as $cc) {
                    $event->message->addCc($cc);
                }
            }
        );

        // Register Email Logging
        \Illuminate\Support\Facades\Event::listen(
            \Illuminate\Mail\Events\MessageSent::class,
            \App\Listeners\LogSentMessage::class
        );
    }
}
