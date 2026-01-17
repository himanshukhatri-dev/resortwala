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
    public function generateScript(PropertyMaster $property, string $vibe = 'luxury'): string
    {
        // Fix field mapping based on PropertyMaster.php
        $city = $property->CityName ?? 'Goa';
        $location = $property->Location ?? $city;
        $name = $property->Name ?? 'Our Premium Villa';
        
        // Price Logic
        $priceVal = $property->DealPrice > 0 ? $property->DealPrice : $property->Price;
        $price = $priceVal ? "starting at just ₹{$priceVal}" : "at best rates";
        
        // Extract key amenities
        $amenities = $this->getTopAmenities($property);
        $amenityText = implode(', ', $amenities);

        // Templates based on Vibe
        if ($vibe === 'party') {
            return $this->partyTemplate($name, $location, $amenityText, $price);
        } elseif ($vibe === 'family') {
            return $this->familyTemplate($name, $location, $amenityText, $price);
        } else {
            return $this->luxuryTemplate($name, $location, $amenityText, $price);
        }
    }

    private function luxuryTemplate($name, $location, $amenities, $price)
    {
        // ~90 words
        $lines = [
            "Welcome to {$name}, your ultimate luxury escape in {$location}.",
            "Agar aap ek peaceful aur royal experience dhoond rahe hain, toh yeh jagah perfect hai.",
            "Enjoy world-class amenities like {$amenities}, designed for your comfort.",
            "Yahan ka nazara aur hospitality aapka dil jeet lega.",
            "Book your stay now {$price} and experience magic.",
            "Visit resortwala.com to book today!"
        ];
        return implode(" ", $lines);
    }

    private function partyTemplate($name, $location, $amenities, $price)
    {
        $lines = [
            "Get ready for the ultimate party vibe at {$name} in {$location}!",
            "Dosto ke sath full masti aur fun ke liye isse behtar jagah nahi milegi.",
            "With {$amenities} and an electric atmosphere, the party never stops.",
            "Weekend set karna hai? Toh aaj hi plan banao.",
            "Grab this deal {$price}. Book now on Resortwala!"
        ];
        return implode(" ", $lines);
    }

    private function familyTemplate($name, $location, $amenities, $price)
    {
        $lines = [
            "Planning a family trip? {$name} in {$location} is the perfect choice.",
            "Ek safe, hygienic aur comfortable stay jahan sab enjoy karein.",
            "Kids will love the {$amenities} while you relax in nature.",
            "Apni family ke sath quality time bitane ka best mauka.",
            "Packages {$price}. Book your happiness now at resortwala.com."
        ];
        return implode(" ", $lines);
    }

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
        
        if (stripos($desc, 'pool') !== false) $list[] = 'Private Pool';
        if (stripos($desc, 'wifi') !== false) $list[] = 'High-Speed WiFi';
        if (stripos($desc, 'lawn') !== false || stripos($desc, 'garden') !== false) $list[] = 'Lush Garden';
        if (stripos($desc, 'beach') !== false) $list[] = 'Beach Access';
        if (stripos($desc, 'cook') !== false || stripos($desc, 'chef') !== false) $list[] = 'Private Chef';
        if (stripos($desc, 'parking') !== false) $list[] = 'Secure Parking';
        if (stripos($desc, 'jacuzzi') !== false) $list[] = 'Jacuzzi';

        // 3. Fallback based on Rooms
        if (count($list) < 3) {
            $rooms = $property->NoofRooms ?? 3;
            $list[] = "{$rooms} Spacious Bedrooms";
            $list[] = "Luxury Interiors";
            $list[] = "Scenic Views";
        }
        
        return array_slice(array_unique($list), 0, 3);
    }
    /**
     * Generate script solely from a Text Prompt (No Property Object).
     */
    public function generateFromPrompt(string $prompt, string $mood = 'energetic'): string
    {
        // 1. Extract Location (Simple Heuristic for now)
        $location = 'India';
        if (stripos($prompt, 'Goa') !== false) $location = 'Goa';
        if (stripos($prompt, 'Mumbai') !== false) $location = 'Mumbai';
        if (stripos($prompt, 'Lonavala') !== false) $location = 'Lonavala';
        if (stripos($prompt, 'Manali') !== false) $location = 'Manali';
        
        // 2. Extract Keywords for Context
        $keywords = [];
        if (stripos($prompt, 'pool') !== false) $keywords[] = 'Private Pool';
        if (stripos($prompt, 'party') !== false) $keywords[] = 'Party Vibes';
        if (stripos($prompt, 'luxury') !== false) $keywords[] = 'Luxury Stay';
        if (stripos($prompt, 'couple') !== false) $keywords[] = 'Romantic Gateway';
        
        $context = empty($keywords) ? "Beautiful Stays" : implode(", ", $keywords);
        
        // 3. Generate based on Mood
        // We reuse the Templates but with generic names
        $name = "ResortWala Premium Stays";
        
        if ($mood === 'party') {
             return $this->partyTemplate($name, $location, $context, "at best offers");
        } elseif ($mood === 'luxury') {
             return $this->luxuryTemplate($name, $location, $context, "starting @ ₹4999");
        } else {
             // Generic / Travel
             return "Discover the best stays in {$location} with ResortWala. {$context} ka mazaa lijiye. Book your perfect getaway today at resortwala.com. Best prices guaranteed!";
        }
    }
}
