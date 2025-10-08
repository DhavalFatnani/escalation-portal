# Quick Reference Guide

## 🎯 System at a Glance

### Ticket Lifecycle
```
┌─────────────────────────────────────────────────────────────────┐
│                     ESCALATION WORKFLOW                          │
└─────────────────────────────────────────────────────────────────┘

Growth User                     Ops User                   Growth User
     │                             │                            │
     │  1. Create Ticket           │                            │
     ├────────────────────────────▶│                            │
     │     Status: OPEN            │                            │
     │                             │                            │
     │                             │  2. Add Resolution         │
     │                             ├───────────────────────────▶│
     │                             │  Status: PROCESSED         │
     │                             │                            │
     │                             │                 3a. Accept │
     │                             │◀───────────────────────────┤
     │                             │       Status: RESOLVED     │
     │                             │                            │
     │                             │            OR              │
     │                             │                            │
     │                             │                3b. Reopen  │
     │  Status: RE-OPENED          │◀───────────────────────────┤
     │◀────────────────────────────┤                            │
     │                             │                            │
     └─────────────────────────────┴────────────────────────────┘
```

### User Roles

| Role | Can Do |
|------|--------|
| **Growth** | • Create tickets<br>• View own tickets<br>• Reopen processed tickets<br>• Close/accept tickets |
| **Ops** | • View all tickets<br>• Add resolutions<br>• Assign tickets<br>• Update priorities |
| **Admin** | • Everything Growth + Ops can do<br>• Manage users<br>• View system analytics |

---

## 📁 File Map (Where Everything Is)

### Backend Structure
```
backend/
├── src/
│   ├── index.ts                    # ⚡ Server entry point
│   ├── config/
│   │   └── database.ts             # 🗄️ PostgreSQL connection
│   ├── middleware/
│   │   ├── auth.ts                 # 🔐 JWT verification, RBAC
│   │   ├── validation.ts           # ✅ Zod schemas
│   │   └── errorHandler.ts         # 🚨 Error handling
│   ├── routes/
│   │   ├── auth.ts                 # 🔑 Login, register
│   │   ├── tickets.ts              # 🎫 Ticket CRUD + workflow
│   │   └── users.ts                # 👤 User management
│   ├── services/
│   │   └── ticketService.ts        # 💼 Business logic
│   └── utils/
│       └── logger.ts               # 📝 Winston logging
├── migrations/
│   ├── 001_initial_schema.sql      # 🗃️ Tables, indexes, functions
│   └── 002_seed_data.sql           # 🌱 Sample data
└── .env                            # ⚙️ Configuration
```

### Frontend Structure
```
frontend/
├── src/
│   ├── App.tsx                     # 🏠 Main app + routing
│   ├── components/
│   │   └── Layout.tsx              # 🎨 Header, navigation
│   ├── pages/
│   │   ├── LoginPage.tsx           # 🔐 Login form
│   │   ├── DashboardPage.tsx       # 📊 Stats + recent tickets
│   │   ├── TicketsListPage.tsx     # 📋 List + search + filters
│   │   ├── CreateTicketPage.tsx    # ➕ Create ticket form
│   │   └── TicketDetailPage.tsx    # 🔍 Detail + timeline + actions
│   ├── services/
│   │   ├── api.ts                  # 🌐 Axios client
│   │   ├── authService.ts          # 🔑 Login, register
│   │   └── ticketService.ts        # 🎫 Ticket API calls
│   ├── stores/
│   │   └── authStore.ts            # 💾 Auth state (Zustand)
│   └── types/
│       └── index.ts                # 📝 TypeScript types
└── .env                            # ⚙️ Configuration
```

---

## 🔌 API Cheat Sheet

### Authentication
```bash
# Login
POST /api/auth/login
{
  "email": "growth@example.com",
  "password": "password123"
}
→ Returns: { token, user }

# Get current user
GET /api/users/me
Header: Authorization: Bearer {token}
→ Returns: { user }
```

### Tickets
```bash
# Create ticket (Growth only)
POST /api/tickets
{
  "brand_name": "Acme Corp",
  "description": "Issue description",
  "issue_type": "product_not_as_listed",
  "priority": "urgent"
}
→ Returns: { ticket } with ticket_number

# List tickets
GET /api/tickets?status=open,processed&priority=urgent
→ Returns: { tickets: [...], total: 42 }

# Get ticket details
GET /api/tickets/GROW-20251008-0001
→ Returns: { ticket }

# Add resolution (Ops only)
POST /api/tickets/GROW-20251008-0001/resolve
{
  "remarks": "Root cause analysis and fix description"
}
→ Returns: { ticket } with status=processed

# Reopen ticket (Growth only)
POST /api/tickets/GROW-20251008-0001/reopen
{
  "reason": "Resolution incomplete"
}
→ Returns: { ticket } with status=re-opened

# Close ticket (Growth only)
POST /api/tickets/GROW-20251008-0001/close
→ Returns: { ticket } with status=resolved

# Get activity timeline
GET /api/tickets/GROW-20251008-0001/activities
→ Returns: { activities: [...] }
```

---

## 🗄️ Database Quick Reference

### Main Tables

**users**
```
id (uuid), email, name, role, password_hash, created_at
```

**tickets**
```
id (uuid), ticket_number, created_by, brand_name, description,
issue_type, expected_output, priority, status, current_assignee,
resolution_remarks, reopen_reason, created_at, updated_at
```

**ticket_activities**
```
id (uuid), ticket_id, actor_id, action, comment, payload, created_at
```

### Enums

**Roles:** `growth`, `ops`, `admin`  
**Status:** `open`, `processed`, `resolved`, `re-opened`, `closed`  
**Priority:** `urgent`, `high`, `medium`, `low`  
**Issue Types:** `product_not_as_listed`, `giant_discrepancy_brandless_inverterless`, `physical_vs_scale_mismatch`, `other`

### Key Functions
```sql
-- Generate unique ticket number
SELECT generate_ticket_number('GROW');
→ Returns: 'GROW-20251008-0001'
```

---

## ⚙️ Environment Variables

### Backend `.env`
```bash
# Server
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/escalation_portal

# Auth
JWT_SECRET=your-secret-key

# Optional: S3 for file uploads
S3_BUCKET=your-bucket
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=xxx
S3_SECRET_ACCESS_KEY=xxx

# Optional: Notifications
POSTMARK_API_KEY=xxx
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
```

### Frontend `.env`
```bash
VITE_API_URL=http://localhost:3001
# Optional: VITE_CLERK_PUBLISHABLE_KEY=xxx
```

---

## 🚀 Common Commands

```bash
# Install everything
npm install

# Run development servers (both frontend + backend)
npm run dev

# Run separately
npm run dev:backend     # Port 3001
npm run dev:frontend    # Port 5173

# Database
cd backend
npm run migrate         # Run migrations
npm run seed           # Add demo data

# Build for production
npm run build          # Both
cd backend && npm run build
cd frontend && npm run build

# Tests
npm test
```

---

## 🔐 Demo Credentials (after seed)

| Email | Password | Role |
|-------|----------|------|
| growth@example.com | password123 | Growth |
| ops@example.com | password123 | Ops |
| admin@example.com | password123 | Admin |

---

## 🎨 Color Coding Reference

### Priority Colors
| Priority | Badge Color |
|----------|------------|
| Urgent | 🔴 Red |
| High | 🟠 Orange |
| Medium | 🟡 Yellow |
| Low | 🟢 Green |

### Status Colors
| Status | Badge Color |
|--------|------------|
| Open | 🔵 Blue |
| Processed | 🟡 Yellow |
| Resolved | 🟢 Green |
| Re-opened | 🔴 Red |
| Closed | ⚫ Gray |

---

## 📊 Ticket States

```
┌─────────────────────────────────────────────────────────────┐
│                      TICKET STATES                           │
└─────────────────────────────────────────────────────────────┘

  OPEN          PROCESSED       RESOLVED         CLOSED
   │                │              │               │
   │ Ops adds       │ Growth       │               │
   │ resolution     │ accepts      │               │
   ├───────────────▶├─────────────▶│               │
   │                │              │               │
   │                │ Growth       │               │
   │                │ reopens      │               │
   │◀───────────────┤              │               │
   │  RE-OPENED     │              │               │
   │                │              │               │
   └────────────────┴──────────────┴───────────────┘
```

---

## 🔍 Search & Filter Examples

```bash
# Search by text
GET /api/tickets?search=database+sync

# Filter by status
GET /api/tickets?status=open,re-opened

# Filter by priority
GET /api/tickets?priority=urgent,high

# Combined filters
GET /api/tickets?status=open&priority=urgent&brand_name=Acme

# Pagination
GET /api/tickets?limit=10&offset=20
```

---

## 🛠️ Troubleshooting

### Backend Won't Start
```bash
# Check PostgreSQL is running
pg_isready

# Check DATABASE_URL is correct
cat backend/.env | grep DATABASE_URL

# Test database connection
psql $DATABASE_URL -c "SELECT 1"
```

### Frontend Can't Connect
```bash
# Check backend is running
curl http://localhost:3001/health

# Check VITE_API_URL
cat frontend/.env | grep VITE_API_URL

# Clear browser localStorage
localStorage.clear()  # In browser console
```

### Login Fails
```bash
# Re-run seed
cd backend
npm run seed

# Check JWT_SECRET is set
cat .env | grep JWT_SECRET
```

### Port Already in Use
```bash
# Kill backend (port 3001)
lsof -ti:3001 | xargs kill

# Kill frontend (port 5173)
lsof -ti:5173 | xargs kill
```

---

## 📝 Cursor AI Prompts

### Add Features
```
"Add a bulk assign endpoint that lets ops assign multiple tickets to a user"

"Create a metrics dashboard showing tickets by status and average resolution time"

"Implement S3 file upload for ticket attachments with signed URLs"

"Add email notifications when tickets are resolved using Postmark"
```

### Generate Tests
```
"Write unit tests for ticketService.createTicket covering validation and errors"

"Generate integration tests for the POST /api/tickets endpoint"
```

### Database Changes
```
"Add a migration to include SLA deadline tracking fields"

"Create an index to optimize queries filtering by brand_name and status"
```

### Fix Issues
```
"Explain what this error means: [paste error]"

"Fix the TypeScript error in TicketDetailPage.tsx line 42"
```

---

## 🎯 What to Build Next

### Easy Wins (1-2 hours each)
1. **Metrics Dashboard:** Charts showing ticket stats
2. **Export to CSV:** Download ticket reports
3. **Bulk Actions:** Select and update multiple tickets
4. **Comment System:** Discussion threads on tickets

### Medium Projects (1-2 days each)
1. **File Attachments:** Full S3 upload/download
2. **Email Notifications:** Postmark integration
3. **Slack Integration:** Webhook notifications
4. **Advanced Search:** Full-text with filters

### Larger Features (3-5 days each)
1. **SLA Tracking:** Deadlines and breach alerts
2. **Analytics Dashboard:** Business intelligence
3. **Mobile App:** React Native version
4. **Webhook API:** Third-party integrations

---

## 📚 Where to Learn More

| Topic | Document |
|-------|----------|
| Setup Instructions | [SETUP.md](SETUP.md) |
| Architecture Details | [TECHNICAL_DESIGN.md](TECHNICAL_DESIGN.md) |
| API Reference | [docs/api-spec.md](docs/api-spec.md) |
| Deployment Guide | [docs/deployment.md](docs/deployment.md) |
| Complete Overview | [README.md](README.md) |

---

## ✅ Pre-Flight Checklist

Before running:
- [ ] PostgreSQL installed and running
- [ ] Node.js 18+ installed
- [ ] Created `escalation_portal` database
- [ ] Copied `.env.example` to `.env` in backend and frontend
- [ ] Set `DATABASE_URL` in backend/.env
- [ ] Ran `npm install` in root
- [ ] Ran `npm run migrate` in backend
- [ ] (Optional) Ran `npm run seed` in backend

Ready to start:
```bash
npm run dev
```

Open http://localhost:5173 and login! 🎉

---

**Quick Reference v1.0 | Last Updated: October 8, 2025**
