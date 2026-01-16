<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class TextToSpeechService
{
    /**
     * Generate TTS Audio from Script.
     * 
     * @param string $text
     * @param string $voiceId
     * @param string $language
     * @return string Path to generated audio file
     */
    public function generateAudio(string $text, string $voiceId, string $language = 'en')
    {
        // Output path
        $filename = 'tts_' . md5($text . $voiceId . time()) . '.mp3';
        $outputPath = storage_path('app/public/audio/' . $filename);
        $publicPath = 'audio/' . $filename;

        // Ensure directory exists
        if (!file_exists(dirname($outputPath))) {
            mkdir(dirname($outputPath), 0755, true);
        }

        // --- SIMULATION MODE ---
        $mockSource = storage_path('app/public/music/viral_beat.mp3'); // Reuse existing if available
        if (file_exists($mockSource)) {
             copy($mockSource, $outputPath);
        } else {
             // Create a dummy file (Silent MP3 Header)
             file_put_contents($outputPath, "RIFF" . pack("V", 1000) . "WAVEfmt " . pack("V", 16) . pack("v", 1) . pack("v", 1) . pack("V", 44100) . pack("V", 88200) . pack("v", 2) . pack("v", 16) . "data" . pack("V", 0));
        }

        Log::info("Generated Mock TTS: {$publicPath} for Voice: {$voiceId}");

        return $publicPath;
    }

    /**
     * Get available voices
     */
    public function getVoices()
    {
        return [
            ['id' => 'cinematic_male', 'name' => 'Deep Cinematic (Male)', 'category' => 'Marketing'],
            ['id' => 'friendly_female', 'name' => 'Warm Friendly (Female)', 'category' => 'Storytelling'],
            ['id' => 'motivational_male', 'name' => 'Motivational (Male)', 'category' => 'Hype'],
            ['id' => 'premium_female', 'name' => 'Premium Brand (Female)', 'category' => 'Luxury'],
        ];
    }
}
