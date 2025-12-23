<?php
// Script to revert URLs to IP address
$envFile = '/var/www/html/stagingapi.resortwala.com/.env';
$content = file_get_contents($envFile);

// Revert to IP for testing consistency
$content = preg_replace('/^FRONTEND_ADMIN_URL=.*$/m', 'FRONTEND_ADMIN_URL=http://72.61.242.42/admin', $content);
$content = preg_replace('/^FRONTEND_VENDOR_URL=.*$/m', 'FRONTEND_VENDOR_URL=http://72.61.242.42/vendor', $content); // No /vendor in main IP setup usually? Wait, user accesses it via ? 
// Actually user accesses admin via /admin. The vendor app is likely on a port or subdomain.
// But for "IP" testing, they are likely using mapped ports or paths.
// Let's stick to what was likely there before: Localhost ports or specific IP ports?
// "http://72.61.242.42/admin" for Admin.
// For Vendor, usually it's "http://72.61.242.42/vendor" (if sub-folder deployed) or a different port.
// Given the previous conversation, it seemed they were using ports locally but on server...
// The server config viewed previously showed: http://localhost:3004 etc.
// I will set them to the IP base for now so valid links form, 
// even if they need port adjustment, base IP is safer than hostname for user "click from IP" requirement.

$content = preg_replace('/^FRONTEND_ADMIN_URL=.*$/m', 'FRONTEND_ADMIN_URL=http://72.61.242.42/admin', $content);
$content = preg_replace('/^FRONTEND_VENDOR_URL=.*$/m', 'FRONTEND_VENDOR_URL=http://72.61.242.42/vendor', $content);
$content = preg_replace('/^FRONTEND_CUSTOMER_URL=.*$/m', 'FRONTEND_CUSTOMER_URL=http://72.61.242.42', $content);

file_put_contents($envFile, $content);
echo "URLs reverted to IP based paths.\n";
