<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ImageBackupVersion extends Model
{
    use HasFactory;

    protected $table = 'image_backup_versions';

    protected $fillable = [
        'image_id',
        'original_path',
        'backup_path',
        'checksum',
        'backup_batch_id',
        'backed_up_at',
        'backed_up_by',
        'status',
        'metadata'
    ];

    protected $casts = [
        'metadata' => 'array',
        'backed_up_at' => 'datetime'
    ];

    public function image()
    {
        return $this->belongsTo(PropertyImage::class, 'image_id');
    }
}
