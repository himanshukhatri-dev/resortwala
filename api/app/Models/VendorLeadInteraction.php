<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VendorLeadInteraction extends Model
{
    protected $fillable = [
        'vendor_lead_id', 'agent_id', 'interaction_type', 'outcome', 'notes', 'follow_up_at', 'attachments'
    ];

    protected $casts = [
        'attachments' => 'array',
        'follow_up_at' => 'datetime'
    ];

    public function agent()
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    public function lead()
    {
        return $this->belongsTo(VendorOnboardingLead::class, 'vendor_lead_id');
    }
}
