<?php

namespace App\Http\Controllers;

use App\Models\Blog;
use App\Models\PropertyMaster;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class SitemapController extends Controller
{
    /**
     * Sitemap index - links to all sub-sitemaps
     */
    public function index()
    {
        $xml = Cache::remember('sitemap_index', config('sitemap.cache_duration', 1440), function () {
            $baseUrl = config('app.url');

            return view('sitemap.index', [
                'sitemaps' => [
                    ['loc' => $baseUrl . '/sitemap-blogs.xml', 'lastmod' => Blog::max('updated_at')],
                    ['loc' => $baseUrl . '/sitemap-properties.xml', 'lastmod' => PropertyMaster::max('updated_at')],
                ]
            ])->render();
        });

        return response($xml)->header('Content-Type', 'application/xml');
    }

    /**
     * Blog sitemap
     */
    public function blogs()
    {
        $xml = Cache::remember('sitemap_blogs', config('sitemap.cache_duration', 1440), function () {
            $blogs = Blog::published()
                ->select('slug', 'updated_at', 'created_at')
                ->orderBy('updated_at', 'desc')
                ->get();

            return view('sitemap.blogs', compact('blogs'))->render();
        });

        return response($xml)->header('Content-Type', 'application/xml');
    }

    /**
     * Properties sitemap
     */
    public function properties()
    {
        $xml = Cache::remember('sitemap_properties', config('sitemap.cache_duration', 1440), function () {
            $properties = PropertyMaster::where('is_approved', true)
                ->select('PropertyId', 'Name', 'updated_at')
                ->orderBy('updated_at', 'desc')
                ->get();

            return view('sitemap.properties', compact('properties'))->render();
        });

        return response($xml)->header('Content-Type', 'application/xml');
    }
}
