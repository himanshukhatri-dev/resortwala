<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class EmailCredential extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $hidden = ['encrypted_password'];

    // Helper to set password safely
    public function setPasswordAttribute($value)
    {
        $this->attributes['encrypted_password'] = Crypt::encryptString($value);
    }

    // Helper to get password (decrypted)
    // NOTE: Only call this when actually connecting!
    public function getPasswordDecryptedAttribute()
    {
        try {
            return Crypt::decryptString($this->attributes['encrypted_password']);
        } catch (\Exception $e) {
            return null;
        }
    }
}
