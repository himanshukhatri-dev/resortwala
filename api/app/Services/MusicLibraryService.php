<?php

namespace App\Services;

class MusicLibraryService
{
    /**
     * Get a music track configuration based on mood/template.
     * In a real app, this would query a database or scan a directory.
     */
    public function getTrackForTemplate(string $templateId)
    {
        // Mock Library
        $library = [
            'luxury' => [
                'filename' => 'luxury_ambient.mp3',
                'bpm' => 80,
                'path' => storage_path('app/public/music/luxury_ambient.mp3'),
                'filters' => 'eq=contrast=1.1:saturation=1.2,curves=vintage', // Warm/Gold look
                'transition' => 'fade'
            ],
            'party' => [
                'filename' => 'upbeat_pop.mp3',
                'bpm' => 120,
                'path' => storage_path('app/public/music/upbeat_pop.mp3'),
                'filters' => 'eq=contrast=1.2:saturation=1.4', // Vibrant
                'transition' => 'whipleft'
            ],
            'family' => [
                'filename' => 'happy_acoustic.mp3',
                'bpm' => 100,
                'path' => storage_path('app/public/music/happy_acoustic.mp3'),
                'filters' => 'eq=saturation=1.3', // Colorful
                'transition' => 'circleopen'
            ],
            'reels' => [
                'filename' => 'viral_beat.mp3',
                'bpm' => 128,
                'path' => storage_path('app/public/music/viral_beat.mp3'),
                'filters' => 'eq=contrast=1.1:brightness=0.05', // Bright/Sharp
                'transition' => 'slideleft' // 'zoom' was failing on prod
            ]
        ];

        return $library[$templateId] ?? $library['luxury'];
    }

    /**
     * Calculate image duration based on BPM (Beats Per Minute)
     * We want cuts to happen on the beat (or every 2/4 beats).
     */
    public function getBeatDuration(int $bpm, int $beatsPerScene = 4): float
    {
        if ($bpm <= 0) return 3.0; // Fallback
        
        $secondsPerBeat = 60 / $bpm;
        return $secondsPerBeat * $beatsPerScene;
    }
}
