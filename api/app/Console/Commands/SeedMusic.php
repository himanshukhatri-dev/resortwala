<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class SeedMusic extends Command
{
    protected $signature = 'music:seed';
    protected $description = 'Download sample music files for Video Generator';

    public function handle()
    {
        $this->info("Seeding Music Library...");

        // Ensure directory exists
        $path = storage_path('app/public/music');
        if (!File::exists($path)) {
            File::makeDirectory($path, 0755, true);
            $this->info("Created directory: $path");
        }

        // Sample Files (Using reliable creative commons sources or placeholders)
        // Since we don't have real URLs, we will creating simple test tones/melodies if possible 
        // OR ask the user to replace them. 
        // Ideally we fetch from a public URL. 
        // Let's use some placeholder URLs from a reliable source like GitHub or a public test mix.
        // For now, I'll use a placeholder URL service or warn the user.
        
        $tracks = [
            'luxury_ambient.mp3' => 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // 6min test file
            'upbeat_pop.mp3' => 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3',
            'happy_acoustic.mp3' => 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
            'viral_beat.mp3' => 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
        ];

        foreach ($tracks as $name => $url) {
            $filePath = $path . '/' . $name;
            if (File::exists($filePath)) {
                $this->info("Running check for $name... Exists.");
                continue;
            }

            $this->info("Downloading $name...");
            try {
                $content = file_get_contents($url);
                if ($content) {
                    file_put_contents($filePath, $content);
                    $this->info("Downloaded $name successfully.");
                } else {
                    $this->error("Failed to download $name");
                }
            } catch (\Exception $e) {
                $this->error("Error downloading $name: " . $e->getMessage());
            }
        }

        $this->info("Music Seeding Completed.");
        return 0;
    }
}
