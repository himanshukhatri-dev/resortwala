<?php

namespace App\Http\Controllers\Internal;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\JenkinsService;
use Illuminate\Support\Facades\Process;

class DeploymentController extends Controller
{
    protected $jenkins;

    public function __construct(JenkinsService $jenkins)
    {
        $this->jenkins = $jenkins;
    }

    /**
     * Get Dashboard Data
     */
    public function index()
    {
        // 1. Get Current Deployment Info (Simplistic check of filesystem or version file)
        $currentVersion = 'Unknown';
        $deployedAt = 'Unknown';
        
        // In atomic structure, current points to a release folder
        // We can try to resolve the symlink target
        // This only works if API is running on the same server, which it is.
        try {
            $basePath = base_path();
            // If we are in /var/www/html/resortwala_v2/releases/v1.0.0/api
            // We can extract the version from path
            if (preg_match('/releases\/([^\/]+)/', $basePath, $matches)) {
                $currentVersion = $matches[1];
            }
        } catch (\Exception $e) {
            // Ignore
        }

        // 2. Get Jenkins Status
        $jenkinsStatus = $this->jenkins->getJobStatus();
        $history = $this->jenkins->getHistory();

        return response()->json([
            'current_version' => $currentVersion,
            'environment' => app()->environment(),
            'jenkins' => $jenkinsStatus,
            'history' => $history,
            // 'git_branch' => trim(shell_exec('git rev-parse --abbrev-ref HEAD')), // Optional, might not work in atomic
        ]);
    }

    /**
     * Trigger Deployment
     */
    public function deploy(Request $request)
    {
        $request->validate([
            'target' => 'required|in:Beta,Production',
            'tag' => 'nullable|string' // Optional manual tag
        ]);

        $params = [
            'DEPLOY_TARGET' => $request->target,
            'RELEASE_TAG' => $request->tag ?? ''
        ];

        $result = $this->jenkins->triggerBuild($params);

        return response()->json($result);
    }

    /**
     * Trigger Rollback
     * Since we didn't make a dedicated rollback job yet, 
     * this might need to run a shell command OR trigger a parameterized job.
     * For MVP, we will assume a Manual Rollback or a specific Jenkins Job later.
     * Implementing as a placeholder or Shell execution if permissible.
     */
    public function rollback(Request $request)
    {
        // Option 1: Trigger a "Rollback" Jenkins Job (Recommended)
        // Option 2: SSH execution (Dangerous from Web Request)
        
        // Let's assume we use the main pipeline with a special param or separate job
        // returning "Not Implemented" for safety until configured
        
        return response()->json(['message' => 'Rollback via UI is pending Jenkins Job configuration. Use SSH for now.'], 501);
    }
}
