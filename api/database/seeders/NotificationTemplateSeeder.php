<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\NotificationTemplate;
use App\Models\NotificationTrigger;

class NotificationTemplateSeeder extends Seeder
{
    public function run()
    {
        // --- 1. Email Templates ---
        $emails = [
            [
                'name' => 'email_auth_otp',
                'subject' => 'ResortWala Login Verification',
                'content' => '
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                        <h2 style="color: #4F46E5; text-align: center;">ResortWala Verification</h2>
                        <p>Hi there,</p>
                        <p>Use the following One Time Password (OTP) to verify your identity:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <span style="font-size: 32px; font-weight: bold; padding: 10px 20px; background: #f3f4f6; border-radius: 8px; letter-spacing: 5px;">{{otp}}</span>
                        </div>
                        <p style="text-align: center; color: #666; font-size: 12px;">This code is valid for 10 minutes. Do not share it with anyone.</p>
                    </div>',
                'variables' => ['otp']
            ],
            [
                'name' => 'email_booking_confirmed_customer',
                'subject' => 'Booking Confirmed! 🌴 {{property_name}}',
                'content' => '
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                        <h2 style="color: #10B981; text-align: center;">Booking Confirmed!</h2>
                        <p>Dear {{customer_name}},</p>
                        <p>Your stay at <strong>{{property_name}}</strong> is confirmed. Get ready for a relaxing experience!</p>
                        
                        <div style="background: #F9FAFB; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p><strong>Booking ID:</strong> #{{id}}</p>
                            <p><strong>Check-in:</strong> {{CheckInDate}}</p>
                            <p><strong>Check-out:</strong> {{CheckOutDate}}</p>
                            <p><strong>Guests:</strong> {{Guests}}</p>
                            <p><strong>Total Paid:</strong> ₹{{TotalAmount}}</p>
                        </div>

                        <div style="text-align: center;">
                            <a href="{{booking_url}}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Booking Details</a>
                        </div>
                    </div>',
                'variables' => ['customer_name', 'property_name', 'id', 'CheckInDate', 'CheckOutDate', 'Guests', 'TotalAmount', 'booking_url']
            ],
            [
                'name' => 'email_booking_request_vendor',
                'subject' => 'New Booking Request! 🔔 {{property_name}}',
                'content' => '
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #F59E0B;">New Booking Alert</h2>
                        <p>Hello,</p>
                        <p>You have received a new booking request for <strong>{{property_name}}</strong>.</p>
                        <ul>
                            <li><strong>Dates:</strong> {{CheckInDate}} to {{CheckOutDate}}</li>
                            <li><strong>Guest Name:</strong> {{customer_name}}</li>
                            <li><strong>Amount:</strong> ₹{{TotalAmount}}</li>
                        </ul>
                        <p>Please login to your dashboard to review details.</p>
                    </div>',
                'variables' => ['property_name', 'CheckInDate', 'CheckOutDate', 'customer_name', 'TotalAmount']
            ],
            [
                'name' => 'email_vendor_approved',
                'subject' => 'Welcome to ResortWala! Account Approved ✅',
                'content' => '
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #10B981;">Account Approved</h2>
                        <p>Dear {{name}},</p>
                        <p>Congratulations! Your vendor account has been approved. You can now start listing your properties and accepting bookings.</p>
                        <div style="text-align: center; margin: 30px;">
                            <a href="{{login_url}}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Login to Dashboard</a>
                        </div>
                    </div>',
                'variables' => ['name', 'login_url']
            ]
        ];

        foreach ($emails as $data) {
            NotificationTemplate::updateOrCreate(
                ['name' => $data['name'], 'channel' => 'email'],
                array_merge($data, ['is_active' => true])
            );
        }

        // --- 2. SMS Templates (DLT Style) ---
        $sms = [
            [
                'name' => 'sms_auth_otp',
                'content' => 'Dear User, {{otp}} is your OTP for login at ResortWala. Valid for 10 mins. Do not share. - ResortWala',
                'variables' => ['otp']
            ],
            [
                'name' => 'sms_booking_confirmed',
                'content' => 'Booking Confirmed! Id: {{id}} for {{property_name}}. Check-in: {{CheckInDate}}. Thanks for choosing ResortWala.',
                'variables' => ['id', 'property_name', 'CheckInDate']
            ],
            [
                'name' => 'sms_vendor_new_booking',
                'content' => 'New Booking Alert! Property: {{property_name}}, Date: {{CheckInDate}}. Check app for details. - ResortWala',
                'variables' => ['property_name', 'CheckInDate']
            ]
        ];

        foreach ($sms as $data) {
            NotificationTemplate::updateOrCreate(
                ['name' => $data['name'], 'channel' => 'sms'],
                array_merge($data, ['is_active' => true])
            );
        }

        // --- 3. Triggers Mapping ---
        $mappings = [
            'auth.otp' => ['email' => 'email_auth_otp', 'sms' => 'sms_auth_otp'],
            'booking.confirmed_customer' => ['email' => 'email_booking_confirmed_customer', 'sms' => 'sms_booking_confirmed'],
            'booking.new_request_vendor' => ['email' => 'email_booking_request_vendor', 'sms' => 'sms_vendor_new_booking'],
            'vendor.approved' => ['email' => 'email_vendor_approved', 'sms' => null],
        ];

        foreach ($mappings as $event => $tpls) {
            $emailTpl = $tpls['email'] ? NotificationTemplate::where('name', $tpls['email'])->first() : null;
            $smsTpl = $tpls['sms'] ? NotificationTemplate::where('name', $tpls['sms'])->first() : null;

            NotificationTrigger::updateOrCreate(
                ['event_name' => $event],
                [
                    'email_template_id' => $emailTpl?->id,
                    'sms_template_id' => $smsTpl?->id,
                    'audience' => 'customer', // Default, can be adjusted manually
                    'is_active' => true
                ]
            );
        }

        $this->command->info('Notification Templates & Triggers Seeded Successfully!');
    }
}
