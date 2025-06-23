#!/bin/bash

# Script to completely remove Nextcloud and free up disk space
# Run this on the server as root

echo "=== Nextcloud Complete Removal Script ==="
echo "This will remove Nextcloud and all its data!"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "1. Stopping Nextcloud container..."
docker stop nextcloud-admin 2>/dev/null || echo "Container not running"

echo ""
echo "2. Removing Nextcloud container..."
docker rm nextcloud-admin 2>/dev/null || echo "Container not found"

echo ""
echo "3. Removing Nextcloud images..."
docker images | grep nextcloud | awk '{print $3}' | xargs -r docker rmi -f

echo ""
echo "4. Removing Nextcloud volumes..."
docker volume ls | grep nextcloud | awk '{print $2}' | xargs -r docker volume rm

echo ""
echo "5. Removing Nextcloud data directories..."
rm -rf /var/lib/docker/volumes/*nextcloud*
rm -rf /opt/nextcloud 2>/dev/null
rm -rf /var/www/nextcloud 2>/dev/null

echo ""
echo "6. Cleaning up Docker system..."
docker system prune -a --volumes -f

echo ""
echo "7. Removing Caddy configuration for Nextcloud..."
sed -i '/cloud\.marcelgladbach\.at/,/^$/d' /etc/caddy/Caddyfile
systemctl reload caddy

echo ""
echo "8. Checking disk space before and after..."
echo "Disk usage:"
df -h

echo ""
echo "9. Finding large files and directories..."
echo "Largest directories in /var:"
du -h /var | sort -rh | head -20

echo ""
echo "10. Cleaning package cache..."
apt-get clean
apt-get autoremove -y

echo ""
echo "11. Cleaning journal logs (keeping last 2 days)..."
journalctl --vacuum-time=2d

echo ""
echo "12. Finding and removing old Docker logs..."
find /var/lib/docker/containers/ -name "*.log" -exec truncate -s 0 {} \;

echo ""
echo "=== Cleanup Complete ==="
echo ""
echo "Final disk usage:"
df -h

echo ""
echo "Additional cleanup options:"
echo "- Check for large log files: find /var/log -type f -size +100M"
echo "- Check npm cache: du -sh ~/.npm"
echo "- Check PM2 logs: pm2 flush"
echo ""
echo "Nextcloud has been completely removed!"