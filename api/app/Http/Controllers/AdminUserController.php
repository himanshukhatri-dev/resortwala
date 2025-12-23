<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AdminUserController extends Controller
{
    // --- ADMIN MANAGEMENT ---

    public function getAdmins()
    {
        $admins = User::where('role', 'admin')
            ->orderBy('created_at', 'desc')
            ->get(['id', 'name', 'email', 'created_at']);
        
        return response()->json($admins);
    }

    public function createAdmin(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
        ]);

        $admin = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'admin',
        ]);

        return response()->json(['message' => 'Admin created successfully', 'admin' => $admin], 201);
    }

    // --- CUSTOMER MANAGEMENT ---

    public function getCustomers()
    {
        $customers = Customer::orderBy('created_at', 'desc')
            ->get(['id', 'name', 'email', 'phone', 'created_at']);
            
        return response()->json($customers);
    }

    public function createCustomer(Request $request) 
    {
         // Optional: Allow admin to manually add customers
         $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:customers',
            'password' => 'required|string|min:8',
            'phone' => 'nullable|string'
        ]);

        $customer = Customer::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'phone' => $request->phone
        ]);

        return response()->json(['message' => 'Customer created successfully', 'customer' => $customer], 201);
    }

    // --- VENDOR MANAGEMENT (VIA USER TABLE) ---

    public function getVendors()
    {
        $vendors = User::where('role', 'vendor')
            ->orderBy('created_at', 'desc')
            ->get(['id', 'name', 'email', 'phone', 'business_name', 'created_at']);
        
        return response()->json($vendors);
    }

    public function createVendor(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'business_name' => 'nullable|string|max:255',
            'phone' => 'nullable|string'
        ]);

        $vendor = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'vendor',
            'business_name' => $request->business_name,
            'phone' => $request->phone,
            'is_approved' => true // Admins creating vendors probably means auto-approved
        ]);

        return response()->json(['message' => 'Vendor created successfully', 'vendor' => $vendor], 201);
    }

    // --- SHARED/GENERIC ---

    public function updateUser(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($id)],
            // Password is optional for updates
            'password' => 'nullable|string|min:8',
        ]);

        $user = User::findOrFail($id);
        
        $user->name = $request->name;
        $user->email = $request->email;
        
        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }
        
        if ($request->has('phone')) $user->phone = $request->phone;
        if ($request->has('business_name')) $user->business_name = $request->business_name;

        $user->save();

        return response()->json(['message' => 'User updated successfully', 'user' => $user]);
    }

    public function updateCustomer(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('customers')->ignore($id)],
            'password' => 'nullable|string|min:8',
            'phone' => 'nullable|string'
        ]);

        $customer = Customer::findOrFail($id);
        
        $customer->name = $request->name;
        $customer->email = $request->email;
        
        if ($request->filled('password')) {
            $customer->password = Hash::make($request->password);
        }

        if ($request->has('phone')) $customer->phone = $request->phone;

        $customer->save();

        return response()->json(['message' => 'Customer updated successfully', 'customer' => $customer]);
    }

    public function deleteUser($id)
    {
        // Deletes from 'users' table (Admin or Vendor)
        $user = User::findOrFail($id);
        
        // Prevent self-deletion
        if ($user->id === auth()->id()) {
            return response()->json(['message' => 'Cannot delete yourself'], 403);
        }

        // Check for existing properties (if vendor)
        if ($user->role === 'vendor' && $user->properties()->exists()) {
             return response()->json(['message' => 'Cannot delete vendor. They have existing properties. Please delete properties first.'], 422);
        }
        
        // Cascade delete onboarding tokens
        \App\Models\OnboardingToken::where('user_id', $id)
            ->where('user_type', 'user')
            ->delete();

        $user->delete();
        return response()->json(['message' => 'User deleted successfully']);
    }

    public function deleteCustomer($id)
    {
        $customer = Customer::findOrFail($id);
        $customer->delete();
        return response()->json(['message' => 'Customer deleted successfully']);
    }

    public function updateRole(Request $request, $id)
    {
        $request->validate([
            'role' => 'required|in:admin,vendor,customer',
        ]);

        $user = User::findOrFail($id);
        
        // Prevent changing own role if last admin (safety check)
        if ($user->id === auth()->id() && $request->role !== 'admin') {
             return response()->json(['message' => 'Cannot change your own role to non-admin.'], 403);
        }

        $user->role = $request->role;
        $user->save();

        return response()->json(['message' => 'User role updated successfully', 'user' => $user]);
    }
}
