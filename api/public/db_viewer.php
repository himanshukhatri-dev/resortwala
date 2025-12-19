<?php
// Simple Database Viewer
// Place this in /public folder
// Access via /db_viewer.php?auth=SecretKey123

$correctAuth = 'SecretKey123';
if (!isset($_GET['auth']) || $_GET['auth'] !== $correctAuth) {
    die('<h1>Access Denied</h1><p>Append ?auth=SecretKey123 to URL</p>');
}

// Load Laravel Config (to get DB creds)
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

// Get DB connection
try {
    $pdo = \Illuminate\Support\Facades\DB::connection()->getPdo();
    $config = \Illuminate\Support\Facades\DB::connection()->getConfig();
    $dbDetails = "Host: {$config['host']} | DB: {$config['database']} | User: {$config['username']}";
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
