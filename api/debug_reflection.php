<?php
require __DIR__ . '/vendor/autoload.php';

use PhonePe\sdk\pg\common\tokenHandler\TokenService;

echo "--- REFLECTION DUMP ---\n";
try {
    // Correct Namespace found via grep
    $className = 'PhonePe\common\tokenHandler\TokenService';
    
    if (!class_exists($className)) {
         echo "Class not found: $className\n";
         // Fallback: Check standard
         $className = 'PhonePe\sdk\pg\common\tokenHandler\TokenService';
    }

    $ref = new ReflectionClass($className);
    $method = $ref->getMethod('setAuthTokenInHeaders');
    
    $file = $method->getFileName();
    $start = $method->getStartLine();
    $end = $method->getEndLine();
    
    echo "File: $file\nLines: $start - $end\n";
    
    $lines = file($file);
    $length = $end - $start + 1;
    $body = array_slice($lines, $start - 1, $length);
    
    echo "--- CODE ---\n";
    foreach ($body as $i => $line) {
        printf("%d: %s", $start + $i, $line);
    }

} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    // Dump all declared classes to find correct namespace
    // print_r(get_declared_classes());
}
