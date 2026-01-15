<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReconciliationBatch extends Model
{
    protected $fillable = [
        'filename', 'uploaded_by', 'status', 
        'total_records', 'matched_records', 'mismatched_records'
    ];

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function records()
    {
        return $this->hasMany(ReconciliationRecord::class, 'batch_id');
    }
}
