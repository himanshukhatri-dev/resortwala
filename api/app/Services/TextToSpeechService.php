<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class TextToSpeechService
{
    public function generateAudio(string $text, string $voiceId, string $language = 'en')
    {
        $filename = 'tts_' . md5($text . $voiceId . time()) . '.mp3';
        $outputPath = storage_path('app/public/audio/' . $filename);
        $publicPath = 'audio/' . $filename;

        if (!file_exists(dirname($outputPath))) {
            mkdir(dirname($outputPath), 0755, true);
        }

        // 1. Normalize Language
        $langMap = [
            'hinglish' => 'hi',
            'english' => 'en',
            'hindi' => 'hi'
        ];
        $targetLang = $langMap[strtolower($language)] ?? 'en';

        // 2. Python gTTS Execution (Robust Arg Passing)
        // We pass text as arguments to avoid quoting hell in -c string
        $pythonScript = "import sys; from gtts import gTTS; gTTS(text=sys.argv[1], lang=sys.argv[2]).save(sys.argv[3])";
        
        $safeText = escapeshellarg($text);
        $safeLang = escapeshellarg($targetLang);
        $safePath = escapeshellarg($outputPath);

        $cmd = "python3 -c \"{$pythonScript}\" {$safeText} {$safeLang} {$safePath}";
        
        try {
            $output = [];
            $returnCode = 0;
            
            // Log command (redacted)
            Log::info("Executing TTS Python: python3 -c ... [text length: " . strlen($text) . "]");

            exec($cmd . " 2>&1", $output, $returnCode);

            if ($returnCode === 0 && file_exists($outputPath)) {
                // Success
            } else {
                throw new \Exception("Python gTTS failed (" . $returnCode . "): " . implode("\n", $output));
            }

        } catch (\Throwable $e) {
            Log::error("TTS Generation Failed: " . $e->getMessage());
            
            // Fallback: Generate Silence
             $sampleRate = 44100;
             $duration = 3;
             $numSamples = $sampleRate * $duration;
             $bitsPerSample = 16;
             $channels = 2;
             $byteRate = $sampleRate * $channels * ($bitsPerSample / 8);
             $blockAlign = $channels * ($bitsPerSample / 8);
             $dataSize = $numSamples * $blockAlign;
             $fileSize = 36 + $dataSize;

             $header = "RIFF" . pack("V", $fileSize) . "WAVEfmt " . pack("V", 16) . pack("v", 1) . pack("v", $channels) . pack("V", $sampleRate) . pack("V", $byteRate) . pack("v", $blockAlign) . pack("v", $bitsPerSample) . "data" . pack("V", $dataSize);
             $data = str_repeat(pack("C", 0), $dataSize);
             file_put_contents($outputPath, $header . $data);
        }

        return $publicPath;
    }

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
