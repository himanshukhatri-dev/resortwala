<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\PropertyImage;
use Illuminate\Support\Str;

class FixImagePaths extends Command
{
    protected $signature = 'fix:image-paths';
    protected $description = 'Fix image paths in database to consistent format';

    public function handle()
    {
        $this->info('Starting Image Path Fix...');
        $this->fixPropertyImages();
        $this->info('Image Path Fix Completed.');
    }

    private function fixPropertyImages()
    {
        $images = PropertyImage::all();
        $bar = $this->output->createProgressBar($images->count());
        $this->info("\nFixing Property Images...");

        foreach ($images as $img) {
            $original = $img->image_path;
            $updated = false;
            
            if (empty($original)) continue;

            $newPath = $original;

            // Remove full URL if present (e.g. http://localhost/storage/...)
            if (Str::startsWith($newPath, 'http')) {
                // If it's a localhost/staging URL, try to strip it.
                // If it's specific bucket URL, maybe keep it?
                // For now, assume we want relative paths for local storage
                if (Str::contains($newPath, '/storage/')) {
                    $parts = explode('/storage/', $newPath);
                    if (count($parts) > 1) {
                        $newPath = 'storage/' . $parts[1];
                    }
                }
            }

            // Remove 'public/' prefix
            if (Str::startsWith($newPath, 'public/')) {
                $newPath = Str::replaceFirst('public/', '', $newPath);
            }
            
            // Fix double storage (storage/storage)
            if (Str::startsWith($newPath, 'storage/storage/')) {
                 $newPath = Str::replaceFirst('storage/storage/', 'storage/', $newPath);
            }

            if ($newPath !== $original) {
                $img->image_path = $newPath;
                $img->save();
                $updated = true;
            }

            $bar->advance();
        }
        $bar->finish();
    }
}
