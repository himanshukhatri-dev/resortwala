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

        $holiday = \App\Models\Holiday::create($validated);
        return response()->json($holiday, 201);
    }
}
