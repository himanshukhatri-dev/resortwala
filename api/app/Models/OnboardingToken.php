<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OnboardingToken extends Model
{
    protected $fillable = [
        'user_type',
        'user_id',
        'token',
        'role',
        'is_used',
        'expires_at'
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'is_used' => 'boolean'
    ];

    public function user()
    {
        return $this->morphTo();
    }
}
