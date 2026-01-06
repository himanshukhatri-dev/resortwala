-- Production Database Initialization
CREATE DATABASE IF NOT EXISTS resortwala_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create User (Adjust password as needed)
CREATE USER IF NOT EXISTS 'resortwala_prod'@'localhost' IDENTIFIED BY 'ResortWala@Prod_2026';

-- Grant Permissions
GRANT ALL PRIVILEGES ON resortwala_prod.* TO 'resortwala_prod'@'localhost';

-- Apply Changes
FLUSH PRIVILEGES;
