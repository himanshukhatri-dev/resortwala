<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Connector;
use App\Models\PropertyMaster;
use Illuminate\Support\Facades\DB;

class ConnectorController extends Controller
{
    // List all connectors
    public function index(Request $request)
    {
        $query = Connector::query();

        if ($request->has('active')) {
            $query->where('active', $request->active);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
        }

        $connectors = $query->orderBy('name')->paginate(20);
        return response()->json($connectors);
    }

    // Create a new connector
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|unique:connectors,email',
            'active' => 'boolean'
        ]);

        $connector = Connector::create($validated);
        return response()->json($connector, 201);
    }

    // Update connector
    public function update(Request $request, $id)
    {
        $connector = Connector::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|unique:connectors,email,' . $id,
            'active' => 'boolean'
        ]);

        $connector->update($validated);
        return response()->json($connector);
    }

    // Toggle Active Status
    public function toggleStatus($id)
    {
        $connector = Connector::findOrFail($id);
        $connector->active = !$connector->active;
        $connector->save();
        return response()->json(['message' => 'Status updated', 'active' => $connector->active]);
    }

    // Assign connector to property
    public function assignToProperty(Request $request, $propertyId)
    {
        $validated = $request->validate([
            'connector_id' => 'required|exists:connectors,id',
            'commission_type' => 'required|in:flat,percentage',
            'commission_value' => 'required|numeric|min:0',
            'effective_from' => 'required|date',
            'effective_to' => 'nullable|date|after_or_equal:effective_from'
        ]);

        if ($validated['commission_type'] === 'percentage' && $validated['commission_value'] > 100) {
            return response()->json(['error' => 'Percentage cannot exceed 100'], 422);
        }

        $property = PropertyMaster::findOrFail($propertyId);
        
        // Use syncWithoutDetaching or attach?
        // We want to track history, so maybe just attach a new record?
        // But we should probably close the previous record if exists?
        // For now, let's just add the record as per "Apply only to future bookings" req, 
        // which implies date ranges manage the overlap.
        
        // Optional: Close previous active connector for this property?
        // Let's keep it simple: Just attach. The 'activeConnector' helper in model will pick relevant one.
        
        $property->connectors()->attach($validated['connector_id'], [
            'commission_type' => $validated['commission_type'],
            'commission_value' => $validated['commission_value'],
            'effective_from' => $validated['effective_from'],
            'effective_to' => $validated['effective_to'],
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json(['message' => 'Connector assigned successfully']);
    }

    // Get connectors for a property
    public function getPropertyConnectors($propertyId)
    {
        $property = PropertyMaster::findOrFail($propertyId);
        $connectors = $property->connectors()
            ->orderByPivot('effective_from', 'desc')
            ->get();
            
        return response()->json($connectors);
    }
}
