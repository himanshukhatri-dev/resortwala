<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Otp extends Model
{
    protected $fillable = [
        'identifier',
        'code',
        'type',
        'expires_at',
        'verified_at'
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'verified_at' => 'datetime'
    ];

    public function isExpired()
    {
        return $this->expires_at->isPast();
    }

    public function isVerified()
    {
        return !is_null($this->verified_at);
    }
}
