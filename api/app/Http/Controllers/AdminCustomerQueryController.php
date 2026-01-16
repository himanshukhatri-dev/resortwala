<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\CustomerQuery;
use Illuminate\Support\Facades\DB;

class AdminCustomerQueryController extends Controller
{
    public function index()
    {
        $queries = CustomerQuery::orderBy('created_at', 'desc')->paginate(20);
        return response()->json(['success' => true, 'data' => $queries]);
    }

    public function update(Request $request, $id)
    {
        $query = CustomerQuery::find($id);
        if (!$query) return response()->json(['success' => false], 404);

        $query->update($request->only(['status', 'admin_notes']));
        return response()->json(['success' => true]);
    }

    public function destroy($id)
    {
        CustomerQuery::destroy($id);
        return response()->json(['success' => true]);
    }
}
