<?php
try {
    // Load .env manually to get credentials exactly as Laravel sees them? 
    // Or just use the credentials I know should be there.
    // Let's test the credentials we just set.
    $host = '127.0.0.1';
    $db = 'resortwala_staging';
    $user = 'resortwala_staging';
    $pass = 'Staging@2026_Secure!';

    $dsn = "mysql:host=$host;dbname=$db;charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];

    $pdo = new PDO($dsn, $user, $pass, $options);
    echo "Database Connected Successfully!";

    // Optional: Check if table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'property_masters'");
    if ($stmt->rowCount() > 0) {
        echo "\nTable 'property_masters' exists.";
    } else {
        echo "\nTable 'property_masters' NOT found (Sync might have failed).";
    }

} catch (\PDOException $e) {
    echo "Connection Failed: " . $e->getMessage();
    exit(1);
}
