#!/bin/bash

# Free Deployment Checklist Script
# Run this before deploying to ensure everything is ready

echo "🚀 Escalation Portal - Free Deployment Checklist"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check 1: Git repository
echo -n "✓ Checking Git repository... "
if git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${GREEN}OK${NC}"
    REMOTE=$(git remote get-url origin 2>/dev/null)
    echo "  Remote: $REMOTE"
else
    echo -e "${RED}FAILED${NC}"
    echo "  Please initialize git and push to GitHub"
    exit 1
fi

# Check 2: Uncommitted changes
echo -n "✓ Checking for uncommitted changes... "
if [[ -z $(git status -s) ]]; then
    echo -e "${GREEN}Clean${NC}"
else
    echo -e "${YELLOW}WARNING${NC}"
    echo "  You have uncommitted changes. Consider committing before deploy:"
    git status -s
fi

# Check 3: Backend dependencies
echo -n "✓ Checking backend dependencies... "
if [ -f "backend/package.json" ] && [ -d "backend/node_modules" ]; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${YELLOW}WARNING${NC}"
    echo "  Run: cd backend && npm install"
fi

# Check 4: Frontend dependencies
echo -n "✓ Checking frontend dependencies... "
if [ -f "frontend/package.json" ] && [ -d "frontend/node_modules" ]; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${YELLOW}WARNING${NC}"
    echo "  Run: cd frontend && npm install"
fi

# Check 5: Backend builds
echo -n "✓ Testing backend build... "
cd backend
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAILED${NC}"
    echo "  Backend build failed. Fix errors before deploying."
    exit 1
fi
cd ..

# Check 6: Frontend builds
echo -n "✓ Testing frontend build... "
cd frontend
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAILED${NC}"
    echo "  Frontend build failed. Fix errors before deploying."
    exit 1
fi
cd ..

# Check 7: Migrations
echo -n "✓ Checking database migrations... "
if [ -d "backend/migrations" ]; then
    MIGRATION_COUNT=$(ls backend/migrations/*.sql 2>/dev/null | wc -l)
    echo -e "${GREEN}OK${NC} (${MIGRATION_COUNT} migrations found)"
else
    echo -e "${RED}FAILED${NC}"
    exit 1
fi

echo ""
echo "=================================================="
echo -e "${GREEN}✅ All checks passed!${NC}"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Generate JWT Secret:"
echo "   node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
echo ""
echo "2. Deploy Backend to Render:"
echo "   → https://render.com/"
echo "   → New Web Service → Connect GitHub"
echo "   → Root Directory: backend"
echo "   → Build: npm install && npm run build"
echo "   → Start: npm start"
echo ""
echo "3. Deploy Frontend to Vercel:"
echo "   → https://vercel.com/"
echo "   → Import Project → Connect GitHub"
echo "   → Root Directory: frontend"
echo ""
echo "4. Read the full guide:"
echo "   → cat FREE_DEPLOYMENT.md"
echo ""
echo "🎉 Good luck with your deployment!"

