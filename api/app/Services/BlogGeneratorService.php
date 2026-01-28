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

        $locationName = $property->CityName ?? 'Lonavala';
        $amenities = $this->extractAmenities($property);
        $title = "Why {$property->Name} is the Best Villa in {$locationName} for Your Next Getaway";

        // AI-Mocking Logic: Template Construction
        $content = "
            <h2>Experience Luxury at {$property->Name}</h2>
            <p>{$property->Name} offers a unique blend of comfort and style in the heart of {$locationName}. Whether you are looking for a weekend retreat or a corporate offsite, this property has it all.</p>
            
            <h3>Top Amenities</h3>
            <ul>
                " . implode('', array_map(fn($a) => "<li>{$a}</li>", $amenities)) . "
            </ul>

            <h3>Perfect for Families & Groups</h3>
            <p>With an occupancy of {$property->Occupancy} guests and {$property->NoofRooms} bedrooms, it is spacious enough for your entire group.</p>

            <h3>Location Highlights</h3>
            <p>Located near key attractions in {$locationName}, you can easily explore the local culture and scenic beauty.</p>
        ";

        // Generate detailed SEO tags
        $metaDesc = "Stay at {$property->Name} in {$locationName}. Features {$property->NoofRooms} BHK, Pool, and more. constant maintenance ensures a premium experience. Book now on ResortWala.";

        // Image Handling (Store RELATIVE path, not full URL)
        $coverImage = $property->getRawOriginal('ImageUrl');

        if (!$coverImage) {
            $primary = $property->primaryImage;
            if ($primary) {
                // PropertyImage model has 'image_path' column
                $coverImage = $primary->image_path;
            }
        }

        // Final fallback if still null (though generator shouldn't fail)
        // Ensure we don't save a full URL unless it really is external
        if ($coverImage && str_starts_with($coverImage, 'http')) {
            // Leave as is
        }

        // Create or Update Blog
        $slug = Str::slug($title);

        $blog = Blog::updateOrCreate(
            ['property_id' => $property->PropertyId],
            [
                'title' => $title,
                'slug' => $slug,
                'excerpt' => "Discover {$property->Name}, a top-rated villa in {$locationName} with pool and modern amenities.",
                'content' => $content,
                'cover_image' => $coverImage,
                'author' => 'ResortWala AI',
                'category' => 'Property Review',
                'published_at' => Carbon::now(),
                'tags' => [$locationName, 'Villa', 'Luxury', $property->PropertyType],
                'meta_title' => $title,
                'meta_description' => $metaDesc,
                'location_id' => null // Todo: Link to LocationID
            ]
        );

        return $blog;
    }

    private function extractAmenities($property)
    {
        // Simple extraction based on fields or text
        $list = [];
        if ($property->isWaterpark())
            $list[] = 'Waterpark Access';
        if ($property->NoofBathRooms > 0)
            $list[] = "{$property->NoofBathRooms} Bathrooms";
        // Mocking some common ones as we don't have a rigid attribute amenities table yet in this context
        $list[] = 'Private Pool';
        $list[] = 'Free Wi-Fi';
        $list[] = 'Parking';
        return $list;
    }

    /**
     * Bulk Generate for Top Properties
     */
    public function generateBulk($limit = 5)
    {
        $properties = PropertyMaster::where('IsActive', 1)->take($limit)->get();
        $results = [];
        foreach ($properties as $prop) {
            $results[] = $this->generateForProperty($prop->PropertyId);
        }
        return $results;
    }
}
