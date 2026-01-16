$ServerIP = "72.61.242.42"
$User = "root"
$RemotePath = "/var/www/html/api.resortwala.com"

ssh -o StrictHostKeyChecking=no "${User}@${ServerIP}" "cd $RemotePath && php public/check_rates.php"
