<?php

namespace App\Services\Intelligence;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GooglePlacesService
{
    protected $apiKey;
    protected $baseUrl = 'https://maps.googleapis.com/maps/api/place';

    public function __construct()
    {
        $this->apiKey = config('services.google.places_api_key');
    }

    /**
     * Search for places (Text Search)
     */
    public function search(string $query, $pageToken = null)
    {
        $url = "{$this->baseUrl}/textsearch/json";
        
        $params = [
            'query' => $query,
            'key' => $this->apiKey,
        ];

        if ($pageToken) {
            $params['pagetoken'] = $pageToken;
        }

        return $this->execute($url, $params);
    }

    /**
     * Get Place Details (Phone, Website check)
     */
    public function getDetails(string $placeId)
    {
        $url = "{$this->baseUrl}/details/json";
        
        $params = [
            'place_id' => $placeId,
            'fields' => 'name,formatted_address,geometry,formatted_phone_number,international_phone_number,website,rating,user_ratings_total,url,types',
            'key' => $this->apiKey,
        ];

        return $this->execute($url, $params);
    }

    private function execute($url, $params)
    {
        // Mock Mode if Key is missing or explicitly set to mock
        if (!$this->apiKey || config('services.google.places_mock', false)) {
            Log::info("Google Places: Running in MOCK mode for " . $url);
            return $this->getMockResponse($url, $params);
        }

        try {
            $response = Http::get($url, $params);
            
            if ($response->successful()) {
                return $response->json();
            } else {
                Log::error("Google API Error: " . $response->body());
                return ['status' => 'api_error', 'message' => $response->body()];
            }
        } catch (\Exception $e) {
            Log::error("Google API Exception: " . $e->getMessage());
            return ['status' => 'exception', 'message' => $e->getMessage()];
        }
    }

    private function getMockResponse($url, $params)
    {
        $city = $params['query'] ?? 'Unknown City';
        if (strpos($url, 'details') !== false) {
            // Details Mock
            return [
                'result' => [
                    'place_id' => $params['place_id'],
                    'name' => 'Mock Resort ' . rand(100, 999),
                    'formatted_address' => '123 Mock Lane, ' . $city,
                    'formatted_phone_number' => '9198765432' . rand(10, 99),
                    'international_phone_number' => '+91 98765 432' . rand(10, 99),
                    'website' => 'https://mock-resort-' . rand(100, 999) . '.com',
                    'rating' => 4.5,
                    'user_ratings_total' => rand(50, 500),
                    'url' => 'https://maps.google.com/?q=mock',
                    'types' => ['lodging', 'resort', 'point_of_interest'],
                    'geometry' => [
                        'location' => ['lat' => 18.5204, 'lng' => 73.8567]
                    ]
                ],
                'status' => 'OK'
            ];
        } else {
            // Text Search Mock
            $results = [];
            for ($i = 0; $i < 5; $i++) {
                $results[] = [
                    'place_id' => 'mock_place_' . uniqid(),
                    'name' => 'Mock Resort ' . $i . ' in ' . $city,
                    'formatted_address' => 'Near Hill Top, ' . $city,
                    'rating' => 4.0 + ($i * 0.1),
                    'user_ratings_total' => rand(10, 100),
                    'geometry' => [
                        'location' => ['lat' => 18.5204 + ($i * 0.01), 'lng' => 73.8567 + ($i * 0.01)]
                    ],
                    'types' => ['lodging', 'resort']
                ];
            }
            return [
                'results' => $results,
                'status' => 'OK',
                // 'next_page_token' => null // Uncomment to test pagination if needed
            ];
        }
    }
}
