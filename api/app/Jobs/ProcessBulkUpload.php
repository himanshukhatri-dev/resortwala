<?php

namespace App\Jobs;

use App\Models\BulkUpload;
use App\Models\BulkUploadEntry;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Validator;

class ProcessBulkUpload implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $bulkUpload;

    public function __construct(BulkUpload $bulkUpload)
    {
        $this->bulkUpload = $bulkUpload;
    }

    public function handle()
    {
        $this->bulkUpload->update(['status' => 'PROCESSING']);

        $entries = $this->bulkUpload->entries()->where('status', 'PENDING')->get();

        foreach ($entries as $entry) {
            $data = json_decode($entry->data, true);
            
            // Validate Row
            $validator = Validator::make($data, [
                'vendor_id' => 'required|numeric|exists:users,id',
                'property_name' => 'required|string',
                'property_type' => 'required|in:Villa,Water Park',
                'city' => 'required|string',
                'total_rooms' => 'required|numeric',
                'max_guests' => 'required|numeric',
                'price' => 'nullable|numeric',
            ]);

            if ($validator->fails()) {
                $entry->update([
                    'status' => 'ERROR',
                    'error_message' => implode(', ', $validator->errors()->all())
                ]);
            } else {
                $entry->update([
                    'status' => 'VALID'
                ]);
            }
        }

        // Final Calculation
        $errorCount = $this->bulkUpload->entries()->where('status', 'ERROR')->count();
        $validCount = $this->bulkUpload->entries()->where('status', 'VALID')->count();
        
        $finalStatus = ($errorCount > 0) ? 'COMPLETED_WITH_ERRORS' : 'COMPLETED';
        if ($validCount == 0 && $errorCount > 0) $finalStatus = 'FAILED';

        $this->bulkUpload->update(['status' => $finalStatus]);
    }
}
