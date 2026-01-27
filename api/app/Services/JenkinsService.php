<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class JenkinsService
{
    protected $baseUrl;
    protected $user;
    protected $token;
    protected $jobName;

    public function __construct()
    {
        $this->baseUrl = config('services.jenkins.url', env('JENKINS_URL'));
        $this->user = config('services.jenkins.user', env('JENKINS_USER'));
        $this->token = config('services.jenkins.token', env('JENKINS_TOKEN'));
        $this->jobName = config('services.jenkins.job', env('JENKINS_JOB', 'resortwala-atomic-deploy'));
    }

    /**
     * Get the status of the last build
     */
    public function getJobStatus()
    {
        try {
            // Get Job Info
            $response = Http::withBasicAuth($this->user, $this->token)
                ->get("{$this->baseUrl}/job/{$this->jobName}/api/json");

            if ($response->failed()) {
                return ['status' => 'error', 'message' => 'Failed to reach Jenkins'];
            }

            $data = $response->json();
            $lastBuildNumber = $data['lastBuild']['number'] ?? null;
            $lastBuildStatus = 'UNKNOWN';
            
            if ($lastBuildNumber) {
                $buildResponse = Http::withBasicAuth($this->user, $this->token)
                    ->get("{$this->baseUrl}/job/{$this->jobName}/{$lastBuildNumber}/api/json");
                
                if ($buildResponse->successful()) {
                    $buildData = $buildResponse->json();
                    $lastBuildStatus = $buildData['result'] ?? ($buildData['building'] ? 'BUILDING' : 'UNKNOWN');
                    $timestamp = $buildData['timestamp'] ?? 0;
                }
            }

            return [
                'status' => 'success',
                'job_name' => $this->jobName,
                'last_build' => $lastBuildNumber,
                'last_status' => $lastBuildStatus,
                'in_queue' => $data['inQueue'] ?? false,
                'timestamp' => $timestamp ?? 0
            ];

        } catch (\Exception $e) {
            Log::error("Jenkins Service Error: " . $e->getMessage());
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }

    /**
     * Trigger a new build
     */
    public function triggerBuild($parameters = [])
    {
        try {
            // Construct query parameters
            // Jenkins remote trigger usually requires POST to /job/NAME/buildWithParameters
            $url = "{$this->baseUrl}/job/{$this->jobName}/buildWithParameters";

            $response = Http::withBasicAuth($this->user, $this->token)
                ->post($url, $parameters);

            if ($response->successful() || $response->status() === 201) {
                return ['status' => 'success', 'message' => 'Build triggered successfully'];
            }

            return [
                'status' => 'error', 
                'message' => 'Failed to trigger build. Status: ' . $response->status(),
                'body' => $response->body()
            ];

        } catch (\Exception $e) {
            Log::error("Jenkins Trigger Error: " . $e->getMessage());
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }
    
    /**
     * Get recent build history
     */
    public function getHistory($limit = 5) {
         try {
            $response = Http::withBasicAuth($this->user, $this->token)
                ->get("{$this->baseUrl}/job/{$this->jobName}/api/json?tree=builds[number,status,timestamp,result,url]{0,{$limit}}");

            if ($response->failed()) {
                return [];
            }

            return $response->json()['builds'] ?? [];

        } catch (\Exception $e) {
            return [];
        }
    }
}
