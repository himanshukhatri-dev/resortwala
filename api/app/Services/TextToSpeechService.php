<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class TextToSpeechService
{
    // STRICT VOICE MAPPING (Edge TTS)
    const VOICE_MAP = [
        // Male Voices
        'atlas' => ['key' => 'en-US-GuyNeural', 'gender' => 'male'],
        'arjun' => ['key' => 'en-IN-PrabhatNeural', 'gender' => 'male'], // Indian English
        'neo' => ['key' => 'en-US-ChristopherNeural', 'gender' => 'male'],
        'dev' => ['key' => 'hi-IN-MadhurNeural', 'gender' => 'male'], // Hindi

        // Female Voices
        'aura' => ['key' => 'en-US-AriaNeural', 'gender' => 'female'],
        'mira' => ['key' => 'en-IN-NeerjaNeural', 'gender' => 'female'], // Indian English
        'luna' => ['key' => 'en-US-MichelleNeural', 'gender' => 'female'],
        'zara' => ['key' => 'hi-IN-SwaraNeural', 'gender' => 'female'], // Hindi
        'aarohi' => ['key' => 'mr-IN-AarohiNeural', 'gender' => 'female'], // Marathi
        'manohar' => ['key' => 'mr-IN-ManoharNeural', 'gender' => 'male'], // Marathi

        // New Hindi Voices
        'madhur' => ['key' => 'hi-IN-MadhurNeural', 'gender' => 'male'],
        'swara' => ['key' => 'hi-IN-SwaraNeural', 'gender' => 'female'],

        // Indian English (Non-Bot feel)
        'prabhat' => ['key' => 'en-IN-PrabhatNeural', 'gender' => 'male'],
        'neerja' => ['key' => 'en-IN-NeerjaNeural', 'gender' => 'female']
    ];

    public function generateAudio(string $text, string $voiceId, string $language = 'en', ?string $expectedGender = null)
    {
        $voiceId = strtolower($voiceId);
        // Default to Atlas if not found
        $config = self::VOICE_MAP[$voiceId] ?? self::VOICE_MAP['atlas'];

        // 1. Strict Gender Validation
        if ($expectedGender && $config['gender'] !== strtolower($expectedGender)) {
            Log::emergency("Voice Gender Mismatch! Requested: {$expectedGender}, Got: {$config['gender']} (ID: {$voiceId})");
            throw new \Exception("Voice Safety Check Failed: Selected voice '{$voiceId}' is {$config['gender']}, but {$expectedGender} was required.");
        }

        $filename = 'tts_' . $voiceId . '_' . md5($text . time()) . '.mp3';
        $outputPath = storage_path('app/public/audio/' . $filename);
        $publicPath = 'audio/' . $filename;

        if (!file_exists(dirname($outputPath))) {
            mkdir(dirname($outputPath), 0755, true);
        }

        // 2. Execute edge-tts
        $safeText = escapeshellarg($text);
        $safePath = escapeshellarg($outputPath);

        // Try direct command first, then python module fallback
        // USE ABSOLUTE PATHS found in container
        $edgeTtsPath = '/usr/local/bin/edge-tts';
        $pythonPath = '/usr/bin/python3';

        $cmd = "{$edgeTtsPath} --voice \"{$config['key']}\" --text {$safeText} --write-media {$safePath}";

        try {
            $output = [];
            $returnCode = 0;

            Log::info("Generating TTS with Voice: {$config['key']} ({$voiceId})");
            // Increase timeout or execution time? CLI is fast.
            exec($cmd . " 2>&1", $output, $returnCode);

            if ($returnCode !== 0 || !file_exists($outputPath)) {
                // Fallback: Python Module
                Log::warning("EdgeTTS CLI failed, trying python module...");
                // Use python3 explicitly with absolute path
                $cmdAttempt2 = "{$pythonPath} -m edge_tts --voice \"{$config['key']}\" --text {$safeText} --write-media {$safePath}";
                exec($cmdAttempt2 . " 2>&1", $output, $returnCode);

                if ($returnCode !== 0) {
                    throw new \Exception("EdgeTTS failed: " . implode("\n", $output));
                }
            }

        } catch (\Throwable $e) {
            Log::error("TTS Generation Failed: " . $e->getMessage());
            throw $e;
        }

        return $publicPath;
    }

    public function getVoices()
    {
        $voices = [];
        foreach (self::VOICE_MAP as $id => $cfg) {
            // Format Name: Atlas (Male)
            $name = ucfirst($id) . " (" . ucfirst($cfg['gender']) . ")";
            $voices[] = [
                'id' => $id,
                'name' => $name,
                'gender' => $cfg['gender'],
                'engine_key' => $cfg['key']
            ];
        }
        return $voices;
    }
}
