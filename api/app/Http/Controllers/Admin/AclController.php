<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;
use App\Models\AuditLog;

class AclController extends Controller
{
    /**
     * Get the full permission matrix (Roles vs Permissions)
     */
    public function getMatrix()
    {
        $roles = Role::where('guard_name', 'web')->with('permissions')->get();
        $permissions = Permission::where('guard_name', 'web')
            ->get()
            ->groupBy(function($item) {
                return explode('.', $item->name)[0]; // Group by module (properties, social, etc.)
            });

        return response()->json([
            'roles' => $roles,
            'permissions' => $permissions
        ]);
    }

    /**
     * Update permissions for a specific role
     */
    public function updateRolePermissions(Request $request, $roleId)
    {
        $role = Role::where('id', $roleId)->firstOrFail();
        $role->syncPermissions($request->permissions);

        // Keep 'web' and 'sanctum' guards in sync for parity
        Role::where('name', $role->name)
            ->where('id', '!=', $role->id)
            ->get()
            ->each(function($r) use ($request) {
                $r->syncPermissions($request->permissions);
            });
        
        return response()->json(['message' => 'Role permissions updated successfully']);
    }

    /**
     * Get list of users with their roles
     */
    public function getUsers()
    {
        // Only show Admin users in the ACL list
        $users = User::with('roles')
            ->where('role', 'admin')
            ->get();
        $allRoles = Role::where('guard_name', 'web')->pluck('name');
        
        return response()->json([
            'users' => $users,
            'available_roles' => $allRoles
        ]);
    }

    /**
     * Assign a role to a user
     */
    public function assignRole(Request $request, $userId)
    {
        $user = User::findOrFail($userId);
        $user->syncRoles([$request->role]);
        
        return response()->json(['message' => "User assigned to {$request->role}"]);
    }

    /**
     * Get Audit Logs with filtering
     */
    public function getAuditLogs(Request $request)
    {
        $query = AuditLog::with('user:id,name,email')->latest();

        if ($request->module) {
            $query->where('module', $request->module);
        }
        
        if ($request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        return response()->json($query->paginate(50));
    }
}
