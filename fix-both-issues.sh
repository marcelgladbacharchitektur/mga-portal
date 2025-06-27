#!/bin/bash

echo "=== Fixing MGA Portal Issues ==="
echo ""

# 1. Fix database/Prisma issues for Tasks
echo "1. Fixing Tasks Page Database Issues..."
echo "   - Regenerating Prisma Client..."
npx prisma generate

echo "   - Syncing database schema..."
npx prisma db push --skip-generate

# 2. Ensure environment variables are loaded
echo ""
echo "2. Checking Calendar Configuration..."
if grep -q "APPLE_CALDAV_URL" .env.local; then
    echo "   ✓ Calendar configuration found in .env.local"
else
    echo "   ✗ Calendar configuration missing! Adding to .env..."
    cat >> .env << EOF

# Apple Calendar Configuration
APPLE_CALDAV_URL=https://caldav.icloud.com
APPLE_ID_EMAIL=marcel@marcelgladbach.at
APPLE_APP_PASSWORD=rdwj-byfr-xalu-wgzo
APPLE_CALENDAR_NAME=Marcel Gladbach Architektur
EOF
    echo "   ✓ Calendar configuration added"
fi

# 3. Install any missing dependencies
echo ""
echo "3. Checking Dependencies..."
if ! npm list tsdav >/dev/null 2>&1; then
    echo "   - Installing tsdav for calendar support..."
    npm install tsdav
else
    echo "   ✓ tsdav already installed"
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Start the development server: npm run dev"
echo "2. Visit http://localhost:3000/tasks to test the Tasks page"
echo "3. Visit http://localhost:3000/calendar to test Apple Calendar sync"
echo ""
echo "If you still see errors:"
echo "- Check the browser console for detailed error messages"
echo "- Visit http://localhost:3000/api/fix-issues (as admin) for diagnostics"