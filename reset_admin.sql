-- Simply update the user password for the admin email
UPDATE users 
SET password = '$2y$12$6yXwM/..HashForResortWala@2024.. (using a known hash for "ResortWala@2024")' 
WHERE email = 'admin@resortwala.com';
-- Wait, I don't have the hash. 
-- I should Use Laravel to generate it or use a simple one if I knew the algorithm (Bcrypt).
-- Better element: Use `php artisan tinker` to reset it. that's safer.
