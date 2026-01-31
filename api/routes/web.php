<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/sitemap.xml', [\App\Http\Controllers\SitemapController::class, 'index']);
Route::get('/sitemap-blogs.xml', [\App\Http\Controllers\SitemapController::class, 'blogs']);
Route::get('/sitemap-properties.xml', [\App\Http\Controllers\SitemapController::class, 'properties']);
