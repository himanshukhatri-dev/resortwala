<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\VendorLead;
use App\Models\CrawlJob;
use App\Services\Intelligence\LeadPipelineService;

class LeadCrawlerController extends Controller
{
    /**
     * Get Leads (Paginated, Filtered)
     */
    public function index(Request $request)
    {
        $sortBy = $request->sort_by ?? 'created_at';
        $sortOrder = $request->sort_order ?? 'desc';
        // Allowable sort columns
        if (!in_array($sortBy, ['created_at', 'updated_at', 'confidence_score', 'rating', 'review_count', 'name', 'contact_person', 'status'])) {
            $sortBy = 'created_at';
        }

        $query = VendorLead::orderBy($sortBy, $sortOrder);

        if ($request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('city', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%")
                  ->orWhere('contact_person', 'like', "%{$search}%");
            });
        }

        if ($request->city) {
            $query->where('city', 'like', "%{$request->city}%");
        }
        
        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->min_score) {
            $query->where('confidence_score', '>=', $request->min_score);
        }

        return response()->json($query->paginate(20));
    }

    /**
     * Update Lead (Status, Notes, Contact Person)
     */
    public function update(Request $request, $id)
    {
        $lead = VendorLead::findOrFail($id);
        
        $validated = $request->validate([
            'status' => 'sometimes|string',
            'contact_person' => 'nullable|string|max:255',
            'notes' => 'nullable|string'
        ]);

        $lead->update($validated);

        return response()->json(['message' => 'Lead updated', 'lead' => $lead]);
    }

    /**
     * Get Crawl Jobs History
     */
    public function jobs()
    {
        $jobs = CrawlJob::orderBy('created_at', 'desc')->take(10)->get();
        return response()->json($jobs);
    }

    /**
     * Trigger a new Crawl Job
     */
    public function trigger(Request $request)
    {
        $request->validate([
            'city' => 'required|string|min:3',
            'category' => 'nullable|string',
            'depth' => 'nullable|integer|min:1|max:5' // Depth of search (pages)
        ]);

        $city = $request->city;
        $category = $request->category ?? 'Resort'; // Default category
        $depth = $request->depth ?? 1;
        $user = $request->user();

        $job = CrawlJob::create([
            'city' => $city,
            'category' => $category,
            'filters_used' => json_encode(['depth' => $depth]),
            'source' => 'google',
            'status' => 'pending',
            'triggered_by' => $user->id
        ]);

        // 2. Dispatch Async Job (Limit based on depth * 20 results approx)
        $limit = $depth * 20; 
        \App\Jobs\ProcessCrawl::dispatch($job->id, $limit);

        return response()->json(['message' => 'Crawl Job Queued', 'job' => $job]);
    }


    /**
     * Convert Lead to Vendor (Invitation logic)
     */
    public function convert($id)
    {
        $lead = VendorLead::findOrFail($id);
        $lead->status = 'converted';
        $lead->save();
        
        // Logic to create Vendor User or Send Invite Email would go here
        
        return response()->json(['message' => 'Lead marked as converted']);
    }
    /**
     * Export Leads to CSV
     */
    public function export(Request $request)
    {
        $sortBy = $request->sort_by ?? 'created_at';
        $sortOrder = $request->sort_order ?? 'desc';
        // Allowable sort columns
        if (!in_array($sortBy, ['created_at', 'updated_at', 'confidence_score', 'rating', 'review_count', 'name', 'contact_person', 'status'])) {
            $sortBy = 'created_at';
        }

        $query = VendorLead::orderBy($sortBy, $sortOrder);

        if ($request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('city', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%")
                  ->orWhere('contact_person', 'like', "%{$search}%");
            });
        }

        if ($request->city) {
            $query->where('city', 'like', "%{$request->city}%");
        }
        
        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->min_score) {
            $query->where('confidence_score', '>=', $request->min_score);
        }

        $leads = $query->get();

        $headers = [
            "Content-type" => "text/csv",
            "Content-Disposition" => "attachment; filename=leads_export_" . date('Y-m-d_H-i') . ".csv",
            "Pragma" => "no-cache",
            "Cache-Control" => "must-revalidate, post-check=0, pre-check=0",
            "Expires" => "0"
        ];

        $columns = ['ID', 'Name', 'City', 'Phone', 'Email', 'Contact Person', 'Status', 'Score', 'Rating', 'Reviews', 'Source', 'Website', 'Address', 'Notes', 'Created At'];

        $callback = function() use ($leads, $columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);

            foreach ($leads as $lead) {
                $row = [
                    $lead->id,
                    $lead->name,
                    $lead->city,
                    $lead->phone,
                    $lead->email,
                    $lead->contact_person,
                    $lead->status,
                    $lead->confidence_score,
                    $lead->rating,
                    $lead->review_count,
                    $lead->source,
                    $lead->website,
                    $lead->address,
                    $lead->notes,
                    $lead->created_at,
                ];
                fputcsv($file, $row);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
