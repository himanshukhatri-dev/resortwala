<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class ServerMigrationController extends Controller
{
    private $keyStoragePath = 'migration/keys';

    /**
     * Terminology:
     * - Destination (This Server): The server running this code (where we want data TO be).
     * - Source (Remote Server): The server we are migrating FROM.
     */

    public function generateKeys()
    {
        // 1. Generate SSH Key Pair (if not exists)
        try {
            $path = storage_path('app/' . $this->keyStoragePath);
            if (!file_exists($path)) {
                mkdir($path, 0700, true);
            }

            $privateKey = $path . '/id_rsa_migration';
            $publicKey = $privateKey . '.pub';

            if (!file_exists($privateKey)) {
                // Generate secure RSA key
                // -N "" : empty passphrase
                // -f : filename
                $cmd = "ssh-keygen -t rsa -b 4096 -f \"$privateKey\" -N \"\" -C \"migration-manager\"";
                shell_exec($cmd);
                chmod($privateKey, 0600); // Critical: SSH rejects 775
            } else {
                 // Ensure permissions even if file exists
                 chmod($privateKey, 0600);
            }

            return response()->json([
                'status' => 'success',
                'public_key' => file_get_contents($publicKey),
                'private_key_path' => $privateKey // Internal use only
            ]);

        } catch (\Exception $e) {
            Log::error("Migration Key Gen Failed: " . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    public function checkConnection(Request $request)
    {
        $request->validate([
            'ip' => 'required|ip',
            'user' => 'required|string',
        ]);

        $ip = $request->ip;
        $user = $request->user;
        $privateKeyPath = storage_path('app/' . $this->keyStoragePath . '/id_rsa_migration');

        if (!file_exists($privateKeyPath)) {
            return response()->json(['status' => 'error', 'message' => 'SSH Keys not generated yet.'], 400);
        }

        // Test Connection via SSH
        // -o BatchMode=yes : Fail if password required
        // -o ConnectTimeout=5
        // -i : Identity file
        // 1. Try Custom Key
        $cmd = "ssh -i \"$privateKeyPath\" -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o BatchMode=yes -o ConnectTimeout=5 $user@$ip \"echo 'connected'\" 2>&1";
        $output = shell_exec($cmd);

        if (str_contains($output, 'connected')) {
            return response()->json([
                'status' => 'success', 
                'message' => 'Connection Successful (Custom Key)!',
                'sudo_check' => $this->checkSudo($ip, $user, $privateKeyPath)
            ]);
        }
        
        // 2. Try System Key (Fallback)
        // Omit -i, use default identity.
        $cmdFallback = "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o BatchMode=yes -o ConnectTimeout=5 $user@$ip \"echo 'connected'\" 2>&1";
        $outputFallback = shell_exec($cmdFallback);

        if (str_contains($outputFallback, 'connected')) {
             return response()->json([
                'status' => 'success', 
                'message' => 'Connection Successful (System Key)!',
                'sudo_check' => $this->checkSudo($ip, $user, null) // Pass null for system key
            ]);
        }

        // Diagnosis Info
        $currentUser = trim(shell_exec('whoami'));
        
        return response()->json([
            'status' => 'error', 
            'message' => 'Connection Failed. Neither Custom Key nor System Key worked.',
            'debug' => "Running as user: [$currentUser]. Custom: $output | System: $outputFallback"
        ], 400);
    }

    private function checkSudo($ip, $user, $keyPath = null)
    {
        $identity = $keyPath ? "-i \"$keyPath\"" : "";
        $cmd = "ssh $identity -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o BatchMode=yes $user@$ip \"sudo -n true 2>&1\"";
        $output = shell_exec($cmd);
        return (trim($output) === "") ? true : false;
    }

    public function scanSource(Request $request)
    {
        $sourceIp = $request->input('source_ip');
        $sourceUser = $request->input('source_user') ?: 'root';
        $dbUser = $request->input('source_db_user');
        $dbPass = $request->input('source_db_pass');
        $dbHost = $request->input('source_host') ?: '127.0.0.1';

        try {
            // Helper for execution (Local or Remote)
            $run = function($cmd) use ($sourceIp, $sourceUser) {
                if ($sourceIp) {
                    try {
                        $ssh = $this->getSshCommand($sourceIp, $sourceUser);
                        return shell_exec("$ssh \"$cmd\"");
                    } catch (\Exception $e) {
                        Log::warning("SSH Scan Fallback Failed: " . $e->getMessage());
                        // Fallback to local if SSH fails? Better to error out if they explicitly gave an IP.
                        throw $e;
                    }
                }
                return shell_exec($cmd);
            };

            // 1. System Info
            $os = trim($run("cat /etc/os-release | grep PRETTY_NAME | cut -d= -f2 | tr -d '\"'"));
            $php = trim($run("php -v | head -n 1 | cut -d' ' -f2"));
            
            // 2. Disk Usage (/var/www)
            $diskRaw = $run("du -sh /var/www/html 2>/dev/null | cut -f1");
            $disk = trim($diskRaw) ?: 'Unknown';

            // 3. Nginx Sites
            $nginxSitesRaw = $run("ls /etc/nginx/sites-enabled 2>/dev/null");
            $nginxSites = array_filter(explode("\n", $nginxSitesRaw));

            // 4. Databases
            $dbUser = $request->input('source_db_user');
            $dbPass = $request->input('source_db_pass');
            $dbHost = $request->input('source_host') ?: '127.0.0.1';

            $auth = "";
            if ($dbUser) $auth .= " -u\"$dbUser\"";
            if ($dbPass) $auth .= " -p\"$dbPass\"";
            if ($dbHost) $auth .= " -h\"$dbHost\"";
            
            // If No sensitive inputs provided, try default local
            if (empty($auth)) {
                 $cmdBase = "mysql -e 'SHOW DATABASES;'";
            } else {
                 $cmdBase = "mysql $auth -e 'SHOW DATABASES;'";
            }

            Log::info("Scanning DBs with: $cmdBase");
            // Remove 2>/dev/null to capture errors
            $dbsOutput = $run("$cmdBase 2>&1"); // redirect stderr to stdout to catch errors
            Log::info("DB Scan Raw Output: " . substr($dbsOutput, 0, 500)); 

            // Check for explicit errors
            if (str_contains($dbsOutput, 'Access denied') || str_contains($dbsOutput, 'Can\'t connect') || str_contains($dbsOutput, 'command not found')) {
                 // Return the error as a special "error" DB or handle gracefully? 
                 // For now, let's log it and return empty, but maybe throw if critical?
                 // Actually, let's throw so the UI sees the scan failure? 
                 // Or better: Return empty but log why.
                 Log::error("DB Scan Error detected: $dbsOutput");
                 // We can't return mixed types easily to current UI, so let's throw to trigger the error modal
                 throw new \Exception("Database Connection Failed: " . trim(substr($dbsOutput, 0, 200)));
            }

            // PHP Parsing (More Robust)
            $lines = explode("\n", trim($dbsOutput));
            $dbs = [];
            $ignored = ['Database', 'information_schema', 'performance_schema', 'mysql', 'sys'];
            
            foreach ($lines as $line) {
                $line = trim($line);
                if (empty($line)) continue;
                if (in_array($line, $ignored)) continue;
                if (str_starts_with($line, 'mariadb.sys')) continue; // Common in MariaDB
                
                $dbs[] = $line;
            }

            // Get DB Sizes (Approx)
            $dbSizes = [];
            foreach ($dbs as $db) {
                // Use same auth for size query
                $q = "SELECT round(sum(data_length + index_length) / 1024 / 1024, 2) FROM information_schema.TABLES WHERE table_schema = '$db'";
                $sizeCmd = empty($auth) ? "mysql -N -e \"$q\"" : "mysql $auth -N -e \"$q\"";
                $size = trim($run("$sizeCmd 2>/dev/null"));
                $dbSizes[] = ['name' => $db, 'size_mb' => $size];
            }

            // 5. Detect Web Roots (Project Codebases)
            $codebases = [];
            $webRoots = [];
            if (!empty($nginxSites)) {
               foreach ($nginxSites as $site) {
                   $root = trim($run("grep 'root' /etc/nginx/sites-enabled/$site | head -n 1 | awk '{print $2}' | tr -d ';'"));
                   if ($root) {
                       $webRoots[] = ['site' => $site, 'root' => $root];
                   }
                   if ($root && $root !== '/var/www/html') { // Exclude default if needed, or include all
                       $size = trim($run("du -sh \"$root\" | cut -f1"));
                       $codebases[] = ['site' => $site, 'path' => $root, 'size' => $size];
                   }
               }
            }

            // 6. Media / Storage
            $mediaInfo = [];
            // Scan for common media folders in the detected roots
            foreach ($codebases as $cb) {
                // Check if storage/app/public exists
                $storage = $cb['path'] . '/storage/app/public';
                if (trim($run("[ -d \"$storage\" ] && echo 'yes'")) === 'yes') {
                     $sSize = trim($run("du -sh \"$storage\" | cut -f1"));
                     $mediaInfo[] = ['path' => $storage, 'size' => $sSize];
                }
                
                // Check for public/uploads based
                $uploads = $cb['path'] . '/public/uploads';
                 if (trim($run("[ -d \"$uploads\" ] && echo 'yes'")) === 'yes') {
                     $uSize = trim($run("du -sh \"$uploads\" | cut -f1"));
                     $mediaInfo[] = ['path' => $uploads, 'size' => $uSize];
                }
            }

            return response()->json([
                'status' => 'success',
                'system' => ['os' => $os, 'php' => $php],
                'disk' => ['www_size' => $disk],
                'nginx' => $nginxSites,
                'databases' => $dbSizes,
                'web_roots' => $webRoots, // Legacy list
                'codebases' => $codebases, // New Full Project list
                'media' => $mediaInfo
            ]);

        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    public function autoSetup(Request $request)
    {
        $request->validate(['ip' => 'required', 'user' => 'required', 'password' => 'required']);
        
        $ip = $request->ip;
        $user = $request->user;
        $password = escapeshellcmd($request->password); // Basic escaping, but prefer process input
        $keyPath = storage_path('app/' . $this->keyStoragePath . '/id_rsa_migration.pub');

        if (!file_exists($keyPath)) return response()->json(['error' => 'Keys not found'], 400);

        $pubKey = trim(file_get_contents($keyPath));
        
        // Use sshpass to auto-append key
        // sshpass -p 'pass' ssh -o StrictHostKeyChecking=no user@ip "mkdir -p ~/.ssh && echo 'key' >> ~/.ssh/authorized_keys"
        
        $remoteCmd = "mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo \'$pubKey\' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys";
        
        // Using pipeline to pass password securely? sshpass is cleaner for this quick hack.
        // WARNING: Password visible in ps aux (briefly). For internal migration tool, acceptable risk vs convenience.
        // better: use sshpass -e and correct ENV
        
        putenv("SSHPASS=$request->password");
        $cmd = "sshpass -e ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $user@$ip \"$remoteCmd\" 2>&1";

        $output = shell_exec($cmd);
        
        // Verify
        if ($output && (str_contains($output, 'Permission denied') || str_contains($output, 'password:'))) {
             return response()->json(['status' => 'error', 'message' => 'Password Authentication Failed', 'debug' => $output], 403);
        }

        return response()->json(['status' => 'success', 'message' => 'Key Installed Successfully']);
    }

    /**
     * Helper to determine valid SSH command (Custom Key vs System Key)
     */
    private function getSshCommand($ip, $user)
    {
        $keyPath = storage_path('app/' . $this->keyStoragePath . '/id_rsa_migration');
        
        // 1. Try Custom Key
        $customCmd = "ssh -i \"$keyPath\" -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o BatchMode=yes $user@$ip";
        $test = shell_exec("$customCmd \"echo ok\" 2>&1");
        if (str_contains($test, 'ok')) return $customCmd;

        // 2. Try System Fallback
        $systemCmd = "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o BatchMode=yes $user@$ip";
        $test2 = shell_exec("$systemCmd \"echo ok\" 2>&1");
        if (str_contains($test2, 'ok')) return $systemCmd;

        throw new \Exception("SSH Connection Failed to $ip. neither custom key nor system key worked.");
    }

    public function migrateAsset(Request $request) {
        set_time_limit(3000); // 50 mins
        
        $type = $request->input('type');
        $name = $request->input('name');
        
        $destIp = $request->input('ip');
        $destUser = $request->input('user') ?? 'root';
        $sourceIp = $request->input('source_ip');
        $sourceUser = $request->input('source_user') ?? 'root';
        
        if (!$destIp) return response()->json(['status' => 'error', 'message' => 'Destination IP Missing'], 400);

        // Resolve valid SSH commands
        try {
            $sshDest = $this->getSshCommand($destIp, $destUser);
            $sshSource = $sourceIp ? $this->getSshCommand($sourceIp, $sourceUser) : null;
        } catch (\Exception $e) {
             return response()->json(['status' => 'error', 'message' => $e->getMessage()], 400);
        }

        try {
            if ($type === 'database') {
                // 1. Create DB on Destination
                exec("$sshDest \"mysql -e 'CREATE DATABASE IF NOT EXISTS \`$name\`'\" 2>&1", $output, $ret);
                if ($ret !== 0) throw new \Exception("Remote DB Creation Failed: " . implode("\n", $output));

                // 2. Dump and Pipe
                $dbUser = env('DB_USERNAME', 'root');
                $dbPass = env('DB_PASSWORD', '');
                
                // If special DB user/pass provided for source in request (e.g. from scan)
                // Actually maybe just use what's env or if provided? Let's assume env for now or request
                $dbUser = $request->input('source_db_user') ?: $dbUser;
                $dbPass = $request->input('source_db_pass') ?: $dbPass;
                $dbHost = $request->input('source_host') ?: '127.0.0.1';

                $localAuth = "-h \"$dbHost\" -u \"$dbUser\"";
                if (!empty($dbPass)) $localAuth .= " -p\"$dbPass\"";

                // If $sshSource exists, run mysqldump through it
                $dumpCmd = $sshSource ? "$sshSource \"mysqldump --quote-names --opt $localAuth $name\"" : "mysqldump --quote-names --opt $localAuth $name";
                $cmd = "$dumpCmd | $sshDest \"mysql $name\"";
                
                exec($cmd . " 2>&1", $output, $returnVar);
                
                if ($returnVar !== 0) throw new \Exception("DB Push Failed: " . implode("\n", $output));
                
                return response()->json(['status' => 'success', 'message' => "Database $name Pushed to $destIp"]);

            } elseif ($type === 'media') {
                 // Push Rysnc
                 // Source side check: if $sshSource exists, we might need a different check
                 // For now, let's assume if it's media, it exists on filesystem where PHP can see it OR we use $sshSource
                 
                 $src = rtrim($name, '/') . '/';
                 $destPath = rtrim($name, '/') . '/';
                 exec("$sshDest \"mkdir -p $name\"");
                 
                 // Extract Identity file from sshDest if present
                 $identityDest = "";
                 if (preg_match('/-i\s+"[^"]+"/', $sshDest, $matches)) {
                     $identityDest = $matches[0];
                 }
                 
                 // Rsync from $sourceUser@$sourceIp to $destUser@$destIp?
                 // That would be a remote-to-remote rsync.
                 // Better: PHP triggers local rsync. If $sshSource is used, it means PHP user doesn't have permissions.
                 // So we run rsync AS $sourceUser via SSH.
                 if ($sshSource) {
                      // We need to pass the SSH identity to the remote source so it can talk to dest? 
                      // Or just rsync locally if $sshSource is just for DB?
                      // Usually media is readable by www-data or we can chmod it.
                      // Let's stick to local rsync for now unless they complain about media permission.
                 }

                 $cmd = "rsync -avz -e \"ssh $identityDest -o StrictHostKeyChecking=no\" \"$src\" $destUser@$destIp:\"$destPath\"";
                 
                 exec($cmd . " 2>&1", $output, $returnVar);
                 if ($returnVar !== 0) throw new \Exception("Rsync Push Failed: " . implode("\n", $output));
                 
                 return response()->json(['status' => 'success', 'message' => "Synced $name to $destIp"]);

            } elseif ($type === 'site') {
                $localFile = "/etc/nginx/sites-enabled/$name";
                if (!file_exists($localFile)) throw new \Exception("Local Nginx config not found: $localFile");

                // Extract Identity file from sshDest if present
                 $identityDest = "";
                 if (preg_match('/-i\s+"[^"]+"/', $sshDest, $matches)) {
                     $identityDest = $matches[0];
                 }
                
                // Ensure Remote Directory Exists
                exec("$sshDest \"mkdir -p /etc/nginx/sites-enabled\"", $outputMw, $retMw);

                // SCP with -o UserKnownHostsFile=/dev/null to prevent /var/www check failure
                $cmd = "scp $identityDest -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o BatchMode=yes \"$localFile\" $destUser@$destIp:/etc/nginx/sites-enabled/$name";
                
                exec($cmd . " 2>&1", $output, $returnVar);
                if ($returnVar !== 0) throw new \Exception("SCP Failed: " . implode("\n", $output));
                
                return response()->json(['status' => 'success', 'message' => "Pushed Nginx Config for $name"]);

            } elseif ($type === 'codebase') {
                 // Push Rsync (Recursive Project Root)
                 // This effectively copies "everything" (code, vendor, public, etc)
                 
                 // Name is the FULL PATH in this case (from scan codebase.path)
                 if (!file_exists($name)) throw new \Exception("Local path not found: $name");
                 
                 $src = rtrim($name, '/') . '/';
                 $destPath = rtrim($name, '/') . '/'; // Mirror path structure (e.g. /var/www/html/project/)
                 
                 // Ensure dest parent exists
                 exec("$sshDest \"mkdir -p $name\""); // Recursively create path
                 
                 $identityDest = "";
                 if (preg_match('/-i\s+"[^"]+"/', $sshDest, $matches)) {
                     $identityDest = $matches[0];
                 }

                 // If using Source Elevation for read access? 
                 // If the files are owned by user/root and web user cant read, this will fail.
                 // But typically web user can read web files.
                 // If fail, we might need 'sudo rsync' which is complex.
                 
                 // Exclude typical noise
                 $excludes = "--exclude 'node_modules' --exclude '.git' --exclude 'storage/*.log'";

                 $cmd = "rsync -avz $excludes -e \"ssh $identityDest -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null\" \"$src\" $destUser@$destIp:\"$destPath\"";
                 
                 exec($cmd . " 2>&1", $output, $returnVar);
                 if ($returnVar !== 0) throw new \Exception("Codebase Rsync Failed: " . implode("\n", $output));
                 
                 return response()->json(['status' => 'success', 'message' => "Synced Codebase $name to $destIp"]);
            }
            return response()->json(['status' => 'error', 'message' => 'Unknown Type'], 400);

        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }
}
