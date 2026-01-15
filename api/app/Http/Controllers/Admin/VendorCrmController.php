<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\VendorOnboardingLead;
use App\Models\VendorLeadInteraction;
use App\Models\VendorLeadTask;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VendorCrmController extends Controller
{
    public function index(Request $request)
    {
        $query = VendorOnboardingLead::with(['assignedAgent', 'interactions' => function($q) {
            $q->latest()->limit(1);
        }]);

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->assigned_to) {
            $query->where('assigned_to', $request->assigned_to);
        }

        if ($request->search) {
            $query->where(function($q) use ($request) {
                $q->where('vendor_name', 'like', "%{$request->search}%")
                  ->orWhere('phone', 'like', "%{$request->search}%")
                  ->orWhere('city', 'like', "%{$request->search}%");
            });
        }

        return $query->latest()->paginate(20);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'vendor_name' => 'required',
            'property_name' => 'nullable|string',
            'phone' => 'required',
            'status' => 'nullable',
            'assigned_to' => 'nullable|exists:users,id'
        ]);

        $lead = VendorOnboardingLead::create($validated + ['last_updated_by' => auth()->id()]);
        return response()->json($lead);
    }

    public function show($id)
    {
        return VendorOnboardingLead::with(['interactions.agent', 'tasks.assignedUser', 'assignedAgent'])
            ->findOrFail($id);
    }

    public function logInteraction(Request $request, $id)
    {
        $validated = $request->validate([
            'interaction_type' => 'required',
            'outcome' => 'required',
            'notes' => 'required',
            'follow_up_at' => 'nullable|date'
        ]);

        return DB::transaction(function() use ($request, $id, $validated) {
            $interaction = VendorLeadInteraction::create($validated + [
                'vendor_lead_id' => $id,
                'agent_id' => auth()->id()
            ]);

            // Update lead status if provided
            if ($request->status) {
                VendorOnboardingLead::where('id', $id)->update([
                    'status' => $request->status,
                    'last_updated_by' => auth()->id()
                ]);
            }

            // Create automatic task if follow_up_at is set
            if ($request->follow_up_at) {
                VendorLeadTask::create([
                    'vendor_lead_id' => $id,
                    'task_type' => 'follow_up',
                    'title' => 'Follow up with ' . $interaction->lead->vendor_name,
                    'due_at' => $request->follow_up_at,
                    'assigned_to' => auth()->id()
                ]);
            }

            return $interaction;
        });
    }

    public function update(Request $request, $id)
    {
        $lead = VendorOnboardingLead::findOrFail($id);
        
        $validated = $request->validate([
            'vendor_name' => 'sometimes|required',
            'contact_person' => 'nullable',
            'email' => 'nullable|email',
            'phone' => 'sometimes|required',
            'city' => 'nullable',
            'area' => 'nullable',
            'property_type' => 'nullable',
            'status' => 'sometimes|required',
            'priority' => 'sometimes|required',
            'assigned_to' => 'nullable|exists:users,id',
            'website' => 'nullable|url',
            'rating' => 'nullable|numeric',
            'reviews_count' => 'nullable|integer'
        ]);

        $lead->update($validated + ['last_updated_by' => auth()->id()]);
        return response()->json($lead);
    }

    public function stats()
    {
        $startDate = now()->subDays(30);

        return [
            'total_leads' => VendorOnboardingLead::count(),
            'active_pipeline' => VendorOnboardingLead::whereNotIn('status', ['converted', 'rejected'])->count(),
            'by_status' => VendorOnboardingLead::select('status', DB::raw('count(*) as count'))
                ->groupBy('status')
                ->get(),
            'by_priority' => VendorOnboardingLead::select('priority', DB::raw('count(*) as count'))
                ->groupBy('priority')
                ->get(),
            'by_city' => VendorOnboardingLead::select('city', DB::raw('count(*) as count'))
                ->whereNotNull('city')
                ->groupBy('city')
                ->orderByDesc('count')
                ->limit(5)
                ->get(),
            'by_agent' => \App\Models\User::whereHas('assignedLeads')
                ->withCount([
                    'assignedLeads as total_leads',
                    'assignedLeads as converted_leads' => function($q) {
                        $q->where('status', 'converted');
                    }
                ])
                ->get(),
            'pending_tasks' => VendorLeadTask::where('status', 'pending')
                ->where('due_at', '<=', now()->addDays(1))
                ->count(),
            'recent_interactions_count' => VendorLeadInteraction::where('created_at', '>=', $startDate)->count(),
            'conversion_rate' => [
                'converted' => VendorOnboardingLead::where('status', 'converted')->count(),
                'total' => VendorOnboardingLead::count()
            ],
            'aging_leads' => VendorOnboardingLead::where('status', '!=', 'converted')
                ->where('status', '!=', 'rejected')
                ->where(function($q) {
                    $q->where('last_contact_at', '<', now()->subDays(3))
                      ->orWhereNull('last_contact_at');
                })
                ->count()
        ];
    }

    public function getAgents()
    {
        return \App\Models\User::where('role', 'admin')->select('id', 'name', 'email')->get();
    }

    public function funnel()
    {
        $stages = ['new', 'contacted', 'interested', 'qualified', 'converted'];
        $funnelData = [];
        
        $cumulativeCount = VendorOnboardingLead::count();
        
        foreach ($stages as $stage) {
            $count = VendorOnboardingLead::where('status', $stage)->count();
            // In a real funnel, a 'converted' lead was once 'new', 'contacted' etc.
            // Since we only store current status, we approximate by cumulative stages
            // e.g. 'Interested' includes those currently at 'Interested', 'Qualified', and 'Converted'
            
            $currentAndAheadCount = VendorOnboardingLead::whereIn('status', array_slice($stages, array_search($stage, $stages)))
                ->count();

            $funnelData[] = [
                'stage' => ucfirst($stage),
                'count' => $currentAndAheadCount,
                'dropoff' => $cumulativeCount > 0 ? round((($cumulativeCount - $currentAndAheadCount) / $cumulativeCount) * 100, 2) : 0
            ];
            
            $cumulativeCount = $currentAndAheadCount;
        }

        return response()->json($funnelData);
    }

    public function export()
    {
        $leads = VendorOnboardingLead::all();
        $csvHeader = ['ID', 'Vendor Name', 'Phone', 'Email', 'City', 'Status', 'Priority', 'Assigned Agent'];
        
        $callback = function() use ($leads, $csvHeader) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $csvHeader);
            
            foreach ($leads as $lead) {
                fputcsv($file, [
                    $lead->id,
                    $lead->vendor_name,
                    $lead->phone,
                    $lead->email,
                    $lead->city,
                    $lead->status,
                    $lead->priority,
                    $lead->assignedAgent?->name
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, [
            "Content-type" => "text/csv",
            "Content-Disposition" => "attachment; filename=vendor_leads_" . date('Y-m-d') . ".csv",
            "Pragma" => "no-cache",
            "Cache-Control" => "must-revalidate, post-check=0, pre-check=0",
            "Expires" => "0"
        ]);
    }
    public function destroy($id)
    {
        $lead = VendorOnboardingLead::findOrFail($id);
        $lead->delete();
        return response()->json(['message' => 'Lead deleted']);
    }
}
