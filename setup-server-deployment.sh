#!/bin/bash

# Setup script for MGA Portal deployment on server
# Run this script on the server as root

echo "Setting up MGA Portal deployment..."

# Create deploy user if it doesn't exist
if ! id -u deploy > /dev/null 2>&1; then
    echo "Creating deploy user..."
    useradd -m -s /bin/bash deploy
    usermod -aG sudo deploy
fi

# Create directory structure
echo "Creating directory structure..."
mkdir -p /home/deploy/mga-portal
chown -R deploy:deploy /home/deploy

# Switch to deploy user for the rest
su - deploy << 'EOF'

# Install Node.js 20 if not already installed
if ! command -v node &> /dev/null || [ $(node -v | cut -d'.' -f1 | cut -d'v' -f2) -lt 20 ]; then
    echo "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 globally if not already installed
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
fi

# Clone repository if not already cloned
if [ ! -d "/home/deploy/mga-portal/.git" ]; then
    echo "Cloning repository..."
    cd /home/deploy
    git clone https://github.com/marcelgladbacharchitektur/mga-portal.git
    cd mga-portal
else
    echo "Repository already exists, pulling latest changes..."
    cd /home/deploy/mga-portal
    git pull origin main
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cat > .env << 'ENVFILE'
# Authentication
NEXTAUTH_URL=https://portal.marcelgladbach.at
NEXTAUTH_SECRET=your-secret-key-here-please-change-in-production

# Database (Supabase)
DATABASE_URL=postgresql://...
DATABASE_URL_POOLED=postgresql://...
DATABASE_URL_DIRECT=postgresql://...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Nextcloud
NEXTCLOUD_URL=https://cloud.marcelgladbach.at
NEXTCLOUD_USER=your-nextcloud-username
NEXTCLOUD_APP_PASSWORD=your-nextcloud-app-password

# Google OAuth (optional)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
ENVFILE
    echo "Please edit .env file with your actual values!"
fi

# Install dependencies
echo "Installing dependencies..."
npm ci

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Build the application
echo "Building application..."
npm run build

# Start with PM2
echo "Starting application with PM2..."
pm2 delete mga-portal 2>/dev/null || true
pm2 start npm --name "mga-portal" -- start
pm2 save
pm2 startup systemd -u deploy --hp /home/deploy

echo "Deployment setup complete!"
echo "The application should now be running on port 3000"
echo ""
echo "Next steps:"
echo "1. Edit /home/deploy/mga-portal/.env with your actual values"
echo "2. Restart the application: pm2 restart mga-portal"
echo "3. Configure Caddy reverse proxy to serve the application"

EOF

# Configure PM2 startup
echo "Configuring PM2 startup..."
env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u deploy --hp /home/deploy

echo "Server deployment setup complete!"