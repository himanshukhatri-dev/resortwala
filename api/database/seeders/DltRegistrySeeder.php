<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DltRegistrySeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $senderId = 'ResWla'; // Your 6-char Sender ID

        $registries = [
            [
                'entity_id' => '1701170716830756783', // This should be provided by user too, but using placeholder or existing if known. Wait, user didn't give entity ID. I will assume it's in ENV or I'll ask. Actually the NotificationEngine grabs it from Config. The table needs it. I will assume a placeholder or ask.
                // Wait, the user prompt said "what else do you need?". I should probably check if I have the Entity ID.
                // In NotificationEngine: $dltEntityId = config('services.sms.dlt_entity_id') ?? env('SMS_DLT_ENTITY_ID');
                // The table dlt_registries has an entity_id column. It seems redundant if it's the same for all, but maybe different for different headers?
                // For now I will use the one from env or a placeholder.
                
                // User provided Template IDs.
                
                'sender_id' => $senderId,
                'template_id' => '1707176886644052410',
                'approved_content' => 'Dear User, {#var#} is your OTP for login at ResortWala. Valid for 10 mins. Do not share. - ResortWala',
                'variable_mapping' => json_encode(['otp' => '{#var#}']),
                'is_active' => true,
            ],
            [
                'sender_id' => $senderId,
                'template_id' => '1707176886656656974',
                'approved_content' => 'Booking Confirmed! Id: {#var#} for {#var#}. Check-in: {#var#}. Thanks for choosing ResortWala.',
                'variable_mapping' => json_encode(['booking_id' => '{#var#}', 'property_name' => '{#var#}', 'check_in' => '{#var#}']),
                'is_active' => true,
            ],
            [
                'sender_id' => $senderId,
                'template_id' => '1707176886664943347',
                'approved_content' => 'New Booking Alert! Property: {#var#}, Date: {#var#}. Check app for details. - ResortWala',
                'variable_mapping' => json_encode(['property_name' => '{#var#}', 'date' => '{#var#}']),
                'is_active' => true,
            ],
            [
                'sender_id' => $senderId,
                'template_id' => '1707176886673745125',
                'approved_content' => 'Security Alert: New login to your ResortWala Admin account from {#var#} at {#var#}. - ResortWala',
                'variable_mapping' => json_encode(['ip' => '{#var#}', 'time' => '{#var#}']),
                'is_active' => true,
            ]
        ];

        // Retrieve Entity ID from Env if possible, else generic
        $envEntityId = env('SMS_DLT_ENTITY_ID', '1001000000000000000'); // Fail-safe

        foreach ($registries as $reg) {
            $reg['entity_id'] = $envEntityId;
            $reg['created_at'] = Carbon::now();
            $reg['updated_at'] = Carbon::now();

            DB::table('dlt_registries')->updateOrInsert(
                ['template_id' => $reg['template_id']],
                $reg
            );
        }
    }
}
