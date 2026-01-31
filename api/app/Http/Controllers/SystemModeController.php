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
        try {
            $settings = Cache::remember('system_settings', 60, function () {
                try {
                    return SystemSetting::current();
                } catch (\Exception $e) {
                    return new SystemSetting(); // Fallback to empty default
                }
            });

            return response()->json([
                'maintenance' => $settings->maintenance_mode ?? false,
                'coming_soon' => $settings->coming_soon_mode ?? false,
                'logo_url' => $settings->logo_url ?? null,
                'maintenance_content' => $settings->maintenance_content ?? null,
                'coming_soon_content' => $settings->coming_soon_content ?? null,
            ]);
        } catch (\Exception $e) {
            // Absolute fallback if Cache or anything else fails
            return response()->json([
                'maintenance' => false,
                'coming_soon' => false,
                'logo_url' => null
            ]);
        }
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
