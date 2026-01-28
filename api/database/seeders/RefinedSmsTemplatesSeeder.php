<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\NotificationTemplate;
use App\Models\NotificationTrigger;

class RefinedSmsTemplatesSeeder extends Seeder
{
    public function run()
    {
        // DLT Ready Templates (Using {{var}} for system, will be {#var#} for DLT registry)
        $smsTemplates = [
            'auth.welcome' => "Welcome to ResortWala! Your account has been successfully created. Explore now. - ResortWala",

            'booking.initiated' => "Dear Customer, your booking {{booking_id}} at {{property_name}} is initiated. Please complete payment. - ResortWala",
            'booking.confirmed_customer' => "Booking Confirmed! ID: {{booking_id}} for {{property_name}}. Check app for details. - ResortWala",
            'booking.cancelled' => "Alert: Booking {{booking_id}} at {{property_name}} has been cancelled. - ResortWala",
            'booking.completed' => "Thank you for staying at {{property_name}}. We hope to see you again soon. - ResortWala",

            'payment.success' => "Payment Received: Rs. {{amount}} for Booking {{booking_id}}. Booking Confirmed. - ResortWala",
            'payment.failed' => "Payment Failed: Transaction of Rs. {{amount}} for Booking {{booking_id}} could not be processed. - ResortWala",
            'payment.refund_initiated' => "Refund Alert: Rs. {{amount}} for Booking {{booking_id}} has been initiated. - ResortWala",

            'vendor.registered' => "Welcome Partner! Your registration is successful. Please wait for admin approval. - ResortWala",
            'vendor.approved' => "Congrats! Your vendor account is approved. You can now login and add properties. - ResortWala",
            'vendor.rejected' => "Update: Your vendor application was rejected. Please check your email for reasons. - ResortWala",
            'vendor.payout_processed' => "Payout Alert: Rs. {{amount}} has been transferred to your account. Ref: {{transaction_id}}. - ResortWala",

            'property.created_admin' => "New Property Alert: {{property_name}} registered by {{vendor_name}}. Review required. - ResortWala",
            'property.approved' => "Great News! Your property {{property_name}} is now Approved and Live. - ResortWala",
            'property.rejected' => "Update: Property {{property_name}} was rejected. Please check admin comments. - ResortWala",
        ];

        foreach ($smsTemplates as $key => $content) {
            // Create Template
            $template = NotificationTemplate::updateOrCreate(
                ['name' => $key . '_sms'],
                [
                    'subject' => 'SMS Notification', // Not used for SMS but required by model
                    'content' => $content,
                    'is_active' => true,
                    'channel' => 'sms'
                ]
            );

            // Link to Trigger
            // Note: Triggers might already exist from Email seeding
            $trigger = NotificationTrigger::where('event_name', $key)->first();
            if ($trigger) {
                $trigger->sms_template_id = $template->id;
                $trigger->save();
            } else {
                NotificationTrigger::create([
                    'event_name' => $key,
                    'sms_template_id' => $template->id,
                    'is_active' => true
                ]);
            }
        }
    }
}
