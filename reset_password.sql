ALTER USER 'resortwala_prod'@'localhost' IDENTIFIED BY 'ResortWala@Prod_2026';
GRANT ALL PRIVILEGES ON resortwala_prod.* TO 'resortwala_prod'@'localhost';
FLUSH PRIVILEGES;
