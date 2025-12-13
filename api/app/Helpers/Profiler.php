<?php

namespace App\Helpers;

class Profiler
{
    private static $instance = null;
    private $checkpoints = [];
    private $startTime;

    private function __construct()
    {
        $this->startTime = microtime(true);
    }

    public static function getInstance()
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public static function checkpoint($label)
    {
        $profiler = self::getInstance();
        $currentTime = microtime(true);
        $elapsed = ($currentTime - $profiler->startTime) * 1000;
        
        $profiler->checkpoints[] = [
            'label' => $label,
            'time_ms' => round($elapsed, 2),
            'memory_mb' => round(memory_get_usage(true) / 1024 / 1024, 2)
        ];

        // Also log to Laravel log if debug mode
        if (request()->has('debug') && request()->get('debug') == '1') {
            \Log::debug("Checkpoint: {$label}", [
                'time_ms' => round($elapsed, 2),
                'memory_mb' => round(memory_get_usage(true) / 1024 / 1024, 2)
            ]);
        }
    }

    public function getCheckpoints()
    {
        return $this->checkpoints;
    }
}
