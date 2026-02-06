<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LearningStep extends Model
{
    use HasFactory;

    protected $fillable = [
        'module_id',
        'step_order',
        'action_type',
        'selector',
        'path',
        'payload',
        'narration_text',
        'audio_url'
    ];

    protected $casts = [
        'payload' => 'array',
    ];

    public function module()
    {
        return $this->belongsTo(LearningModule::class, 'module_id');
    }
}
