<?php

namespace App\Jobs;

use App\Models\BulkUpload;
use App\Models\BulkUploadEntry;
use App\Models\PropertyMaster;
use App\Models\PropertyImage;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImportBulkProperties implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $bulkUpload;

    public function __construct(BulkUpload $bulkUpload)
    {
        $this->bulkUpload = $bulkUpload;
    }

    public function handle()
    {
        $this->bulkUpload->update(['status' => 'IMPORTING']);
        
        $entries = $this->bulkUpload->entries()->where('status', 'VALID')->get();
        
        foreach ($entries as $entry) {
            try {
                $data = json_decode($entry->data, true);
                
                // 1. Create Property Master
                // MAPPING CORRECTION: Using DB Columns (Capitalized)
                $property = PropertyMaster::create([
                    'vendor_id' => $data['vendor_id'],
                    'Name' => $data['property_name'],
                    // 'slug' => Str::slug($data['property_name']), // No slug column in fillable
                    'PropertyType' => $data['property_type'],
                    'ShortDescription' => $data['description'] ?? 'Imported via Bulk Upload',
                    'LongDescription' => $data['description'] ?? 'Imported via Bulk Upload',
                    'CityName' => $data['city'],
                    'Location' => $data['city'] . ', ' . ($data['state'] ?? 'Maharashtra'), 
                    'Address' => $data['address'] ?? $data['city'],
                    
                    'is_approved' => true, // Auto-approve
                    'IsActive' => true,
                    'PropertyStatus' => true, // Assuming this means Open/Available
                    
                    // Attributes
                    'NoofRooms' => $data['total_rooms'] ?? 1,
                    'MaxCapacity' => $data['max_guests'] ?? 10,
                    'Price' => $data['price'] ?? 0,
                    'DealPrice' => $data['price'] ?? 0,
                    'checkInTime' => '12:00',
                    'checkOutTime' => '11:00'
                ]);

                // 2. Handle Media (Images)
                // Logic: Look for folder: bulk_uploads/{id}/media/{property_name}/
                $this->attachMedia($property, $data['property_name']);

                // 3. Mark Entry as Imported
                $entry->update(['status' => 'IMPORTED']);

            } catch (\Exception $e) {
                $entry->update([
                    'status' => 'IMPORT_FAILED',
                    'error_message' => "Import Error: " . $e->getMessage()
                ]);
            }
        }
        
        $this->bulkUpload->update(['status' => 'COMPLETED_IMPORT']);
    }

    protected function attachMedia($property, $folderName)
    {
        // Base path for this upload's media
        $baseMediaDir = 'bulk_uploads/' . $this->bulkUpload->id . '/media';
        
        // Sanitize folder name (remove special chars usually)
        // We try exact match first
        $targetDir = $baseMediaDir . '/' . $folderName;
        
        $disk = Storage::disk('local');
        
        // If directory exists
        if ($disk->exists($targetDir)) {
            $files = $disk->files($targetDir);
            
            foreach ($files as $filePath) {
                // Move file to public property storage
                $ext = pathinfo($filePath, PATHINFO_EXTENSION);
                if (!in_array(strtolower($ext), ['jpg', 'jpeg', 'png', 'webp'])) continue;

                $newFileName = 'properties/' . $property->id . '/' . Str::random(20) . '.' . $ext;
                
                // Copy/Move
                // Ensure public disk
                Storage::disk('public')->put($newFileName, $disk->get($filePath));
                
                PropertyImage::create([
                    'property_id' => $property->id,
                    'image_path' => $newFileName,
                    'is_primary' => false // Only first one can be primary logic via observer or loop
                ]);
            }
            
            // Set first image as primary
            $firstImage = PropertyImage::where('property_id', $property->id)->first();
            if ($firstImage) {
                $firstImage->update(['is_primary' => true]);
            }
        }
    }
}
