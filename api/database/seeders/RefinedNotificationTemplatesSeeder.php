<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\NotificationTemplate;
use App\Models\NotificationTrigger;

class RefinedNotificationTemplatesSeeder extends Seeder
{
    public function run()
    {
        $templates = [
            // PHASE 3: AUTH & ONBOARDING
            'auth.welcome' => [
                'subject' => 'Welcome to ResortWala! 🌴',
                'content' => '<p>Dear {{name}},</p><p>Welcome to ResortWala! You have successfully signed up. We are excited to have you onboard.</p>'
            ],
            // BOOKING LIFECYCLE
            'booking.initiated' => [
                'subject' => 'Booking Initiated: {{booking_id}}',
                'content' => '<p>Dear Customer,</p><p>You have initiated a booking for {{property_name}}. Please complete the payment to confirm.</p>'
            ],
            'booking.cancelled' => [
                'subject' => 'Booking Cancelled: {{booking_id}}',
                'content' => '<p>Your booking for {{property_name}} has been cancelled.</p>'
            ],
            'booking.completed' => [
                'subject' => 'How was your stay at {{property_name}}?',
                'content' => '<p>We hope you had a great time! Please leave a review to help others.</p>'
            ],
            'payment.success' => [
                'subject' => 'Payment Successful - Booking {{booking_id}}',
                'content' => '<p>We have received your payment of Rs. {{amount}}. Your booking is now CONFIRMED.</p>'
            ],
            'payment.failed' => [
                'subject' => 'Payment Failed - Booking {{booking_id}}',
                'content' => '<p>Unfortunately, your payment of Rs. {{amount}} could not be processed. Please try again.</p>'
            ],
            'payment.refund_initiated' => [
                'subject' => 'Refund Initiated for Booking {{booking_id}}',
                'content' => '<p>We have initiated a refund of Rs. {{amount}}. It should reflect in your account within 5-7 days.</p>'
            ],
            // VENDOR LIFECYCLE
            'vendor.payout_processed' => [
                'subject' => 'Payout Processed: Rs. {{amount}}',
                'content' => '<p>Dear Partner,</p><p>We have processed a payout of Rs. {{amount}} to your registered bank account.</p>'
            ],
            'property.live' => [
                'subject' => 'Good News! {{property_name}} is now LIVE',
                'content' => '<p>Your property is now visible to thousands of customers. Get ready for bookings!</p>'
            ]
        ];

        foreach ($templates as $key => $data) {
            // Create Template
            $template = NotificationTemplate::updateOrCreate(
                ['name' => $key . '_email'],
                [
                    'subject' => $data['subject'],
                    'content' => $data['content'],
                    'is_active' => true,
                    'channel' => 'email'
                ]
            );

            // Ensure Trigger Mapping
            NotificationTrigger::updateOrCreate(
                ['event_name' => $key],
                [
                    'email_template_id' => $template->id,
                    'is_active' => true
                ]
            );
        }
    }
}
