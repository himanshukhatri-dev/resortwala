#!/bin/bash
ffmpeg -y -v verbose \
-loop 1 -t 3 -i /var/www/html/api.resortwala.com/storage/app/public/properties/OImpf4YBCXtMJErMeX.jpg \
-i /var/www/html/api.resortwala.com/public/resortwala-logo.png \
-filter_complex "[1:v]scale=180:-1[vLogoIn];[0:v][vLogoIn]overlay=20:20" \
-f mp4 -c:v libx264 -pix_fmt yuv420p /dev/null
