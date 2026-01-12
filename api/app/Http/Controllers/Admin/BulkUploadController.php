<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\PropertyTemplateExport;

class BulkUploadController extends Controller
{
    public function downloadTemplate()
    {
        return Excel::download(new PropertyTemplateExport, 'property_bulk_upload_template.xlsx');
    }

    public function initUpload(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls',
            'zip' => 'nullable|file|mimes:zip'
        ]);

        try {
            $service = new \App\Services\BulkUploadService();
            $bulkUpload = $service->handleInit(
                $request->all(),
                $request->file('file'),
                $request->file('zip')
            );

            return response()->json([
                'message' => 'Upload initialized successfully',
                'id' => $bulkUpload->id,
                'total_rows' => $bulkUpload->total_rows
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function show($id)
    {
        $bulkUpload = \App\Models\BulkUpload::withCount([
            'entries as valid_count' => function ($query) {
                $query->where('status', 'VALID');
            },
            'entries as error_count' => function ($query) {
                $query->where('status', 'ERROR');
            }
        ])->findOrfail($id);
        
        return response()->json($bulkUpload);
    }

    public function entries($id, Request $request)
    {
        $status = $request->query('status'); 
        
        $entries = \App\Models\BulkUploadEntry::where('bulk_upload_id', $id)
            ->when($status, function($q) use ($status) {
                return $q->where('status', $status);
            })
            ->paginate(50);
            
        return response()->json($entries);
    }
    
    public function import($id)
    {
        $bulkUpload = \App\Models\BulkUpload::findOrFail($id);
        
        if ($bulkUpload->status === 'IMPORTING') {
            return response()->json(['message' => 'Import already in progress'], 400);
        }
        
        \App\Jobs\ImportBulkProperties::dispatch($bulkUpload);
        
        return response()->json(['message' => 'Import started in background']);
    }
}
