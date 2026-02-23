<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\NotificationTemplate;
use App\Models\NotificationTrigger;

class BookingNotificationSeeder extends Seeder
{
    public function run()
    {
        // 1. Templates
        $templates = [
            [
                'name' => 'booking_payment_received_customer',
                'subject' => 'Payment Received – Booking Under Confirmation - {{property_name}}',
                'content' => 'We have received your payment for {{property_name}}. The resort will confirm the slot shortly.',
                'channel' => 'email',
                'is_active' => true
            ],
            [
                'name' => 'booking_confirmed_customer',
                'subject' => 'Booking Confirmed! - {{property_name}}',
                'content' => 'Your reservation for {{property_name}} is officially confirmed. Enjoy your stay!',
                'channel' => 'email',
                'is_active' => true
            ],
            [
                'name' => 'booking_confirmed_vendor',
                'subject' => 'Booking Lock Success - {{property_name}}',
                'content' => 'You have successfully locked the slot for {{customer_name}}.',
                'channel' => 'email',
                'is_active' => true
            ],
            [
                'name' => 'booking_rejected_customer',
                'subject' => 'Update on your Booking Request (Declined) - {{property_name}}',
                'content' => 'The resort was unable to confirm your booking. Reason: {{reason}}',
                'channel' => 'email',
                'is_active' => true
            ],
            // SMS Templates
            [
                'name' => 'booking_confirmed_customer_sms',
                'subject' => null,
                'content' => 'Congrats! Your stay at {{property_name}} for {{check_in}} is confirmed. Booking ID: {{booking_id}}. - ResortWala',
                'channel' => 'sms',
                'is_active' => true
            ],
            // WhatsApp Templates
            [
                'name' => 'booking_confirmed_customer_wa',
                'subject' => null,
                'content' => 'booking_confirmed_v1', // Template name in provider
                'channel' => 'whatsapp',
                'is_active' => true
            ],
        ];

        foreach ($templates as $tpl) {
            NotificationTemplate::updateOrCreate(['name' => $tpl['name']], $tpl);
        }

        // 2. Triggers
        $triggers = [
            'booking.payment_received_customer' => 'booking_payment_received_customer',
            'booking.confirmed_customer' => 'booking_confirmed_customer',
            'booking.confirmed_vendor' => 'booking_confirmed_vendor',
            'booking.rejected_customer' => 'booking_rejected_customer',
            'booking.new_request_vendor' => 'booking_new_request_vendor', // Ensure it exists
        ];

        foreach ($triggers as $evt => $tplName) {
            $emailTpl = NotificationTemplate::where('name', $tplName)->first();

            $smsTpl = null;
            $waTpl = null;

            if ($evt === 'booking.confirmed_customer') {
                $smsTpl = NotificationTemplate::where('name', 'booking_confirmed_customer_sms')->first();
                $waTpl = NotificationTemplate::where('name', 'booking_confirmed_customer_wa')->first();
            }

            if ($emailTpl) {
                NotificationTrigger::updateOrCreate(
                    ['event_name' => $evt],
                    [
                        'email_template_id' => $emailTpl->id,
                        'sms_template_id' => $smsTpl ? $smsTpl->id : null,
                        'whatsapp_template_id' => $waTpl ? $waTpl->id : null,
                        'audience' => str_contains($evt, 'vendor') ? 'vendor' : 'customer',
                        'is_active' => true
                    ]
                );
            }
        }
    }
}
