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
        $cmd = "ssh -i \"$privateKeyPath\" -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o BatchMode=yes -o ConnectTimeout=5 $user@$ip \"echo 'connected'\" 2>&1";
        
        $output = shell_exec($cmd);

        if (trim($output) === 'connected') {
            return response()->json([
                'status' => 'success', 
                'message' => 'Connection Successful!',
                'sudo_check' => $this->checkSudo($ip, $user, $privateKeyPath)
            ]);
        } else {
            return response()->json([
                'status' => 'error', 
                'message' => 'Connection Failed. Ensure Public Key is added to Source.',
                'debug' => $output
            ], 400);
        }
    }

    private function checkSudo($ip, $user, $keyPath)
    {
        // Check if user has sudo privileges
        $cmd = "ssh -i \"$keyPath\" -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o BatchMode=yes $user@$ip \"sudo -n true 2>&1\"";
        $output = shell_exec($cmd);
        // If output is empty, sudo worked. If "sudo: a password is required", it failed (for passwordless sudo).
        // If we want interactive sudo, that's harder. ideally root or passwordless sudo.
        return (trim($output) === "") ? true : false;
    }

    public function scanSource(Request $request)
    {
        $request->validate(['ip' => 'required', 'user' => 'required']);
        $ip = $request->ip;
        $user = $request->user;
        $keyPath = storage_path('app/' . $this->keyStoragePath . '/id_rsa_migration');

        if (!file_exists($keyPath)) return response()->json(['error' => 'Keys not found'], 400);

        // Helper to run remote command
        $run = function($cmd) use ($ip, $user, $keyPath) {
             $sshCmd = "ssh -i \"$keyPath\" -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o BatchMode=yes $user@$ip \"$cmd\"";
             return shell_exec($sshCmd);
        };

        try {
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
            // NOTE: This assumes passwordless mysql access (e.g. .my.cnf) OR root user credentials are standardized.
            // If failed, we might need to ask for DB pass in Step 1.
            // Trying generic 'root' access first.
            $dbsRaw = $run("mysql -e 'SHOW DATABASES;' 2>/dev/null | grep -v Database | grep -v information_schema | grep -v performance_schema | grep -v mysql | grep -v sys");
            $dbs = array_filter(explode("\n", $dbsRaw));

            // Get DB Sizes (Approx)
            $dbSizes = [];
            foreach ($dbs as $db) {
                // Determine size
                $q = "SELECT round(sum(data_length + index_length) / 1024 / 1024, 2) FROM information_schema.TABLES WHERE table_schema = '$db'";
                $size = trim($run("mysql -N -e \"$q\" 2>/dev/null"));
                $dbSizes[] = ['name' => $db, 'size_mb' => $size];
            }

            // 5. Detect Web Roots (Heuristic)
            $webRoots = [];
            if (!empty($nginxSites)) {
               foreach ($nginxSites as $site) {
                   // Grep root directive
                   $root = trim($run("grep 'root' /etc/nginx/sites-enabled/$site | head -n 1 | awk '{print $2}' | tr -d ';'"));
                   $webRoots[] = ['site' => $site, 'root' => $root];
               }
            }

            return response()->json([
                'status' => 'success',
                'system' => ['os' => $os, 'php' => $php],
                'disk' => ['www_size' => $disk],
                'nginx' => $nginxSites,
                'databases' => $dbSizes,
                'web_roots' => $webRoots
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
}
