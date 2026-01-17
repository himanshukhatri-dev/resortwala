<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class StockAssetService
{
    private $pexelsKey;

    public function __construct()
    {
        // Use environment variable or fallback to a demo key (limited)
        // Ideally user should provide this in .env
        $this->pexelsKey = env('PEXELS_API_KEY', '563492ad6f91700001000001y10s0d9g9g8a6f5j4k3l2z1x'); // Placeholders
    }

    /**
     * Search for stock media based on keyword
     * @param string $keyword
     * @param int $count
     * @param string $orientation 'portrait' (9:16) or 'square' (1:1)
     * @return array List of local file paths
     */
    public function getVisuals($keyword, $count, $orientation = 'portrait')
    {
        $media = $this->searchPexels($keyword, $count, $orientation);
        
        if (empty($media)) {
             // Fallback to Abstract if no internet/results
             return $this->generateAbstracts($keyword, $count);
        }

        return $media;
    }

    private function searchPexels($query, $count, $orientation)
    {
        $apiKey = env('PEXELS_API_KEY');
        if (empty($apiKey)) return [];

        try {
            // Pexels API: Search Photos
            $url = "https://api.pexels.com/v1/search";
            $response = Http::withHeaders([
                'Authorization' => $apiKey
            ])->get($url, [
                'query' => $query,
                'per_page' => $count,
                'orientation' => $orientation === 'portrait' ? 'portrait' : 'square',
                'size' => 'medium'
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $paths = [];
                
                if (empty($data['photos'])) return [];

                foreach ($data['photos'] as $photo) {
                    $imgUrl = $photo['src']['large2x'] ?? $photo['src']['large'];
                    $paths[] = $this->downloadAsset($imgUrl);
                }
                return $paths;
            }
        } catch (\Exception $e) {
            Log::error("Pexels Search Failed: " . $e->getMessage());
        }
        return [];
    }

    private function downloadAsset($url)
    {
        $contents = file_get_contents($url);
        $name = 'stock_' . md5($url) . '.jpg';
        $path = storage_path('app/public/stock/' . $name);
        
        if (!file_exists(dirname($path))) mkdir(dirname($path), 0755, true);
        
        file_put_contents($path, $contents);
        return $path;
    }

    private function generateAbstracts($theme, $count)
    {
        // Use FFmpeg to generate advanced fractal/noise visuals
        // Storing them in temp
        $dir = storage_path('app/public/stock/generated');
        if (!file_exists($dir)) mkdir($dir, 0755, true);

        $paths = [];
        for ($i = 0; $i < $count; $i++) {
            $path = $dir . "/gen_{$theme}_{$i}.mp4";
            
            // Generate 3 sec clip
            // mandelbrot, life, cellauto, gradients
            $filters = [
                "testsrc=size=720x1280:rate=30,drawtext=text='{$theme}':fontcolor=white:fontsize=50:x=(w-text_w)/2:y=(h-text_h)/2", // Debug Text
                "mandelbrot=size=720x1280:rate=30:start_scale=1.5:end_scale=1.2",
                "color=c=black:s=720x1280,geq=r='X/W*255':g='(1-Y/H)*255':b='(X+Y)/2'" // Gradient
            ];
            
            $f = $filters[$i % count($filters)];

            // Use exec to generate
             exec("ffmpeg -y -f lavfi -i \"{$f}\" -t 3 -c:v libx264 -pix_fmt yuv420p \"{$path}\" 2>&1"); // Generating video clips now
            
            if (file_exists($path)) $paths[] = $path;
        }
        return $paths;
    }
}
