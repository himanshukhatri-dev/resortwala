<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Holiday;

class HolidayController extends Controller
{
    public function index(Request $request)
    {
        $query = \App\Models\Holiday::with('property');
        if ($request->property_id) {
            $query->where('property_id', $request->property_id);
        }
        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'from_date' => 'required|date',
            'to_date' => 'required|date|after_or_equal:from_date',
            'property_id' => 'nullable|exists:property_masters,PropertyId',
            'base_price' => 'nullable|numeric|min:0',
            'extra_person_price' => 'nullable|numeric|min:0',
        ]);

        $validated['approved'] = 0; // Default to pending approval
        $holiday = \App\Models\Holiday::create($validated);

        // Notify Admins
        try {
            if ($request->property_id) {
                $property = \App\Models\PropertyMaster::find($request->property_id);
                $vendor = $request->user();
                $admins = \App\Models\User::where('role', 'admin')->get();
                
                foreach ($admins as $admin) {
                     \Illuminate\Support\Facades\Mail::to($admin->email)->send(
                        new \App\Mail\HolidayRequestSubmitted($property, $vendor)
                    );
                }
            }
        } catch (\Exception $e) {
            \Log::error('Holiday notification failed: ' . $e->getMessage());
        }

        return response()->json($holiday, 201);
    }

    public function destroy($id)
    {
        $holiday = \App\Models\Holiday::findOrFail($id);
        $holiday->delete();
        return response()->json(['message' => 'Holiday deleted successfully']);
    }
}
