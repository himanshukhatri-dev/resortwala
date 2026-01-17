<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AIPromptContextService
{
    /**
     * Analyze a prompt to generate video context.
     * 
     * @param string $prompt User's raw text prompt
     * @param string $mood Optional mood override
     * @return array Structured data for video generation
     */
    public function analyzePrompt(string $prompt, string $mood = 'energetic'): array
    {
        // TODO: Integrate with Actual LLM (OpenAI/Gemini) if API key available.
        // For now, we use a robust Heuristic Engine + Mock response pattern.
        
        $keywords = $this->extractKeywords($prompt);
        
        // 1. Generate Script
        $script = $this->generateScript($prompt, $mood);
        
        // 2. Determine Visual Theme
        // If "luxury", "villa" -> 'luxury_hotel', 'pool'
        // If "party", "goa" -> 'nightlife', 'party'
        $visualTheme = $this->detectTheme($prompt);
        
        // 3. Select Music Mood
        $musicMood = $mood;

        return [
            'script' => $script,
            'visual_theme' => $visualTheme,
            'music_mood' => $musicMood,
            'keywords' => $keywords
        ];
    }

    private function extractKeywords($text)
    {
        // Simple extraction
        $stopWords = ['the', 'is', 'at', 'which', 'on', 'in', 'a', 'an', 'and', 'or', 'for', 'with', 'best', 'create', 'video'];
        $words = explode(' ', strtolower(preg_replace('/[^a-zA-Z0-9 ]/', '', $text)));
        return array_values(array_diff($words, $stopWords));
    }

    private function detectTheme($prompt)
    {
        $prompt = strtolower($prompt);
        if (str_contains($prompt, 'party') || str_contains($prompt, 'fun')) return 'party';
        if (str_contains($prompt, 'relax') || str_contains($prompt, 'calm')) return 'nature';
        if (str_contains($prompt, 'luxury') || str_contains($prompt, 'premium')) return 'luxury';
        return 'travel'; // default
    }

    private function generateScript($prompt, $mood)
    {
        // Template-based generation
        // Real implementation should call OpenAI.
        
        $intro = "Looking for the perfect getaway? ";
        if (str_contains(strtolower($prompt), 'villa')) $intro = "Discover the ultimate luxury villa experience. ";
        
        $body = "Experience unmatched comfort and style. Unwind in paradise.";
        if ($mood === 'energetic') $body = "Get ready for the time of your life! Non-stop fun and adventure awaits.";
        
        $cta = "Book now on ResortWala.com.";

        return "{$intro} {$body} {$cta}";
    }
}
