<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DatabaseBackup extends Model
{
    protected $fillable = [
        'filename', 'environment', 'size_bytes', 'status', 
        'disk', 'checksum', 'is_encrypted', 'restored_at', 'restored_by'
    ];

    public function restorer()
    {
        return $this->belongsTo(User::class, 'restored_by');
    }
}
