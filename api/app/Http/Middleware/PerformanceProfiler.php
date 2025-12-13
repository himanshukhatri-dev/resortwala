<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PerformanceProfiler
{
    private $startTime;
    private $checkpoints = [];

    public function handle(Request $request, Closure $next)
    {
        // Only enable profiling if debug=1 parameter is present
        if (!$request->has('debug') || $request->get('debug') != '1') {
            return $next($request);
        }

        $this->startTime = microtime(true);
        $this->checkpoint('Request Started');

        // Store profiler instance in request for use in controllers
        $request->attributes->set('profiler', $this);

        $response = $next($request);

        $this->checkpoint('Response Ready');
        
        $totalTime = (microtime(true) - $this->startTime) * 1000; // Convert to milliseconds

        // Build profiling data
        $profilingData = [
            'url' => $request->fullUrl(),
            'method' => $request->method(),
            'total_time_ms' => round($totalTime, 2),
            'memory_peak_mb' => round(memory_get_peak_usage(true) / 1024 / 1024, 2),
            'checkpoints' => $this->checkpoints,
            'queries_count' => count(\DB::getQueryLog()),
        ];

        // Log to Laravel log
        Log::channel('daily')->info('Performance Profile', $profilingData);

        // Add profiling data to response headers
        $response->headers->set('X-Debug-Time', $totalTime . 'ms');
        $response->headers->set('X-Debug-Memory', round(memory_get_peak_usage(true) / 1024 / 1024, 2) . 'MB');
        $response->headers->set('X-Debug-Queries', count(\DB::getQueryLog()));

        // If JSON response, add profiling data
        if ($response->headers->get('Content-Type') === 'application/json') {
            $content = json_decode($response->getContent(), true);
            $content['_debug'] = $profilingData;
            $response->setContent(json_encode($content));
        }

        return $response;
    }

    public function checkpoint($label)
    {
        $currentTime = microtime(true);
        $elapsed = ($currentTime - $this->startTime) * 1000;
        
        $this->checkpoints[] = [
            'label' => $label,
            'time_ms' => round($elapsed, 2),
            'memory_mb' => round(memory_get_usage(true) / 1024 / 1024, 2)
        ];
    }
}
