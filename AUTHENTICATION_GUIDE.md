# Authentication System Guide

## Current Implementation

This application uses **Custom JWT Authentication** with PostgreSQL, NOT Supabase Auth.

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Frontend  │ ───> │   Backend    │ ───> │  PostgreSQL │
│             │      │  (Express)   │      │   users     │
│   JWT Token │ <─── │  JWT + bcrypt│      │   table     │
└─────────────┘      └──────────────┘      └─────────────┘
```

## User Storage

Users are stored in the **database `users` table**, not in Supabase Auth.

```sql
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  role text NOT NULL CHECK (role IN ('growth', 'ops', 'admin')),
  password_hash text NOT NULL,
  must_change_password boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  last_login_at timestamptz
);
```

## Demo Users (From Seed Script)

| Email | Password | Role |
|-------|----------|------|
| growth@example.com | growth123 | growth |
| ops@example.com | ops123 | ops |
| admin@example.com | admin123 | admin |

These are created by `npm run seed` in the backend.

## Authentication Flow

### 1. Login (`POST /api/auth/login`)
```javascript
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Response:**
```javascript
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "admin"
  }
}
```

### 2. Protected Routes
All requests to protected routes must include:
```
Authorization: Bearer <token>
```

### 3. Password Hashing
- Uses `bcrypt` with 10 salt rounds
- Passwords never stored in plain text
- Secure comparison during login

## Admin Creates User Flow

When admin creates a user (`POST /api/users`):

1. ✅ User inserted into `users` table
2. ✅ Temporary password generated
3. ✅ Password hashed with bcrypt
4. ✅ `must_change_password` flag set to true
5. ✅ Temporary password returned to admin
6. ❌ **NOT** created in Supabase Auth

## Why Not Supabase Auth?

### Current System (Custom JWT):
- ✅ Full control over user management
- ✅ Simple admin user creation
- ✅ No external dependencies
- ✅ Works perfectly for internal tools
- ✅ Free forever (just database storage)

### Supabase Auth Would Add:
- Email verification
- Magic links
- Password reset emails
- OAuth providers (Google, GitHub, etc.)
- Built-in RLS (Row Level Security)

**For an internal escalation portal with admin-managed users, custom JWT is perfect!**

## Security Features

### ✅ Implemented
- Password hashing (bcrypt)
- JWT token expiration (7 days)
- Role-based access control (RBAC)
- SQL injection prevention (parameterized queries)
- CORS protection
- Helmet security headers
- Rate limiting

### ⚠️ To Consider Adding
- Password complexity requirements ✅ (already implemented)
- Account lockout after failed attempts
- IP-based rate limiting
- 2FA (Two-Factor Authentication)
- Session management/revocation

## User Management

### Create User (Admin Only)
```bash
POST /api/users
{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "growth"
}
```

Response includes temporary password that user must change on first login.

### Delete User (Admin Only)
```bash
DELETE /api/users/:userId
```

Checks for dependencies (tickets, attachments) before allowing deletion.

### Change Password
```bash
POST /api/users/change-password
{
  "currentPassword": "oldpass123",
  "newPassword": "NewSecure123!"
}
```

Password requirements:
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number

## Migrating to Supabase Auth (If Needed)

If you decide to migrate to Supabase Auth later:

1. Install Supabase Auth helpers
2. Update login flow to use `supabase.auth.signInWithPassword()`
3. Update user creation to use `supabase.auth.admin.createUser()`
4. Migrate existing users to Supabase Auth
5. Update middleware to verify Supabase JWT

**Cost:** Still free for small teams, but adds complexity.

## Checking Current Users

### Via Database Query:
```sql
SELECT id, email, name, role, created_at, last_login_at 
FROM users 
ORDER BY created_at DESC;
```

### Via API (Admin Only):
```bash
GET /api/users
Authorization: Bearer <admin-token>
```

## Troubleshooting

### "Users in webapp but not in Supabase Auth dashboard"
- ✅ **This is normal!** Users are in the database, not Supabase Auth.
- Check: `SELECT * FROM users;` in Supabase SQL Editor

### "Can't login with demo credentials"
- Run seed script: `cd backend && npm run seed`
- Check DATABASE_URL points to correct database

### "JWT token expired"
- Tokens expire after 7 days
- User needs to login again
- Consider refresh token implementation for longer sessions

## Production Recommendations

1. ✅ Strong JWT_SECRET (64+ random characters)
2. ✅ HTTPS only in production
3. ✅ Secure password requirements
4. ⚠️ Consider adding refresh tokens
5. ⚠️ Add account lockout after failed attempts
6. ⚠️ Log all authentication events
7. ⚠️ Regular security audits

## Summary

Your authentication system is **working correctly**:
- Users in database: ✅
- JWT tokens: ✅  
- Password hashing: ✅
- RBAC: ✅
- Not using Supabase Auth: ✅ (by design)

**This is a secure, production-ready implementation for an internal tool!**

