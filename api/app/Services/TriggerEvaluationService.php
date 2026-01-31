<?php

namespace App\Services;

use App\Models\SmartTriggerRule;
use App\Models\VendorTriggerHistory;
use Illuminate\Support\Collection;

class TriggerEvaluationService
{
    /**
     * Evaluate triggers for a given page and vendor context
     * @return SmartTriggerRule|null
     */
    public function evaluateTriggers(int $vendorId, string $pageRoute, array $context = []): ?SmartTriggerRule
    {
        // 1. Fetch active rules for this page
        $rules = SmartTriggerRule::where('is_active', true)
            ->where(function ($q) use ($pageRoute) {
                $q->where('page_route', $pageRoute)
                    ->orWhereNull('page_route');
            })
            ->orderBy('priority', 'desc')
            ->get();

        foreach ($rules as $rule) {
            if ($this->shouldTrigger($rule, $vendorId, $context)) {
                return $rule;
            }
        }

        return null;
    }

    /**
     * Check if a specific rule should fire
     */
    private function shouldTrigger(SmartTriggerRule $rule, int $vendorId, array $context): bool
    {
        // Check 1: Cooldown/Frequency Limits
        $recentHistory = VendorTriggerHistory::where('vendor_id', $vendorId)
            ->where('trigger_rule_id', $rule->id)
            ->orderBy('triggered_at', 'desc')
            ->first();

        if ($recentHistory) {
            // Check max triggers
            $triggerCount = VendorTriggerHistory::where('vendor_id', $vendorId)
                ->where('trigger_rule_id', $rule->id)
                ->count();

            if ($triggerCount >= $rule->max_triggers_per_vendor) {
                return false;
            }

            // Check cooldown
            $hoursSinceLast = now()->diffInHours($recentHistory->triggered_at);
            if ($hoursSinceLast < $rule->cooldown_hours) {
                return false;
            }
        }

        // Check 2: Evaluate Conditions (JSON logic)
        $conditions = $rule->conditions ?? [];
        return $this->evaluateConditions($conditions, $context);
    }

    /**
     * Evaluate rule conditions against context
     */
    private function evaluateConditions(array $conditions, array $context): bool
    {
        // Simple condition evaluator logic
        // Example: {"type": "time_on_page", "operator": ">", "value": 30}

        if (empty($conditions))
            return true; // No conditions = always trigger (subject to limits)

        foreach ($conditions as $condition) {
            $type = $condition['type'] ?? '';
            $operator = $condition['operator'] ?? '==';
            $targetValue = $condition['value'] ?? null;

            $actualValue = $context[$type] ?? null;

            if (!$this->compare($actualValue, $operator, $targetValue)) {
                return false;
            }
        }

        return true;
    }

    private function compare($actual, $operator, $target): bool
    {
        switch ($operator) {
            case '==':
                return $actual == $target;
            case '!=':
                return $actual != $target;
            case '>':
                return $actual > $target;
            case '<':
                return $actual < $target;
            case '>=':
                return $actual >= $target;
            case '<=':
                return $actual <= $target;
            default:
                return false;
        }
    }
}
