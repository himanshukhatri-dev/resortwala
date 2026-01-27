<?php

namespace App\Http\Controllers;

use App\Models\PropertyMaster;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;

class SitemapController extends Controller
{
    /**
     * Generate sitemap.xml
     */
    public function index()
    {
        $properties = PropertyMaster::select('slug', 'updated_at')
            ->whereNotNull('slug')
            ->orderBy('updated_at', 'desc')
            ->get();

        $cities = PropertyMaster::select('CityName')
            ->distinct()
            ->whereNotNull('CityName')
            ->get();

        $baseUrl = config('app.frontend_url', 'https://resortwala.com');

        $content = view('sitemap', [
            'properties' => $properties,
            'cities' => $cities,
            'baseUrl' => $baseUrl,
        ])->render();

        return Response::make($content, 200, [
            'Content-Type' => 'application/xml',
            'Cache-Control' => 'public, max-age=3600',
        ]);
    }
}
