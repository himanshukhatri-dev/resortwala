<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BulkUploadEntry extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'data' => 'array',
        'error_message' => 'array'
    ];

    public function bulkUpload()
    {
        return $this->belongsTo(BulkUpload::class);
    }
}
