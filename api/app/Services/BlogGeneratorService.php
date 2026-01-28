<?php

namespace App\Services;

use App\Models\Blog;
use App\Models\PropertyMaster;
use Illuminate\Support\Str;
use Carbon\Carbon;

class BlogGeneratorService
{
    /**
     * Generate a blog post for a specific property.
     */
    public function generateForProperty($propertyId)
    {
        $property = PropertyMaster::with(['images', 'primaryImage'])->find($propertyId);

        if (!$property) {
            return ['error' => 'Property not found'];
        }

        $locationName = $property->CityName ?? $property->Location ?? 'Lonavala';
        $propType = strtolower($property->PropertyType ?? 'villa');

        // Define Unique Title based on Type
        if ($propType === 'waterpark') {
            $title = "Splashing Fun: Why {$property->Name} in {$locationName} is Mumbai's Best Kept Secret";
            $category = 'Weekend Guide';
        } else {
            $title = "The Ultimate Guide to Staying at {$property->Name} in {$locationName}";
            $category = 'Staycation';
        }

        $amenities = $this->extractAmenities($property);

        // --- DIFFERENT FROM OTHER WEBSITES: Insider Advice ---
        $insiderAdvice = $this->getInsiderAdvice($property, $propType, $locationName);

        // Advanced Template
        $content = "
            <h2>Discover {$property->Name}</h2>
            <p>" . ($propType === 'waterpark' ? "Escape the Mumbai heat at this premier destination." : "Experience a serene getaway away from the city bustle.") . " Located in the heart of <b>{$locationName}</b>, {$property->Name} is designed for those who seek " . ($propType === 'waterpark' ? "adventure and thrill" : "luxury and relaxation") . ".</p>
            
            <div class='expert-insight' style='background: #f8fafc; padding: 1.5rem; border-left: 4px solid #1e293b; margin: 2rem 0;'>
                <h4 style='margin-top: 0;'>💡 ResortWala Insider View</h4>
                <p>{$insiderAdvice}</p>
            </div>

            <h3>Key Features You'll Love</h3>
            <ul>
                " . implode('', array_map(fn($a) => "<li>{$a}</li>", $amenities)) . "
            </ul>

            <h3>Perfect for Families & Groups</h3>
            <p>With a capacity of up to <b>{$property->MaxCapacity} guests</b>, it's the ideal setting for " . ($propType === 'waterpark' ? "school picnics, corporate outings, or a fun day with friends" : "family reunions or private birthday celebrations") . ".</p>

            <h3>Pro-Tip for Your Visit</h3>
            <p>" . ($propType === 'waterpark' ? "Reach early to avoid the weekend queues and get the best spots near the wave pool!" : "Book at least 2 weeks in advance for weekends as this property is a guest favorite.") . "</p>
        ";

        // Generate detailed SEO tags
        $metaDesc = "Planning a trip to {$locationName}? Read our review of {$property->Name}. Features: " . implode(', ', array_slice($amenities, 0, 3)) . ". Book direct on ResortWala for best rates.";

        // Image Handling
        $coverImage = $property->getRawOriginal('ImageUrl');
        if (!$coverImage && $property->primaryImage) {
            $coverImage = $property->primaryImage->image_path;
        }

        // Create or Update Blog
        $slug = Str::slug($title);

        $blog = Blog::updateOrCreate(
            ['property_id' => $property->PropertyId],
            [
                'title' => $title,
                'slug' => $slug,
                'excerpt' => "Unbiased review and insider tips for {$property->Name} in {$locationName}. Don't book until you read this.",
                'content' => $content,
                'cover_image' => $coverImage,
                'author' => 'ResortWala Expert Team',
                'category' => $category,
                'published_at' => Carbon::now(),
                'tags' => [$locationName, ucfirst($propType), 'ResortWala Choice', 'Mumbai Getaways'],
                'meta_title' => $title,
                'meta_description' => $metaDesc,
                'location_id' => $property->LocationId ?? null
            ]
        );

        return $blog;
    }

    private function getInsiderAdvice($property, $type, $location)
    {
        if ($type === 'waterpark') {
            return "Unlike other crowded parks in Mumbai, {$property->Name} maintains high hygiene standards and offers a more 'private' feel. It's often overlooked by tourists, making it a hidden gem for locals in Virar/Thane.";
        }

        if (stripos($location, 'Lonavala') !== false) {
            return "While most Lonavala villas are generic, {$property->Name} stands out for its " . ($property->NoofRooms > 5 ? "massive terrace space" : "hidden garden corner") . ". It's situated away from the main highway noise, ensuring peaceful nights.";
        }

        return "We've personally vetted this property. The USP here is the personalized service from the staff, which you won't find in larger, commercial resorts.";
    }

    private function extractAmenities($property)
    {
        $list = [];
        if (strtolower($property->PropertyType) === 'waterpark') {
            $list[] = 'Thrilling Water Slides';
            $list[] = 'Wave Pool';
            $list[] = 'Kids Play Area';
        } else {
            $list[] = 'Private Swimming Pool';
            $list[] = 'Equipped Kitchen';
            $list[] = "{$property->NoofRooms} Spacious Bedrooms";
        }

        $list[] = 'Ample Parking Space';
        $list[] = 'Caretaker on Site';

        return $list;
    }

    /**
     * Bulk Generate for Top Properties
     */
    public function generateBulk($limit = 10, $location = null)
    {
        $query = PropertyMaster::where('IsActive', 1);

        if ($location) {
            $query->where('Location', 'like', "%{$location}%");
        }

        $properties = $query->take($limit)->get();
        $results = [];
        foreach ($properties as $prop) {
            $results[] = $this->generateForProperty($prop->PropertyId);
        }
        return $results;
    }
}
