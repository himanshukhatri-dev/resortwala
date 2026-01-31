<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\OnboardingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class VendorOnboardingController extends Controller
{
    private $onboardingService;

    public function __construct(OnboardingService $onboardingService)
    {
        $this->onboardingService = $onboardingService;
    }

    /**
     * Get vendor onboarding status
     */
    public function getStatus()
    {
        $vendorId = Auth::id();
        $status = $this->onboardingService->getMilestones($vendorId);

        return response()->json([
            'status' => 'success',
            'data' => $status
        ]);
    }

    /**
     * Manually update a milestone (if allowed manually)
     */
    public function updateMilestone(Request $request)
    {
        $request->validate([
            'milestone' => 'required|string'
        ]);

        $vendorId = Auth::id();
        $milestone = $request->input('milestone');

        $status = $this->onboardingService->updateMilestone($vendorId, $milestone);

        return response()->json([
            'status' => 'success',
            'data' => $status
        ]);
    }
}
