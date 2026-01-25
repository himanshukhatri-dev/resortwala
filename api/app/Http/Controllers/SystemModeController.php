<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\SystemSetting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class SystemModeController extends Controller
{
    /**
     * Get Public System Mode Status
     */
    public function getMode()
    {
        $settings = Cache::remember('system_settings', 60, function () {
            return SystemSetting::current();
        });

        return response()->json([
            'maintenance' => $settings->maintenance_mode,
            'coming_soon' => $settings->coming_soon_mode,
            'logo_url' => $settings->logo_url,
            'maintenance_content' => $settings->maintenance_content,
            'coming_soon_content' => $settings->coming_soon_content,
        ]);
    }

    /**
     * Update System Settings (Admin Only)
     */
    public function updateSettings(Request $request)
    {
        $validated = $request->validate([
            'maintenance_mode' => 'required|boolean',
            'coming_soon_mode' => 'required|boolean',
            'maintenance_content' => 'nullable|array',
            'coming_soon_content' => 'nullable|array',
            'developer_bypass_key' => 'nullable|string'
        ]);

        $settings = SystemSetting::current();
        $settings->fill($validated);
        $settings->updated_by = $request->user()->id;
        $settings->save();

        Cache::forget('system_settings');

        return response()->json([
            'message' => 'System settings updated successfully',
            'settings' => $settings
        ]);
    }

    /**
     * Upload System Assets (Logo/Background)
     */
    public function uploadAsset(Request $request)
    {
        $request->validate([
            'file' => 'required|image|max:5120', // 5MB
            'type' => 'required|string|in:logo,background_maintenance,background_coming_soon'
        ]);

        $file = $request->file('file');
        $path = $file->store('system', 'public');
        $url = Storage::disk('public')->url($path);

        return response()->json([
            'url' => $url,
            'path' => $path
        ]);
    }
}
