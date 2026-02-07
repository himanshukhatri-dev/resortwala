<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SEOConfig extends Model
{
    protected $fillable = [
        'page_type',
        'slug',
        'target_city',
        'target_category',
        'meta_title',
        'meta_description',
        'meta_keywords',
        'h1_title',
        'about_content',
        'faqs',
        'is_active'
    ];

    protected $casts = [
        'faqs' => 'array',
        'is_active' => 'boolean'
    ];
}
