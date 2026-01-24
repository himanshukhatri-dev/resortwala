<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Support\Facades\Hash;

class AclSeeder extends Seeder
{
    public function run()
    {
        // 1. Reset Cached Roles/Permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // 2. Define Permissions (Module.Action)
        $permissions = [
            // Properties
            'properties.view',
            'properties.create',
            'properties.edit',
            'properties.approve',
            'properties.delete',
            // Social Media
            'social.process',
            'social.post',
            'social.analytics',
            'social.manage',
            // Accounts / Finance
            'accounts.view',
            'accounts.export',
            'accounts.manage',
            // Notifications
            'notifications.view',
            'notifications.manage_templates',
            'notifications.send_test',
            // Analytics & CRM
            'analytics.view',
            'crm.leads',
            'crm.connectors',
            // Bookings
            'bookings.view',
            'bookings.manage',
            // Users & Directory
            'users.manage',
            'users.view',
            // Chatbot
            'chatbot.manage',
            // System / ACL
            'system.manage_users',
            'system.manage_acl',
            'system.view_logs',
            'system.manage_settings',
            'system.backup_db'
        ];

        foreach ($permissions as $perm) {
            Permission::updateOrCreate(['name' => $perm, 'guard_name' => 'web']);
            Permission::updateOrCreate(['name' => $perm, 'guard_name' => 'sanctum']);
        }

        // 3. Define Roles & Assign Permissions

        // Developer (Super Admin) - Has ALL
        $developer = Role::updateOrCreate(['name' => 'Developer', 'guard_name' => 'web']);
        $developer->givePermissionTo(Permission::where('guard_name', 'web')->get());

        $developer_api = Role::updateOrCreate(['name' => 'Developer', 'guard_name' => 'sanctum']);
        $developer_api->givePermissionTo(Permission::where('guard_name', 'sanctum')->get());

        // CEO - Read Only on most, but High Level View
        $ceo = Role::updateOrCreate(['name' => 'CEO', 'guard_name' => 'web']);
        $ceo_api = Role::updateOrCreate(['name' => 'CEO', 'guard_name' => 'sanctum']);
        $ceo_perms = [
            'properties.view',
            'properties.approve',
            'accounts.view',
            'accounts.export',
            'social.analytics',
            'notifications.view',
            'system.view_logs'
        ];
        $ceo->givePermissionTo($ceo_perms);
        $ceo_api->givePermissionTo($ceo_perms);

        // Social Media Manager
        $social = Role::updateOrCreate(['name' => 'SocialMedia', 'guard_name' => 'web']);
        $social_api = Role::updateOrCreate(['name' => 'SocialMedia', 'guard_name' => 'sanctum']);
        $social_perms = [
            'social.process',
            'social.post',
            'social.analytics',
            'properties.view'
        ];
        $social->givePermissionTo($social_perms);
        $social_api->givePermissionTo($social_perms);

        // Property Manager
        $property = Role::updateOrCreate(['name' => 'PropertyManager', 'guard_name' => 'web']);
        $property_api = Role::updateOrCreate(['name' => 'PropertyManager', 'guard_name' => 'sanctum']);
        $property_perms = [
            'properties.view',
            'properties.create',
            'properties.edit',
            'notifications.view'
        ];
        $property->givePermissionTo($property_perms);
        $property_api->givePermissionTo($property_perms);

        // Accounts Manager
        $accounts = Role::updateOrCreate(['name' => 'AccountsManager', 'guard_name' => 'web']);
        $accounts_api = Role::updateOrCreate(['name' => 'AccountsManager', 'guard_name' => 'sanctum']);
        $accounts_perms = [
            'accounts.view',
            'accounts.export',
            'accounts.manage',
            'properties.view'
        ];
        $accounts->givePermissionTo($accounts_perms);
        $accounts_api->givePermissionTo($accounts_perms);

        // 4. Create/Assign specific Users

        // Himanshu -> Developer
        $u1 = User::updateOrCreate(
            ['email' => 'himanshu@resortwala.com'],
            ['name' => 'Himanshu', 'password' => Hash::make('Vyom@123'), 'role' => 'admin']
        );
        $u1->assignRole($developer);

        // Zoheb -> CEO
        $u2 = User::updateOrCreate(
            ['email' => 'zoheb@resortwala.com'],
            ['name' => 'Zoheb', 'password' => Hash::make('Ceo@2026'), 'role' => 'admin']
        );
        $u2->assignRole($ceo);

        // Tanzila -> Social + Accounts
        $u3 = User::updateOrCreate(
            ['email' => 'tanzila@resortwala.com'],
            ['name' => 'Tanzila', 'password' => Hash::make('Social@123'), 'role' => 'admin']
        );
        $u3->assignRole($social);
        $u3->assignRole($accounts);

        // Aayan -> Property Management
        $u4 = User::updateOrCreate(
            ['email' => 'aayan@resortwala.com'],
            ['name' => 'Aayan', 'password' => Hash::make('Prop@Mng'), 'role' => 'admin']
        );
        $u4->assignRole($property);

        // Rehan -> Property + Social
        $u5 = User::updateOrCreate(
            ['email' => 'rehan@resortwala.com'],
            ['name' => 'Rehan', 'password' => Hash::make('Team@Resort'), 'role' => 'admin']
        );
        $u5->assignRole($property);
        $u5->assignRole($social);

        $this->command->info('ACL Roles, Permissions and Users Seeded!');
    }
}
