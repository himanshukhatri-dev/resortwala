<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VendorLeadTask extends Model
{
    protected $fillable = [
        'vendor_lead_id', 'task_type', 'title', 'description', 'due_at', 'status', 'assigned_to'
    ];

    protected $casts = [
        'due_at' => 'datetime'
    ];

    public function lead()
    {
        return $this->belongsTo(VendorOnboardingLead::class, 'vendor_lead_id');
    }

    public function assignedUser()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }
}
