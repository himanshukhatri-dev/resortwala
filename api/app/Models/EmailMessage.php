<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmailMessage extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'is_read' => 'boolean',
        'is_starred' => 'boolean',
        'date_received' => 'datetime'
    ];

    public function credential()
    {
        return $this->belongsTo(EmailCredential::class);
    }

    public function attachments()
    {
        return $this->hasMany(EmailAttachment::class);
    }
}
