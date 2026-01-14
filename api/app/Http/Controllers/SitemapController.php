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
        $properties = PropertyMaster::select('PropertyId', 'Name', 'updated_at')
            ->orderBy('updated_at', 'desc')
            ->get();

        $content = view('sitemap', [
            'properties' => $properties,
        ])->render();

        return Response::make($content, 200, [
            'Content-Type' => 'application/xml',
            'Cache-Control' => 'public, max-age=3600',
        ]);
    }
}
