<?php

namespace App\Http\Controllers;

use App\Models\Blog;
use App\Services\BlogGeneratorService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BlogController extends Controller
{
    protected $generator;

    public function __construct(BlogGeneratorService $generator)
    {
        $this->generator = $generator;
    }

    /**
     * Public list of published blogs
     */
    public function index(Request $request)
    {
        $query = Blog::published()->orderBy('published_at', 'desc');

        if ($request->category) {
            $query->byCategory($request->category);
        }

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'LIKE', "%{$request->search}%")
                    ->orWhere('excerpt', 'LIKE', "%{$request->search}%");
            });
        }

        $limit = $request->get('limit', 10);
        $blogs = $query->paginate($limit);

        return response()->json($blogs);
    }

    /**
     * Single blog by slug (public)
     */
    public function show($slug)
    {
        $blog = Blog::where('slug', $slug)->published()->firstOrFail();
        $blog->incrementViews();

        return response()->json($blog);
    }

    /**
     * Admin: List all blogs (including drafts)
     */
    public function adminIndex(Request $request)
    {
        $query = Blog::query()->orderBy('created_at', 'desc');

        if ($request->status === 'published') {
            $query->where('is_published', true);
        } elseif ($request->status === 'draft') {
            $query->where('is_published', false);
        }

        if ($request->category) {
            $query->byCategory($request->category);
        }

        $blogs = $query->paginate($request->get('limit', 20));
        return response()->json($blogs);
    }

    /**
     * Admin: Get single blog (including drafts)
     */
    public function adminShow($id)
    {
        $blog = Blog::withTrashed()->findOrFail($id);
        return response()->json($blog);
    }

    /**
     * Admin: Create new blog
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'nullable|string|unique:blogs,slug',
            'excerpt' => 'nullable|string',
            'content' => 'required|string',
            'cover_image' => 'nullable|string',
            'author' => 'nullable|string',
            'category' => 'nullable|string',
            'tags' => 'nullable|array',
            'meta_title' => 'nullable|string|max:60',
            'meta_description' => 'nullable|string|max:160',
            'property_id' => 'nullable|exists:property_masters,PropertyId',
            'is_published' => 'boolean'
        ]);

        // Auto-generate slug if not provided
        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['title']);
        }

        // Set published_at if publishing
        if ($validated['is_published'] ?? false) {
            $validated['published_at'] = now();
        }

        $blog = Blog::create($validated);
        return response()->json(['message' => 'Blog created successfully', 'blog' => $blog], 201);
    }

    /**
     * Admin: Update blog
     */
    public function update(Request $request, $id)
    {
        $blog = Blog::findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'slug' => 'sometimes|string|unique:blogs,slug,' . $id,
            'excerpt' => 'nullable|string',
            'content' => 'sometimes|string',
            'cover_image' => 'nullable|string',
            'author' => 'nullable|string',
            'category' => 'nullable|string',
            'tags' => 'nullable|array',
            'meta_title' => 'nullable|string|max:60',
            'meta_description' => 'nullable|string|max:160',
            'property_id' => 'nullable|exists:property_masters,PropertyId',
            'is_published' => 'boolean'
        ]);

        // Update published_at if changing publish status
        if (isset($validated['is_published']) && $validated['is_published'] && !$blog->published_at) {
            $validated['published_at'] = now();
        }

        $blog->update($validated);
        return response()->json(['message' => 'Blog updated successfully', 'blog' => $blog]);
    }

    /**
     * Admin: Delete blog (soft delete)
     */
    public function destroy($id)
    {
        $blog = Blog::findOrFail($id);
        $blog->delete();

        return response()->json(['message' => 'Blog deleted successfully']);
    }

    /**
     * Admin: Toggle publish status
     */
    public function publish(Request $request, $id)
    {
        $blog = Blog::findOrFail($id);

        $blog->is_published = !$blog->is_published;
        if ($blog->is_published && !$blog->published_at) {
            $blog->published_at = now();
        }
        $blog->save();

        return response()->json([
            'message' => $blog->is_published ? 'Blog published' : 'Blog unpublished',
            'blog' => $blog
        ]);
    }

    /**
     * Admin: Generate AI blog
     */
    public function generateAI(Request $request)
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
