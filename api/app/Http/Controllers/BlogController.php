<?php

namespace App\Http\Controllers;

use App\Models\Blog;
use App\Services\BlogGeneratorService;
use Illuminate\Http\Request;

class BlogController extends Controller
{
    protected $generator;

    public function __construct(BlogGeneratorService $generator)
    {
        $this->generator = $generator;
    }

    /**
     * Public list of blogs
     */
    public function index(Request $request)
    {
        $limit = $request->get('limit', 10);
        $blogs = Blog::orderBy('published_at', 'desc')->paginate($limit);
        return response()->json($blogs);
    }

    /**
     * Single blog by slug
     */
    public function show($slug)
    {
        $blog = Blog::where('slug', $slug)->firstOrFail();
        return response()->json($blog);
    }

    /**
     * Trigger generation (Admin/Dev only)
     */
    public function generate(Request $request)
    {
        // Simple security check for now, can be middleware later
        if ($request->header('X-Generator-Secret') !== 'ResortWala2026') {
            // allow local dev
            if (!app()->isLocal())
                return response()->json(['error' => 'Unauthorized'], 401);
        }

        if ($request->property_id) {
            $blog = $this->generator->generateForProperty($request->property_id);
            return response()->json($blog);
        }

        $all = $this->generator->generateBulk(5);
        return response()->json(['message' => 'Generated 5 blogs', 'data' => $all]);
    }
}
