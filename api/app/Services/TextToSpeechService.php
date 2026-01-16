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

        $mockSource = storage_path('app/public/music/viral_beat.mp3'); 
        if (file_exists($mockSource)) {
             copy($mockSource, $outputPath);
        } else {
             // Generate 3 Seconds of Dummy Audio (Silence)
             // Specs: 44.1kHz, 16-bit, Stereo
             $sampleRate = 44100;
             $duration = 3;
             $numSamples = $sampleRate * $duration;
             $bitsPerSample = 16;
             $channels = 2;
             $byteRate = $sampleRate * $channels * ($bitsPerSample / 8);
             $blockAlign = $channels * ($bitsPerSample / 8);
             $dataSize = $numSamples * $blockAlign;
             $fileSize = 36 + $dataSize;

             // WAV Header
             $header = "RIFF" . 
                       pack("V", $fileSize) . 
                       "WAVEfmt " . 
                       pack("V", 16) . // Subchunk1Size
                       pack("v", 1) .  // AudioFormat (PCM)
                       pack("v", $channels) . 
                       pack("V", $sampleRate) . 
                       pack("V", $byteRate) . 
                       pack("v", $blockAlign) . 
                       pack("v", $bitsPerSample) . 
                       "data" . 
                       pack("V", $dataSize);
             
             // Generate Empty Data (Silence)
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
