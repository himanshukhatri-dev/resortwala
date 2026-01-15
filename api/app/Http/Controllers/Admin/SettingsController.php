<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SiteConfig;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function index()
    {
        $configs = SiteConfig::all()->groupBy('group');
        return response()->json([
            'success' => true,
            'settings' => $configs
        ]);
    }

    public function update(Request $request)
    {
        $settings = $request->input('settings'); // Expecting [key => value]

        foreach ($settings as $key => $value) {
            SiteConfig::where('key', $key)->update(['value' => $value]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Settings updated successfully'
        ]);
    }
}
