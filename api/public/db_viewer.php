<?php
// Advanced Database Viewer & Editor
// Access via /db_viewer.php?auth=SecretKey123

$correctAuth = 'SecretKey123';
if (!isset($_GET['auth']) || $_GET['auth'] !== $correctAuth) {
    die('<h1>Access Denied</h1><p>Append ?auth=SecretKey123 to URL</p>');
}

// -- 1. Load Environment & Connect --
function loadEnv($path) {
    if (!file_exists($path)) return [];
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $env = [];
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        $env[trim($name)] = trim(trim($value), '"\'');
    }
    return $env;
}

$env = loadEnv(__DIR__ . '/../.env');
$host = $env['DB_HOST'] ?? '127.0.0.1';
$db   = $env['DB_DATABASE'] ?? 'resortwala';
$user = $env['DB_USERNAME'] ?? 'root';
$pass = $env['DB_PASSWORD'] ?? '';
$port = $env['DB_PORT'] ?? '3306';

try {
    $dsn = "mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4";
    $pdo = new PDO($dsn, $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $msg = "";
} catch (\Exception $e) {
    die("<h1>Database Connection Failed</h1><p>" . $e->getMessage() . "</p>");
}

// -- 2. Handle POST Actions (SQL or Update) --
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // SQL Execution
    if (isset($_POST['sql_query'])) {
        try {
            $sql = trim($_POST['sql_query']);
            $stmt = $pdo->prepare($sql);
            $stmt->execute();
            $rowsAffected = $stmt->rowCount();
            
            if (stripos($sql, 'SELECT') === 0 || stripos($sql, 'SHOW') === 0 || stripos($sql, 'DESCRIBE') === 0) {
                 $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                 $msg = "<div class='success'>Query executed successfully. Rows returned: " . count($rows) . "</div>";
                 // Override action to ensure table is rendered
                 $action = 'sql_result'; 
            } else {
                 $msg = "<div class='success'>Query executed successfully. Rows affected: " . $rowsAffected . "</div>";
            }
        } catch (PDOException $e) {
            $msg = "<div class='error'>SQL Error: " . $e->getMessage() . "</div>";
        }
    }
    
    // Row Update
    if (isset($_POST['update_row'])) {
        try {
            $table = $_POST['table'];
            $pk = $_POST['pk_name'];
            $pkVal = $_POST['pk_value'];
            
            $fields = [];
            $values = [];
            foreach ($_POST as $key => $val) {
                if (strpos($key, 'col_') === 0) {
                    $colName = substr($key, 4);
                    // Handle NULLs
                    if ($val === 'NULL') $val = null;
                    $fields[] = "`$colName` = ?";
                    $values[] = $val;
                }
            }
            $values[] = $pkVal; // For WHERE clause
            
            $sql = "UPDATE `$table` SET " . implode(', ', $fields) . " WHERE `$pk` = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($values);
            $msg = "<div class='success'>Row updated successfully.</div>";
        } catch (Exception $e) {
            $msg = "<div class='error'>Update Failed: " . $e->getMessage() . "</div>";
        }
    }
}

// -- 3. Fetch Tables --
$tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
$selectedTable = $_GET['table'] ?? ($tables[0] ?? null);
$action = $_GET['action'] ?? 'list';
$editId = $_GET['id'] ?? null;

// -- 4. Helper to get PK --
function getPrimaryKey($pdo, $table) {
    $stmt = $pdo->prepare("SHOW KEYS FROM `$table` WHERE Key_name = 'PRIMARY'");
    $stmt->execute();
    $res = $stmt->fetch(PDO::FETCH_ASSOC);
    return $res['Column_name'] ?? null;
}
$pk = $selectedTable ? getPrimaryKey($pdo, $selectedTable) : null;

?>
<!DOCTYPE html>
<html>
<head>
    <title>DB Admin</title>
    <style>
        body { font-family: Inter, sans-serif; padding: 20px; background: #f9fafb; color: #111827; }
        .success { background: #dcfce7; color: #166534; padding: 10px; border-radius: 6px; margin-bottom: 20px; border: 1px solid #bbf7d0; }
        .error { background: #fee2e2; color: #991b1b; padding: 10px; border-radius: 6px; margin-bottom: 20px; border: 1px solid #fecaca; }
        .container { display: flex; gap: 30px; }
        .sidebar { width: 250px; background: white; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .content { flex: 1; background: white; padding: 25px; border-radius: 12px; border: 1px solid #e5e7eb; min-width: 0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        a.table-link { display: block; padding: 8px 12px; margin-bottom: 4px; text-decoration: none; color: #4b5563; border-radius: 6px; font-size: 14px; }
        a.table-link:hover, a.table-link.active { background: #eff6ff; color: #1d4ed8; font-weight: 600; }
        h1 { margin-top: 0; font-size: 20px; display: flex; align-items: center; justify-content: space-between; }
        textarea { width: 100%; height: 100px; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-family: monospace; }
        .btn { background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 500; }
        .btn:hover { background: #1d4ed8; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
        th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
        th { background: #f9fafb; font-weight: 600; color: #374151; }
        tr:hover { background: #f9fafb; }
        .form-group { margin-bottom: 15px; }
        .form-group label { display: block; margin-bottom: 5px; font-weight: 600; font-size: 12px; color: #374151; }
        .form-group input, .form-group textarea { width: 100%; padding: 8px; border: 1px solid #d1d5db; rounded: 6px; font-size: 14px; }
        .actions { margin-bottom: 20px; display: flex; gap: 10px; }
        .badge-pk { background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-left: 5px; }
    </style>
</head>
<body>

    <?= $msg ?>

    <div class="container">
        <div class="sidebar">
            <h3>Tables</h3>
            <?php foreach ($tables as $t): ?>
                <a href="?auth=<?= $correctAuth ?>&table=<?= $t ?>" class="table-link <?= $selectedTable == $t ? 'active' : '' ?>">
                    <?= $t ?>
                </a>
            <?php endforeach; ?>
        </div>

        <div class="content">
            <div class="actions">
                <a href="?auth=<?= $correctAuth ?>&table=<?= $selectedTable ?>&action=list" class="btn" style="background: white; color: #333; border: 1px solid #ccc;">Browse Data</a>
                <a href="?auth=<?= $correctAuth ?>&table=<?= $selectedTable ?>&action=sql" class="btn" style="background: #4b5563;">Run SQL</a>
            </div>

            <?php if ($action === 'sql'): ?>
                <h2>Execute SQL</h2>
                <form method="POST">
                    <textarea name="sql_query" placeholder="UPDATE users SET ..."><?= htmlspecialchars($_POST['sql_query'] ?? '') ?></textarea>
                    <br><br>
                    <button type="submit" class="btn">Execute Query</button>
                </form>
                
                <?php if (isset($rows) && $action === 'sql_result'): ?>
                    <h3>Query Results</h3>
                    <div style="overflow-x: auto;">
                        <table>
                            <thead>
                                <tr>
                                    <?php if (count($rows) > 0): ?>
                                        <?php foreach (array_keys($rows[0]) as $col): ?>
                                            <th><?= htmlspecialchars($col) ?></th>
                                        <?php endforeach; ?>
                                    <?php endif; ?>
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
                    </div>
                <?php endif; ?>
            <?php elseif ($action === 'edit' && $editId && $pk): ?>
                <?php
                    $stmt = $pdo->prepare("SELECT * FROM `$selectedTable` WHERE `$pk` = ?");
                    $stmt->execute([$editId]);
                    $row = $stmt->fetch(PDO::FETCH_ASSOC);
                ?>
                <h2>Edit Row (<?= $pk ?>: <?= $editId ?>)</h2>
                <form method="POST" action="?auth=<?= $correctAuth ?>&table=<?= $selectedTable ?>">
                    <input type="hidden" name="update_row" value="1">
                    <input type="hidden" name="table" value="<?= $selectedTable ?>">
                    <input type="hidden" name="pk_name" value="<?= $pk ?>">
                    <input type="hidden" name="pk_value" value="<?= $editId ?>">

                    <?php foreach ($row as $col => $val): ?>
                        <div class="form-group">
                            <label><?= $col ?></label>
                            <!-- Simple input for all types for now -->
                            <textarea name="col_<?= $col ?>" rows="<?= strlen($val ?? '') > 100 ? 5 : 1 ?>"><?= htmlspecialchars($val ?? '') ?></textarea>
                        </div>
                    <?php endforeach; ?>
                    <button type="submit" class="btn">Save Changes</button>
                </form>

            <?php else: ?>
                <!-- BROWSE MODE -->
                <h1><?= $selectedTable ?> <span style="font-size: 12px; font-weight: normal; color: #666; margin-left: 10px;">(Top 100)</span></h1>
                
                <?php
                    $stmt = $pdo->prepare("SELECT * FROM `$selectedTable` LIMIT 100");
                    $stmt->execute();
                    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                ?>

                <div style="overflow-x: auto;">
                    <table>
                        <thead>
                            <tr>
                                <th>Action</th>
                                <?php if (count($rows) > 0): ?>
                                    <?php foreach (array_keys($rows[0]) as $col): ?>
                                        <th>
                                            <?= $col ?>
                                            <?php if ($col === $pk) echo '<span class="badge-pk">PK</span>'; ?>
                                        </th>
                                    <?php endforeach; ?>
                                <?php endif; ?>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($rows as $row): ?>
                                <tr>
                                    <td>
                                        <?php if ($pk): ?>
                                            <a href="?auth=<?= $correctAuth ?>&table=<?= $selectedTable ?>&action=edit&id=<?= $row[$pk] ?>" style="color: blue; font-weight: bold;">Edit</a>
                                        <?php else: ?>
                                            <span style="color: gray; font-size: 10px;">No PK</span>
                                        <?php endif; ?>
                                    </td>
                                    <?php foreach ($row as $val): ?>
                                        <td title="<?= htmlspecialchars($val) ?>">
                                            <?php
                                                $display = htmlspecialchars(substr($val ?? '', 0, 50));
                                                if (strlen($val ?? '') > 50) $display .= '...';
                                                echo $display ?: '<span style="color:#ccc">NULL</span>';
                                            ?>
                                        </td>
                                    <?php endforeach; ?>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            <?php endif; ?>
        </div>
    </div>
</body>
</html>
