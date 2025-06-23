# MGA Portal - Deployment Guide

## GitHub Secrets Setup

You need to add the following secrets to your GitHub repository:

1. Go to your repository on GitHub
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret" and add:

### Required Secrets

#### `HOST`
- Value: `157.90.232.184`
- Description: Your server's IP address

#### `USERNAME`
- Value: `root`
- Description: SSH username for deployment

#### `PASSWORD`
- Value: (your root password)
- Description: SSH password for root user

#### `PORT`
- Value: `22`
- Description: SSH port (default: 22)

## Server Setup (First Time Only)

1. SSH into your server:
```bash
ssh root@157.90.232.184
```

2. Run the setup script:
```bash
# Download and run the setup script
curl -o setup-deployment.sh https://raw.githubusercontent.com/marcelgladbacharchitektur/mga-portal/main/setup-server-deployment.sh
chmod +x setup-deployment.sh
./setup-deployment.sh
```

3. Configure the deploy user's SSH key:
```bash
# As root, add the SSH public key for deploy user
mkdir -p /home/deploy/.ssh
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIImufWHuLlVNjQFxGh7jhywL85DvoRnOy/PVLKjVOwPq github-actions" > /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

4. Update the application path in GitHub Actions:
```bash
# The application is now at /home/deploy/mga-portal
# Update the deploy.yml if needed
```

## Manual Deployment

If you need to deploy manually:

```bash
# SSH into server as deploy user
ssh deploy@157.90.232.184

# Navigate to project
cd /home/deploy/mga-portal

# Pull latest changes
git pull origin main

# Install dependencies
npm ci --production

# Run migrations
npx prisma migrate deploy

# Build application
npm run build

# Restart PM2
pm2 restart mga-portal
```

## Monitoring

Check application status:
```bash
pm2 status
pm2 logs mga-portal
```

Check Caddy (reverse proxy):
```bash
sudo systemctl status caddy
sudo journalctl -u caddy -f
```

## Troubleshooting

### Application won't start
```bash
pm2 logs mga-portal --lines 100
cd /home/deploy/mga-portal
npm run build
pm2 restart mga-portal
```

### Database connection issues
- Check .env file has correct DATABASE_URL
- Verify Supabase is accessible
- Check for migration issues: `npx prisma migrate status`

### Port conflicts
- Application runs on port 3000
- Check nothing else is using it: `sudo lsof -i :3000`

## Automatic Deployment

Once GitHub secrets are configured, deployment happens automatically when:
- You push to the `main` branch
- You manually trigger the workflow from Actions tab

The workflow will:
1. Connect to server via SSH
2. Pull latest code
3. Install dependencies
4. Run database migrations
5. Build the application
6. Restart PM2 process