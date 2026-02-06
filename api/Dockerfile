FROM php:8.2-fpm

# Install dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpng-dev \
    libjpeg62-turbo-dev \
    libfreetype6-dev \
    locales \
    zip \
    jpegoptim optipng pngquant gifsicle \
    vim \
    unzip \
    git \
    curl \
    libonig-dev \
    libzip-dev \
    libgd-dev

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install extensions
RUN docker-php-ext-install pdo_mysql mbstring zip exif pcntl
RUN docker-php-ext-configure gd --with-freetype --with-jpeg
RUN docker-php-ext-install gd

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy only composer files first for better caching
COPY composer.json composer.lock /var/www/html/

# Install dependencies (ignoring scripts as we don't have the full code yet)
RUN composer install --no-interaction --no-plugins --no-scripts --no-dev --prefer-dist

# Now copy the rest of the code
COPY . /var/www/html

# Final composer optimization and permissions
RUN composer dump-autoload --optimize --no-dev
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Prevent symlink errors
RUN rm -rf /var/www/html/public/storage

EXPOSE 9000
CMD ["php-fpm"]
