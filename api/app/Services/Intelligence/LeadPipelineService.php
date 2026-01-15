<?php

namespace App\Services\Intelligence;

use App\Models\VendorLead;
use App\Models\CrawlJob;
use Illuminate\Support\Facades\Log;

class LeadPipelineService
{
    protected $googleService;

    public function __construct(GooglePlacesService $googleService)
    {
        $this->googleService = $googleService;
    }

    public function runCrawler(CrawlJob $job, $limit = 60)
    {
        $job->status = 'running';
        $job->started_at = now();
        $job->save();

        try {
            // Use Job specific category if available, else standard list
            $keywords = $job->category ? [$job->category] : ['Resort', 'Villa', 'Farm Stay', 'Hotel']; 
            
            $totalAdded = 0;
            $dupCount = 0;
            $errCount = 0;
            $totalFound = 0;

            foreach ($keywords as $keyword) {
                if ($totalAdded >= $limit) break; 

                $query = "{$keyword} in {$job->city}";
                $nextPageToken = null;
                
                for ($i = 0; $i < 3; $i++) {
                    if ($totalAdded >= $limit) break; 

                    try {
                        $response = $this->googleService->search($query, $nextPageToken);
                    } catch (\Exception $e) {
                         Log::error("Google API Error: " . $e->getMessage());
                         $errCount++;
                         continue;
                    }
                    
                    if (!isset($response['results'])) break;
                    
                    $results = $response['results'];
                    $totalFound += count($results);

                    foreach ($results as $result) {
                        if ($totalAdded >= $limit) break;

                        if ($this->processLead($result, $job->city, $job->category)) {
                            $totalAdded++;
                        } else {
                            $dupCount++;
                        }
                    }

                    if (isset($response['next_page_token']) && $totalAdded < $limit) {
                        $nextPageToken = $response['next_page_token'];
                        sleep(2); 
                    } else {
                        break;
                    }
                }
            }

            $job->status = 'completed';
            $job->leads_found = $totalFound;
            $job->leads_added = $totalAdded; // AKA new_leads_count in this context
            $job->new_leads_count = $totalAdded;
            $job->duplicate_leads_count = $dupCount;
            $job->error_count = $errCount;
            $job->completed_at = now();
            $job->save();

        } catch (\Exception $e) {
            $job->status = 'failed';
            $job->error_message = $e->getMessage();
            $job->save();
            Log::error("Crawler Job Failed: " . $e->getMessage());
        }
    }
    
    private function processLead($placeData, $city, $category = null)
    {
        // 1. Check Deduplication (Place ID)
        if (!isset($placeData['place_id'])) {
            Log::warning("LeadCrawler: Result missing place_id", ['data' => $placeData]);
            return false;
        }

        if (VendorLead::where('source_id', $placeData['place_id'])->exists()) {
            return false;
        }

        // 2. Fetch Details (for Phone Number/Website) - OPTIONAL optimization
        // To save money, we might rely on basic search data first. 
        // TextSearch often returns formatted_address. 
        // Details API is needed for Website & Phone usually.
        // Let's call details for high rated ones only? Or all?
        // For now, let's assuming we want high quality, so we fetch details.
        
        $details = $this->googleService->getDetails($placeData['place_id']);
        $data = $details['result'] ?? $placeData;

        if (!isset($data['place_id'])) {
             $data['place_id'] = $placeData['place_id']; // Fallback assurance
        }

        // 3. Normalization
        $phone = $data['formatted_phone_number'] ?? null;
        $normalizedPhone = $this->normalizePhone($phone);

        // Dedupe by Phone
        if ($normalizedPhone && VendorLead::where('phone', $normalizedPhone)->exists()) {
            return false;
        }

        // 4. Save
        VendorLead::create([
            'name' => $data['name'],
            'source' => 'google',
            'source_id' => $data['place_id'],
            'phone' => $normalizedPhone, // storing normalized for index
            'email' => null, // Google API rarely gives email
            'website' => $data['website'] ?? null,
            'google_maps_link' => $data['url'] ?? null,
            'latitude' => $data['geometry']['location']['lat'] ?? null,
            'longitude' => $data['geometry']['location']['lng'] ?? null,
            'city' => $city,
            'address' => $data['formatted_address'] ?? null,
            'rating' => $data['rating'] ?? 0,
            'review_count' => $data['user_ratings_total'] ?? 0,
            'category' => $category ?? (isset($data['types']) ? implode(',', array_slice($data['types'], 0, 3)) : null),
            'raw_data' => $data,
            'status' => 'new',
            'confidence_score' => ($data['rating'] ?? 0) * 10 + (isset($data['website']) ? 20 : 0) // Simple score
        ]);

        return true;
    }

    private function normalizePhone($phone)
    {
        if (!$phone) return null;
        // Strip non-digits
        $digits = preg_replace('/\D/', '', $phone);
        // Basic India logic
        if (strlen($digits) > 10 && substr($digits, 0, 2) == '91') {
            return substr($digits, -10);
        }
        return $digits;
    }
}
