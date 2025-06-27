#!/bin/bash

# Script to fix Nextcloud OAuth polling URL to use HTTPS
# Run this on your Nextcloud server as root

echo "Fixing Nextcloud OAuth configuration..."

# Backup current config
cp /var/www/nextcloud/config/config.php /var/www/nextcloud/config/config.php.backup

# Add or update the overwriteprotocol setting
sudo -u www-data php /var/www/nextcloud/occ config:system:set overwriteprotocol --value="https"

# Ensure the trusted domains are set correctly
sudo -u www-data php /var/www/nextcloud/occ config:system:set trusted_domains 1 --value="cloud.marcelgladbach.at"

# Set the overwrite.cli.url to use HTTPS
sudo -u www-data php /var/www/nextcloud/occ config:system:set overwrite.cli.url --value="https://cloud.marcelgladbach.at"

# Clear the cache
sudo -u www-data php /var/www/nextcloud/occ maintenance:repair

echo "Configuration updated. Current settings:"
sudo -u www-data php /var/www/nextcloud/occ config:list system | grep -E "(overwrite|trusted_domains)"

echo ""
echo "If you're using a reverse proxy (nginx), also ensure these headers are set:"
echo "  proxy_set_header X-Forwarded-Proto \$scheme;"
echo "  proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;"
echo "  proxy_set_header Host \$host;"