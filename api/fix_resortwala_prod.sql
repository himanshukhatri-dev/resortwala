-- Comprehensive User Fix for resortwala_prod
CREATE USER IF NOT EXISTS 'resortwala_prod'@'localhost' IDENTIFIED BY 'ResortWala@Prod_2026';
ALTER USER 'resortwala_prod'@'localhost' IDENTIFIED BY 'ResortWala@Prod_2026';
GRANT ALL PRIVILEGES ON resortwala_prod.* TO 'resortwala_prod'@'localhost';

CREATE USER IF NOT EXISTS 'resortwala_prod'@'127.0.0.1' IDENTIFIED BY 'ResortWala@Prod_2026';
ALTER USER 'resortwala_prod'@'127.0.0.1' IDENTIFIED BY 'ResortWala@Prod_2026';
GRANT ALL PRIVILEGES ON resortwala_prod.* TO 'resortwala_prod'@'127.0.0.1';

FLUSH PRIVILEGES;
