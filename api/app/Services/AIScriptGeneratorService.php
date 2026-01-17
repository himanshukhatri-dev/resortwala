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
        $city = $property->city ?? 'Natural Paradise';
        $location = $property->location_name ?? $city;
        $name = $property->name;
        $price = $property->starting_price ? "starting at just ₹{$property->starting_price}" : "at best rates";
        
        // Extract key amenities (Limit to 3)
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
        // Logic to parse JSON amenities or relationships
        // Fallback or rudimentary parsing
        $list = [];
        // Assuming amenities might be in a 'facilities' column or similar, defaulting here
        // If property has `amenities` json column:
        if (!empty($property->amenities) && is_array($property->amenities)) {
            $list = array_slice($property->amenities, 0, 3);
        }
        
        if (empty($list)) {
            $list = ['Swimming Pool', 'Spacious Rooms', 'Garden View'];
        }
        
        return $list;
    }
}
