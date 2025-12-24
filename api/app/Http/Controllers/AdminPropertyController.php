<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\PropertyMaster;

class AdminPropertyController extends Controller
{
    /**
     * Approve a property and verify admin pricing.
     */
    public function approve(Request $request, $id)
    {
        try {
            $property = PropertyMaster::findOrFail($id);

            // Update basic fields if provided
            $data = $request->except(['id', 'vendor_id', 'is_approved', 'PropertyId']);
            
            if ($request->has('admin_pricing')) {
                $adminPricing = $request->admin_pricing;
                
                // Ensure it's an array (not string)
                if (is_string($adminPricing)) {
                    $adminPricing = json_decode($adminPricing, true);
                }
                
                $property->admin_pricing = $adminPricing;
                
                // Sync Final Prices to columns for display/search consistency
                if (isset($adminPricing['mon_thu']['villa']['final'])) {
                    $property->Price = $adminPricing['mon_thu']['villa']['final'];
                    $property->price_mon_thu = $adminPricing['mon_thu']['villa']['final'];
                }
                if (isset($adminPricing['fri_sun']['villa']['final'])) {
                    $property->price_fri_sun = $adminPricing['fri_sun']['villa']['final'];
                }
                if (isset($adminPricing['sat']['villa']['final'])) {
                    $property->price_sat = $adminPricing['sat']['villa']['final'];
                }
            }

            // Apply other manual edits made by admin (filter out null values)
            foreach ($data as $key => $value) {
                if ($value !== null && !empty($key)) {
                    $property->$key = $value;
                }
            }

            $property->is_approved = true;
            // Also ensure it is active and status is true
            $property->IsActive = true;
            $property->PropertyStatus = true;
            
            $property->save();

            return response()->json([
                'message' => 'Property approved and details updated successfully',
                'property' => $property
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Property approval failed', [
                'property_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Failed to approve property',
                'error' => $e->getMessage(),
                'details' => config('app.debug') ? $e->getTraceAsString() : 'Enable debug mode for details'
            ], 500);
        }
    }

    /**
     * Update pricing matrix without changing approval status (or re-approving).
     */
    public function updatePricing(Request $request, $id)
    {
        $property = PropertyMaster::findOrFail($id);

        $validated = $request->validate([
            'admin_pricing' => 'required|array',
            'admin_pricing.mon_thu' => 'required|array',
            'admin_pricing.fri_sun' => 'required|array',
            'admin_pricing.sat' => 'required|array',
        ]);

        $property->admin_pricing = $validated['admin_pricing'];
        
        // Optional: Update main price columns to match Mon-Thu Final Price for directory listing consistency
        if (isset($validated['admin_pricing']['mon_thu']['villa']['final'])) {
            $property->Price = $validated['admin_pricing']['mon_thu']['villa']['final']; // DealPrice?
            $property->price_mon_thu = $validated['admin_pricing']['mon_thu']['villa']['final'];
        }
        if (isset($validated['admin_pricing']['fri_sun']['villa']['final'])) {
            $property->price_fri_sun = $validated['admin_pricing']['fri_sun']['villa']['final'];
        }
        if (isset($validated['admin_pricing']['sat']['villa']['final'])) {
            $property->price_sat = $validated['admin_pricing']['sat']['villa']['final'];
        }

        $property->save();

        return response()->json([
            'message' => 'Pricing updated successfully',
            'property' => $property
        ]);
    }
    
    /**
     * Get property details for admin review
     */
    /**
     * Get property details for admin review
     */
    public function show($id)
    {
        $property = PropertyMaster::with(['images', 'vendor'])->findOrFail($id);
        // Attach checking for pending changes?
        // Let's load it as a relationship if possible, or manual query
        $pendingChanges = \App\Models\PropertyEditRequest::where('property_id', $id)
            ->where('status', 'pending')
            ->first();
            
        $property->pending_changes = $pendingChanges;

        return response()->json($property);
    }

    /* --- Change Request Management --- */

    public function getChangeRequests()
    {
        $requests = \App\Models\PropertyEditRequest::where('status', 'pending')
            ->with(['property', 'vendor'])
            ->orderBy('created_at', 'asc')
            ->get();
            
        return response()->json($requests);
    }

    public function getChangeRequest($id)
    {
        $request = \App\Models\PropertyEditRequest::with(['property', 'vendor'])->findOrFail($id);
        return response()->json($request);
    }

    public function approveChanges(Request $request, $id)
    {
        // Approve specific changes for a property
        $editRequest = \App\Models\PropertyEditRequest::where('property_id', $id)
            ->where('status', 'pending')
            ->firstOrFail();

        $property = PropertyMaster::findOrFail($id);
        
        // Apply Changes
        $changes = $editRequest->changes_json;
        $property->update($changes);
        
        $editRequest->status = 'approved';
        $editRequest->save();
        $editRequest->delete(); // Soft delete or hard? History might be useful. 
        // For now, let's keep it but status approved, OR delete.
        // User asked "what changed from and to", implies history?
        // But if we delete, we lose history.
        // Let's just delete for MVP to keep it clean, or keep it.
        // To prevent clogging, let's delete.
        
        return response()->json(['message' => 'Changes approved and applied successfully']);
    }

    public function rejectChanges(Request $request, $id)
    {
        $editRequest = \App\Models\PropertyEditRequest::where('property_id', $id)
            ->where('status', 'pending')
            ->firstOrFail();

        $editRequest->status = 'rejected';
        // $editRequest->admin_feedback = $request->feedback;
        $editRequest->save();
        $editRequest->delete();

        return response()->json(['message' => 'Changes rejected']);
    }
}
