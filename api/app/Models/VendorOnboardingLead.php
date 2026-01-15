<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VendorOnboardingLead extends Model
{
    use \App\Traits\Auditable;

    protected $fillable = [
        'vendor_name', 'property_name', 'contact_person', 'phone', 'email', 'city', 'area', 
        'property_type', 'source', 'status', 'assigned_to', 'last_updated_by',
        'website', 'rating', 'reviews_count', 'priority', 'last_contact_at', 'next_follow_up_at'
    ];

    protected $casts = [
        'last_contact_at' => 'datetime',
        'next_follow_up_at' => 'datetime',
        'rating' => 'decimal:2'
    ];

    public function assignedAgent()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function interactions()
    {
        return $this->hasMany(VendorLeadInteraction::class, 'vendor_lead_id')->orderBy('created_at', 'desc');
    }

    public function tasks()
    {
        return $this->hasMany(VendorLeadTask::class, 'vendor_lead_id')->orderBy('due_at', 'asc');
    }
}
