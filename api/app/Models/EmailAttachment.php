<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmailAttachment extends Model
{
    use HasFactory;

    protected $guarded = [];

    public function message()
    {
        return $this->belongsTo(EmailMessage::class, 'email_message_id');
    }
}
