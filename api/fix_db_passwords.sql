-- Resort Users (Various capitalizations seen in .env)
ALTER USER IF EXISTS 'resort_user'@'localhost' IDENTIFIED BY 'ResortWala@2025';
ALTER USER IF EXISTS 'resortwala_prod'@'localhost' IDENTIFIED BY 'ResortWala@2025';
ALTER USER IF EXISTS 'resortwala_staging'@'localhost' IDENTIFIED BY 'resortwala@2025';

-- KaamCheck Users
CREATE USER IF NOT EXISTS 'kaamcheck_user'@'localhost' IDENTIFIED BY 'resortwala@2025';
GRANT ALL PRIVILEGES ON kaamcheck.* TO 'kaamcheck_user'@'localhost';

-- Carrom Users
CREATE USER IF NOT EXISTS 'carrom_user'@'localhost' IDENTIFIED BY 'resortwala@2025';
GRANT ALL PRIVILEGES ON carromkart.* TO 'carrom_user'@'localhost';

-- General resortwala user
CREATE USER IF NOT EXISTS 'resortwala_user'@'localhost' IDENTIFIED BY 'ResortWala@2025';
GRANT ALL PRIVILEGES ON *.* TO 'resortwala_user'@'localhost';

-- Grants for resort_user and resortwala_prod (Ensuring they have access to all variants)
GRANT ALL PRIVILEGES ON *.* TO 'resort_user'@'localhost';
GRANT ALL PRIVILEGES ON *.* TO 'resortwala_prod'@'localhost';

FLUSH PRIVILEGES;
