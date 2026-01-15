echo "--- DEBUG START ---" . PHP_EOL;
try {
    $count = \App\Models\CrawlJob::count();
    echo "Job Count: " . $count . PHP_EOL;
    
    $jobs = \App\Models\CrawlJob::orderBy('created_at', 'desc')->take(5)->get();
    echo "Jobs JSON: " . $jobs->toJson() . PHP_EOL;

} catch (\Exception $e) {
    echo "EXCEPTION: " . $e->getMessage() . PHP_EOL;
    echo $e->getTraceAsString() . PHP_EOL;
}
echo "--- DEBUG END ---" . PHP_EOL;
exit;
