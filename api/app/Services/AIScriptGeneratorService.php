<?php

namespace App\Services;

use App\Models\PropertyMaster;
use Illuminate\Support\Str;

class AIScriptGeneratorService
{
    /**
     * Generate a bilingual (Hinglish) script optimized for <40s social videos.
     * 
     * Structure:
     * 1. Hook (English)
     * 2. Vibe/Location (Hindi)
     * 3. Amenities (English)
     * 4. CTA (Hindi/English Mix)
     * 
     * Target: 90-110 words.
     */
    /**
     * Generate structured script data for Video Engine 2.0 (Scenes)
     */
    public function generateScriptData(PropertyMaster $property, string $vibe = 'luxury'): array
    {
        $city = $property->CityName ?? 'Goa';
        $location = $property->Location ?? $city;
        $name = $property->Name ?? 'Our Premium Villa';
        $priceVal = $property->DealPrice > 0 ? $property->DealPrice : $property->Price;
        $price = $priceVal ? "starting at just ₹{$priceVal}" : "at best rates";
        $amenities = $this->getTopAmenities($property);
        $amenityText = implode(', ', $amenities);

        // Get Scenes
        if ($vibe === 'party') {
            return $this->partyScenes($name, $location, $amenityText, $price);
        } elseif ($vibe === 'family') {
            return $this->familyScenes($name, $location, $amenityText, $price);
        } else {
            return $this->luxuryScenes($name, $location, $amenityText, $price);
        }
    }

    /* Legacy String Wrapper */
    public function generateScript(PropertyMaster $property, string $vibe = 'luxury'): string
    {
        $data = $this->generateScriptData($property, $vibe);
        return implode(" ", array_column($data['scenes'], 'text'));
    }

    /* Scene Templates */
    private function luxuryScenes($name, $location, $amenities, $price)
    {
        return [
            'theme' => 'luxury',
            'bg_music' => 'luxury_ambient.mp3',
            'scenes' => [
                ['type' => 'hook', 'duration' => 3, 'text' => "Welcome to {$name}, in {$location}.", 'visual' => 'hero_shot'],
                ['type' => 'emotion', 'duration' => 4, 'text' => "Agar aap ek peaceful aur royal experience dhoond rahe hain...", 'visual' => 'slow_pan'],
                ['type' => 'feature', 'duration' => 4, 'text' => "Enjoy world-class amenities like {$amenities}.", 'visual' => 'feature_grid'],
                ['type' => 'feature', 'duration' => 3, 'text' => "Yahan ka nazara aapka dil jeet lega.", 'visual' => 'drone_view'],
                ['type' => 'cta', 'duration' => 4, 'text' => "Book now {$price} at resortwala.com!", 'visual' => 'logo_reveal']
            ]
        ];
    }

    private function partyScenes($name, $location, $amenities, $price)
    {
        return [
            'theme' => 'party',
            'bg_music' => 'viral_beat.mp3',
            'scenes' => [
                ['type' => 'hook', 'duration' => 3, 'text' => "Party lovers! Check out {$name} in {$location}!", 'visual' => 'fast_cuts'],
                ['type' => 'emotion', 'duration' => 4, 'text' => "Dosto ke sath full masti aur fun ke liye best jagah.", 'visual' => 'party_video'],
                ['type' => 'feature', 'duration' => 4, 'text' => "With {$amenities}, the party never stops!", 'visual' => 'pool_shot'],
                ['type' => 'cta', 'duration' => 4, 'text' => "Grab this deal {$price}. Book on Resortwala!", 'visual' => 'logo_reveal']
            ]
        ];
    }

    private function familyScenes($name, $location, $amenities, $price)
    {
        return [
            'theme' => 'family',
            'bg_music' => 'happy_acoustic.mp3',
            'scenes' => [
                ['type' => 'hook', 'duration' => 3, 'text' => "Planning a family trip? Visit {$name} in {$location}.", 'visual' => 'hero_shot'],
                ['type' => 'emotion', 'duration' => 4, 'text' => "Ek safe, hygienic aur comfortable stay sabke liye.", 'visual' => 'garden_view'],
                ['type' => 'feature', 'duration' => 4, 'text' => "Kids will love the {$amenities}.", 'visual' => 'amenity_highlight'],
                ['type' => 'cta', 'duration' => 4, 'text' => "Book your happiness now {$price} at resortwala.com.", 'visual' => 'logo_reveal']
            ]
        ];
    }

    // ... (keep getTopAmenities)

    private function getTopAmenities(PropertyMaster $property)
    {
        $list = [];
        
        // 1. Check Addons (if loaded)
        if ($property->relationLoaded('addons')) {
             foreach($property->addons as $addon) {
                 $list[] = $addon->name;
             }
        }

        // 2. Parse Description or Offers if empty/few
        // Merge offers and description for keyword search
        $desc = ($property->PropertyOffersDetails ?? '') . ' ' . ($property->LongDescription ?? '');
        
        if (stripos($desc, 'pool') !== false) $list[] = 'Pool';
        if (stripos($desc, 'wifi') !== false) $list[] = 'WiFi';
        if (stripos($desc, 'lawn') !== false || stripos($desc, 'garden') !== false) $list[] = 'Garden';
        if (stripos($desc, 'beach') !== false) $list[] = 'Beach';
        if (stripos($desc, 'cook') !== false || stripos($desc, 'chef') !== false) $list[] = 'Chef';
        if (stripos($desc, 'jacuzzi') !== false) $list[] = 'Jacuzzi';

        // 3. Fallback based on Rooms
        if (count($list) < 3) {
            $rooms = $property->NoofRooms ?? 3;
            $list[] = "{$rooms} BHK";
            $list[] = "Luxury";
            $list[] = "Views";
        }
        
        return array_slice(array_unique($list), 0, 3);
    }
    
    /**
     * Generate structured script from PROMPT (for Prompt Studio)
     */
    public function generateFromPromptData(string $prompt, string $mood = 'energetic'): array
    {
        // 1. Extract Location
        $location = 'India';
        if (stripos($prompt, 'Goa') !== false) $location = 'Goa';
        if (stripos($prompt, 'Mumbai') !== false) $location = 'Mumbai';
        if (stripos($prompt, 'Lonavala') !== false) $location = 'Lonavala';
        if (stripos($prompt, 'Manali') !== false) $location = 'Manali';
        
        // 2. Context
        $keywords = [];
        if (stripos($prompt, 'pool') !== false) $keywords[] = 'Private Pool';
        if (stripos($prompt, 'party') !== false) $keywords[] = 'Party Vibes';
        if (stripos($prompt, 'luxury') !== false) $keywords[] = 'Luxury';
        if (stripos($prompt, 'couple') !== false) $keywords[] = 'Romantic';
        $context = empty($keywords) ? "Beautiful Stays" : implode(", ", $keywords);
        
        // 3. Map to Scenes
        $name = "ResortWala Stays";
        
        if ($mood === 'party') {
             return $this->partyScenes($name, $location, $context, "at best offers");
        } elseif ($mood === 'luxury') {
             return $this->luxuryScenes($name, $location, $context, "starting @ ₹4999");
        } else {
             // Generic Scenes
             return [
                'theme' => 'minimal',
                'bg_music' => 'upbeat_pop.mp3',
                'scenes' => [
                    ['type' => 'hook', 'duration' => 3, 'text' => "Discover the best stays in {$location}!", 'visual' => 'hero_shot'],
                    ['type' => 'feature', 'duration' => 4, 'text' => "Experience {$context} like never before.", 'visual' => 'feature_grid'],
                    ['type' => 'emotion', 'duration' => 4, 'text' => "Comfort, Vibe, aur Masti ek hi jagah.", 'visual' => 'slow_pan'],
                    ['type' => 'cta', 'duration' => 5, 'text' => "Book now at resortwala.com!", 'visual' => 'logo_reveal']
                ]
            ];
        }
    }
    
    // Legacy Prompt Wrapper
    public function generateFromPrompt(string $prompt, string $mood = 'energetic'): string
    {
        $data = $this->generateFromPromptData($prompt, $mood);
        return implode(" ", array_column($data['scenes'], 'text'));
    }
}
