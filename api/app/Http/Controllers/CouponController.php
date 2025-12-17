<?php

namespace App\Http\Controllers;

use App\Models\Coupon;
use Illuminate\Http\Request;
use Carbon\Carbon;

class CouponController extends Controller
{
    public function check(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
        ]);

        $coupon = Coupon::where('code', $request->code)->first();

        if (!$coupon) {
            return response()->json(['message' => 'Invalid coupon code'], 404);
        }

        if (!$coupon->isValid()) {
            return response()->json(['message' => 'Coupon has expired or is inactive'], 400);
        }

        return response()->json([
            'message' => 'Coupon checked successfully',
            'coupon' => $coupon
        ]);
    }
}
