<?php

namespace App\Traits;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;

trait Auditable
{
    public static function bootAuditable()
    {
        static::created(function ($model) {
            $model->logAudit('created');
        });

        static::updated(function ($model) {
            $model->logAudit('updated');
        });

        static::deleted(function ($model) {
            $model->logAudit('deleted');
        });
    }

    protected function logAudit(string $event)
    {
        $oldValues = null;
        $newValues = null;

        if ($event === 'updated') {
            $oldValues = array_intersect_key($this->getOriginal(), $this->getDirty());
            $newValues = $this->getDirty();
            
            if (empty($newValues)) return;
            
            // Hide sensitive fields
            $sensitive = ['password', 'remember_token', 'token', 'secret', 'api_token'];
            foreach ($sensitive as $field) {
                if (isset($oldValues[$field])) $oldValues[$field] = '[REDACTED]';
                if (isset($newValues[$field])) $newValues[$field] = '[REDACTED]';
            }
        } elseif ($event === 'created') {
            $newValues = $this->getAttributes();
            foreach (['password', 'remember_token', 'api_token'] as $field) {
                if (isset($newValues[$field])) $newValues[$field] = '[REDACTED]';
            }
        } elseif ($event === 'deleted') {
            $oldValues = $this->getOriginal();
            foreach (['password', 'remember_token', 'api_token'] as $field) {
                if (isset($oldValues[$field])) $oldValues[$field] = '[REDACTED]';
            }
        }

        AuditLog::create([
            'user_id' => Auth::id(),
            'auditable_type' => get_class($this),
            'auditable_id' => $this->getKey(),
            'event' => $event,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'url' => request()->fullUrl(),
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent()
        ]);
    }
}
