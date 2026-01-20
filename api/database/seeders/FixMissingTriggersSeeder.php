<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\NotificationTemplate;
use App\Models\NotificationTrigger;
use Illuminate\Support\Facades\DB;

class FixMissingTriggersSeeder extends Seeder
{
    public function run()
    {
        // 1. Fix 'sms_booking_confirmed' (if needed) - content check
        // DLT: Booking Confirmed! Id: {#var#} for {#var#}. Check app for details. - ResortWala
        // Template: Booking Confirmed! Id: {{id}} for {{property}}. Check app for details. - ResortWala
        // This seems fine.

        // 2. Vendor New Booking (ID: 1707176886664943347)
        // DLT: New Booking Alert! Property: {#var#}, Date: {#var#}. Check app for details. - ResortWala
        $vendorTemplate = NotificationTemplate::updateOrCreate(
            ['name' => 'sms_booking_new_request_vendor'],
            [
                'channel' => 'sms',
                'subject' => 'New Booking Request',
                'content' => 'New Booking Alert! Property: {{property}}, Date: {{date}}. Check app for details. - ResortWala',
                'is_active' => true,
            ]
        );

        $vendorTrigger = NotificationTrigger::where('event_name', 'booking.new_request_vendor')->first();
        if ($vendorTrigger) {
            $vendorTrigger->sms_template_id = $vendorTemplate->id;
            $vendorTrigger->save();
            echo "Linked 'booking.new_request_vendor' to Template ID: {$vendorTemplate->id}\n";
        }

        // 3. Admin Login (ID: 1707176886673745125)
        // DLT: Security Alert: New login to your ResortWala Admin account from {#var#} at {#var#}. - ResortWala
        $adminTemplate = NotificationTemplate::updateOrCreate(
            ['name' => 'sms_admin_login_alert'],
            [
                'channel' => 'sms',
                'subject' => 'Admin Login Alert',
                'content' => 'Security Alert: New login to your ResortWala Admin account from {{ip}} at {{time}}. - ResortWala',
                'is_active' => true,
            ]
        );

        $adminTrigger = NotificationTrigger::updateOrCreate(
            ['event_name' => 'admin.login'], // Note: Event name from AdminController is 'admin.login'
            [
                'email_template_id' => null, // Should logic for email exist? Controller dispatches 'admin.login' 
                'sms_template_id' => $adminTemplate->id,
                'is_active' => true,
                'audience' => 'admin'
            ]
        );
        echo "Linked 'admin.login' to Template ID: {$adminTemplate->id}\n";
    }
}
