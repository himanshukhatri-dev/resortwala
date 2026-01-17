-- Comprehensive User Fix for resortwala_prod and others
CREATE USER IF NOT EXISTS 'resortwala_prod'@'localhost' IDENTIFIED BY 'ResortWala@2025';
ALTER USER 'resortwala_prod'@'localhost' IDENTIFIED BY 'ResortWala@2025';
GRANT ALL PRIVILEGES ON *.* TO 'resortwala_prod'@'localhost' WITH GRANT OPTION;

CREATE USER IF NOT EXISTS 'resortwala_prod'@'127.0.0.1' IDENTIFIED BY 'ResortWala@2025';
ALTER USER 'resortwala_prod'@'127.0.0.1' IDENTIFIED BY 'ResortWala@2025';
GRANT ALL PRIVILEGES ON *.* TO 'resortwala_prod'@'127.0.0.1' WITH GRANT OPTION;

CREATE USER IF NOT EXISTS 'resortwala_prod'@'%' IDENTIFIED BY 'ResortWala@2025';
ALTER USER 'resortwala_prod'@'%' IDENTIFIED BY 'ResortWala@2025';
GRANT ALL PRIVILEGES ON *.* TO 'resortwala_prod'@'%' WITH GRANT OPTION;

-- resort_user variants
CREATE USER IF NOT EXISTS 'resort_user'@'localhost' IDENTIFIED BY 'ResortWala@2025';
ALTER USER 'resort_user'@'localhost' IDENTIFIED BY 'ResortWala@2025';
GRANT ALL PRIVILEGES ON *.* TO 'resort_user'@'localhost' WITH GRANT OPTION;

CREATE USER IF NOT EXISTS 'resort_user'@'127.0.0.1' IDENTIFIED BY 'ResortWala@2025';
ALTER USER 'resort_user'@'127.0.0.1' IDENTIFIED BY 'ResortWala@2025';
GRANT ALL PRIVILEGES ON *.* TO 'resort_user'@'127.0.0.1' WITH GRANT OPTION;

-- resortwala_user variants
CREATE USER IF NOT EXISTS 'resortwala_user'@'localhost' IDENTIFIED BY 'ResortWala@2025';
ALTER USER 'resortwala_user'@'localhost' IDENTIFIED BY 'ResortWala@2025';
GRANT ALL PRIVILEGES ON *.* TO 'resortwala_user'@'localhost' WITH GRANT OPTION;

-- resortwala_staging variants
CREATE USER IF NOT EXISTS 'resortwala_staging'@'localhost' IDENTIFIED BY 'resortwala@2025';
ALTER USER 'resortwala_staging'@'localhost' IDENTIFIED BY 'resortwala@2025';
GRANT ALL PRIVILEGES ON *.* TO 'resortwala_staging'@'localhost' WITH GRANT OPTION;

FLUSH PRIVILEGES;
