<?php

namespace App\Services;

use App\Models\BulkUpload;
use App\Models\BulkUploadEntry;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Maatwebsite\Excel\Facades\Excel;
use ZipArchive;

class BulkUploadService
{
    public function handleInit(array $data, $excelFile, $zipFile)
    {
        // 1. Create BulkUpload Record
        $bulkUpload = BulkUpload::create([
            'user_id' => auth()->id(),
            'file_name' => $excelFile->getClientOriginalName(),
            'status' => 'PROCESSING',
            'total_rows' => 0
        ]);

        // 2. Store Files
        $uploadPath = 'bulk_uploads/' . $bulkUpload->id;
        $excelPath = $excelFile->storeAs($uploadPath, 'data.xlsx', 'local'); 
        
        // Correctly resolve absolute path from Disk
        $absolutePath = Storage::disk('local')->path($excelPath);

        $zipPath = null;
        if ($zipFile) {
            $zipPath = $zipFile->storeAs($uploadPath, 'media.zip', 'local');
            // Extract ZIP
            $this->extractZip(Storage::disk('local')->path($zipPath), dirname($absolutePath) . '/media');
        }

        // 3. Parse Excel
        $rows = Excel::toArray(new \stdClass, $absolutePath);
        if (empty($rows) || empty($rows[0])) {
            throw new \Exception("Excel file is empty or invalid format.");
        }

        // Sheet 1 is the data (Index 0)
        // Row 1 = Keys, Row 2 = Headers, Row 3 = Labels, Row 4+ = Data
        // So data starts at Index 3 (Row 4)
        $dataRows = array_slice($rows[0], 3); 
        
        $bulkUpload->update(['total_rows' => count($dataRows)]);

        // 4. Create Entries (Batch Insert usually better, but for now loop is safe)
        // 4. Create Entries
        foreach ($dataRows as $index => $row) {
            // Basic Key Mapping (Row 1 keys)
            $mappedData = $this->mapRowToKeys($rows[0][0], $row);

            // Access specific keys to check emptiness. 
            // Note: Keys depend on Row 1. We assume 'property_name' or 'vendor_id' must exist.
            $propName = $mappedData['property_name'] ?? null;
            $vendorId = $mappedData['vendor_id'] ?? null;

            // SKIP empty rows (where critical fields are missing)
            if (empty($propName) && empty($vendorId)) {
                continue;
            }

            BulkUploadEntry::create([
                'bulk_upload_id' => $bulkUpload->id,
                'row_number' => $index + 4, // Excel Row Number
                'data' => json_encode($mappedData),
                'status' => 'PENDING'
            ]);
        }
        
        // Recount actual filtered rows
        $actualCount = $bulkUpload->entries()->count();
        $bulkUpload->update(['total_rows' => $actualCount]);

        // 5. Trigger Queue Job
        \App\Jobs\ProcessBulkUpload::dispatch($bulkUpload);

        return $bulkUpload;
    }

    private function mapRowToKeys($keys, $row)
    {
        $mapped = [];
        foreach ($keys as $index => $key) {
            if (!empty($key)) {
                $mapped[$key] = $row[$index] ?? null;
            }
        }
        return $mapped;
    }

    private function extractZip($zipPath, $extractTo)
    {
        $zip = new ZipArchive;
        if ($zip->open($zipPath) === TRUE) {
            $zip->extractTo($extractTo);
            $zip->close();
        } else {
            throw new \Exception("Failed to open ZIP file.");
        }
    }
}
