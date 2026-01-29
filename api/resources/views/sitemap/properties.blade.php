<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
@foreach($properties as $property)
    <url>
        <loc>{{ rtrim(env('FRONTEND_URL', 'https://resortwala.com'), '/') }}/property/{{ $property->slug ?? $property->PropertyId }}</loc>
        <lastmod>{{ $property->updated_at->toAtomString() }}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.9</priority>
    </url>
@endforeach
</urlset>
