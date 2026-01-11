#!/bin/bash
TARGET="/var/www/html/stagingapi.resortwala.com/.env"
echo "Updating $TARGET..."

# Update Merchant ID
if grep -q "PHONEPE_MERCHANT_ID=" "$TARGET"; then
  sed -i 's/^PHONEPE_MERCHANT_ID=.*/PHONEPE_MERCHANT_ID=M223R7WEM0IRX/' "$TARGET"
else
  echo "PHONEPE_MERCHANT_ID=M223R7WEM0IRX" >> "$TARGET"
fi

# Update Salt Key
if grep -q "PHONEPE_SALT_KEY=" "$TARGET"; then
  sed -i 's/^PHONEPE_SALT_KEY=.*/PHONEPE_SALT_KEY=156711f6-bdb7-4734-b490-f53d25b69d69/' "$TARGET"
else
  echo "PHONEPE_SALT_KEY=156711f6-bdb7-4734-b490-f53d25b69d69" >> "$TARGET"
fi

# Update Env to PROD
if grep -q "PHONEPE_ENV=" "$TARGET"; then
  sed -i 's/^PHONEPE_ENV=.*/PHONEPE_ENV=PROD/' "$TARGET"
else
  echo "PHONEPE_ENV=PROD" >> "$TARGET"
fi

# Update Salt Index (Default 1)
if grep -q "PHONEPE_SALT_INDEX=" "$TARGET"; then
  sed -i 's/^PHONEPE_SALT_INDEX=.*/PHONEPE_SALT_INDEX=1/' "$TARGET"
else
  echo "PHONEPE_SALT_INDEX=1" >> "$TARGET"
fi

echo "Credentials Updated."
echo "Clearing Config Cache..."
cd /var/www/html/stagingapi.resortwala.com
php artisan config:clear
echo "Done."
