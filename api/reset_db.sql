DROP DATABASE IF EXISTS resortwala_staging;
CREATE DATABASE resortwala_staging;
GRANT ALL PRIVILEGES ON resortwala_staging.* TO 'resort_user'@'localhost';
FLUSH PRIVILEGES;
