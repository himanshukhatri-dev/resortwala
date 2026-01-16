<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ContentRegistry extends Model
{
    use HasFactory;

    protected $table = 'content_registry';

    protected $fillable = [
        'key',
        'title',
        'body_html',
        'source_page',
        'version',
        'last_updated_by'
    ];
}
