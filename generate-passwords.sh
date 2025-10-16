#!/bin/bash

# Database Security Password Generator
# This script generates secure passwords for your database users

echo "🔐 Database Security Password Generator"
echo "======================================"
echo ""

echo "📋 Generated Passwords:"
echo ""

echo "1. Service User Password (escalation_portal_service):"
echo "   $(openssl rand -base64 32)"
echo ""

echo "2. Read-Only User Password (escalation_portal_readonly):"
echo "   $(openssl rand -base64 32)"
echo ""

echo "3. JWT Secret (if you want to update it):"
echo "   $(openssl rand -base64 64)"
echo ""

echo "⚠️  IMPORTANT:"
echo "   - Save these passwords securely"
echo "   - Update your .env file with the service user password"
echo "   - Update Supabase database user passwords"
echo "   - Update your production environment variables"
echo ""

echo "🔗 Next Steps:"
echo "   1. Run: cd backend && npx tsx migrations/runner.ts"
echo "   2. Update DATABASE_URL in your .env file"
echo "   3. Test your application"
echo "   4. Deploy to production"
