<?php
require __DIR__ . '/vendor/autoload.php';

echo "Checking Maatwebsite\Excel\Excel...\n";
if (class_exists('Maatwebsite\Excel\Excel')) {
    echo "Class Exists: YES\n";
    echo "Filesystem Path: " . (new ReflectionClass('Maatwebsite\Excel\Excel'))->getFileName() . "\n";
} else {
    echo "Class Exists: NO\n";
    $files = glob(__DIR__ . '/vendor/maatwebsite/excel/src/*.php');
    echo "Files in src: " . count($files) . "\n";
}
