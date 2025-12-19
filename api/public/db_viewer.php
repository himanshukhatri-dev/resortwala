<?php
// Simple Database Viewer
// Place this in /public folder
// Access via /db_viewer.php?auth=SecretKey123

$correctAuth = 'SecretKey123';
if (!isset($_GET['auth']) || $_GET['auth'] !== $correctAuth) {
    die('<h1>Access Denied</h1><p>Append ?auth=SecretKey123 to URL</p>');
}

// Manual .env parser
function loadEnv($path) {
    if (!file_exists($path)) return [];
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $env = [];
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);
        // Strip quotes
        $value = trim($value, '"\'');
        $env[$name] = $value;
    }
    return $env;
}

// Load Config
$envPath = __DIR__ . '/../.env';
$env = loadEnv($envPath);

$host = $env['DB_HOST'] ?? '127.0.0.1';
$db   = $env['DB_DATABASE'] ?? 'resortwala';
$user = $env['DB_USERNAME'] ?? 'root';
$pass = $env['DB_PASSWORD'] ?? '';
$port = $env['DB_PORT'] ?? '3306';

// Get DB connection
try {
    $dsn = "mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4";
    $pdo = new PDO($dsn, $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $dbDetails = "Host: $host | DB: $db | User: $user";
} catch (\Exception $e) {
    die("<h1>Database Connection Failed</h1><p>" . $e->getMessage() . "</p>");
}

// List Tables
$query = $pdo->query("SHOW TABLES");
$tables = $query->fetchAll(PDO::FETCH_COLUMN);

$selectedTable = $_GET['table'] ?? ($tables[0] ?? null);

?>
<!DOCTYPE html>
<html>
<head>
    <title>DB Viewer</title>
    <style>
        body { font-family: sans-serif; padding: 20px; }
        .container { display: flex; gap: 20px; }
        .sidebar { width: 200px; border-right: 1px solid #ccc; }
        .content { flex: 1; overflow-x: auto; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; white-space: nowrap; }
        th { background-color: #f2f2f2; }
        a { text-decoration: none; color: #333; display: block; padding: 5px; }
        a:hover, a.active { background-color: #eee; font-weight: bold; }
        .db-info { background: #e0e7ff; padding: 10px; margin-bottom: 20px; border-radius: 4px; border: 1px solid #c7d2fe; color: #1e3a8a; }
    </style>
</head>
<body>
    <div class="db-info">
        <strong>Connected to:</strong> <?= htmlspecialchars($dbDetails) ?>
    </div>
    <h1>Database Viewer</h1>
    <div class="container">
        <div class="sidebar">
            <h3>Tables</h3>
            <?php foreach ($tables as $table): ?>
                <a href="?auth=<?= $correctAuth ?>&table=<?= $table ?>" class="<?= $selectedTable == $table ? 'active' : '' ?>">
                    <?= $table ?>
                </a>
            <?php endforeach; ?>
        </div>
        <div class="content">
            <?php if ($selectedTable): ?>
                <h2><?= $selectedTable ?> (Top 100)</h2>
                <?php
                $stmt = $pdo->prepare("SELECT * FROM `$selectedTable` LIMIT 100");
                $stmt->execute();
                $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                ?>
                
                <?php if (count($rows) > 0): ?>
                    <table>
                        <thead>
                            <tr>
                                <?php foreach (array_keys($rows[0]) as $col): ?>
                                    <th><?= $col ?></th>
                                <?php endforeach; ?>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($rows as $row): ?>
                                <tr>
                                    <?php foreach ($row as $val): ?>
                                        <td><?= htmlspecialchars($val ?? 'NULL') ?></td>
                                    <?php endforeach; ?>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                <?php else: ?>
                    <p>Table is empty.</p>
                <?php endif; ?>
            <?php endif; ?>
        </div>
    </div>
</body>
</html>
