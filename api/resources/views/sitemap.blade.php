<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>{{ $baseUrl }}/</loc>
        <lastmod>{{ now()->toAtomString() }}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>{{ $baseUrl }}/search</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
    @foreach ($cities as $city)
    <url>
        <loc>{{ $baseUrl }}/locations/{{ strtolower($city->CityName) }}</loc>
        <changefreq>daily</changefreq>
        <priority>0.9</priority>
    </url>
    @endforeach

    @foreach ($properties as $property)
    <url>
        <loc>{{ $baseUrl }}/property/{{ $property->slug }}</loc>
        <lastmod>{{ $property->updated_at->toAtomString() }}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
    @endforeach
</urlset>
