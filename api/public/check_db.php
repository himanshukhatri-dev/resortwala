<?php
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Basic DB Tester bypassing Middleware if possible, or just raw PDO if framework fails booting
// But since this is inside public, we can bootstrap Laravel or just use raw PDO.
// Let's use Raw PDO for reliability independent of Laravel boot issues.

$host = 'db';
$db   = 'resortwala';
$user = 'root';
$pass = 'root';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
    echo "<h1>Database Connection: SUCCESS</h1>";
    echo "<p>Connected to <strong>$db</strong> on host <strong>$host</strong>.</p>";
    
    // List tables
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "<h2>Tables Found: " . count($tables) . "</h2>";
    echo "<ul>";
    foreach ($tables as $table) {
        // Count rows in each table
        $count = $pdo->query("SELECT COUNT(*) FROM `$table`")->fetchColumn();
        echo "<li>$table ($count rows)</li>";
    }
    echo "</ul>";

} catch (\PDOException $e) {
    echo "<h1>Database Connection: FAILED</h1>";
    echo "<h3>Error: " . $e->getMessage() . "</h3>";
    echo "<p>Ensure database container 'db' is running and credentials match docker-compose.yml</p>";
}
