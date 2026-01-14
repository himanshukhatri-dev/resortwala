<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PropertyMaster;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RevenueController extends Controller
{
    /**
     * Get all properties with their full revenue data (base, addons, seasonal).
     */
    public function index(Request $request)
    {
        $query = PropertyMaster::with(['vendor', 'addons']);

        // Filter by city
        if ($request->has('city') && $request->city) {
            $query->where('Location', $request->city); // Assuming Location stores city name or mapped ID
        }

        // Filter by vendor
        if ($request->has('vendor_id') && $request->vendor_id) {
            $query->where('vendor_id', $request->vendor_id);
        }

        // Search by name
        if ($request->has('search') && $request->search) {
            $query->where('Name', 'like', '%' . $request->search . '%');
        }

        $properties = $query->paginate(20);

        // Transform data to include necessary grid fields
        // We will fetch addons and seasonal rules separately if needed or via relationship if models are ready.
        // For now, simpler structure.
        
        return response()->json($properties);
    }

    /**
     * Update pricing (base rates, meal plans) for a specific property.
     */
    public function updateRates(Request $request, $id)
    {
        $property = PropertyMaster::findOrFail($id);

        $validated = $request->validate([
            'admin_pricing' => 'array|nullable',
            // Legacy Sync (Optional but processed if sent)
            'price_mon_thu' => 'nullable|numeric',
            'price_fri_sun' => 'nullable|numeric',
            'price_sat' => 'nullable|numeric',
            'Breakfast' => 'nullable|numeric',
            'Lunch' => 'nullable|numeric',
            'Dinner' => 'nullable|numeric',
            'HiTea' => 'nullable|numeric',
        ]);

        $property->update($validated);

        return response()->json(['message' => 'Rates updated successfully', 'property' => $property]);
    }

    /**
     * Get Add-ons for a property.
     */
    public function getAddons($id)
    {
        $addons = \App\Models\Admin\PropertyAddon::where('property_id', $id)->get();
        return response()->json($addons);
    }

    /**
     * Create a new Add-on.
     */
    public function storeAddon(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'cost_price' => 'nullable|numeric',
            'selling_price' => 'required|numeric',
        ]);

        $addon = \App\Models\Admin\PropertyAddon::create([
            'property_id' => $id,
            'name' => $validated['name'],
            'cost_price' => $validated['cost_price'] ?? 0,
            'selling_price' => $validated['selling_price'],
            'is_active' => true
        ]);

        return response()->json($addon);
    }

    /**
     * Delete an Add-on.
     */
    public function deleteAddon($propertyId, $addonId)
    {
        $addon = \App\Models\Admin\PropertyAddon::where('property_id', $propertyId)
                    ->where('id', $addonId)
                    ->firstOrFail();
        
        $addon->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }
}
