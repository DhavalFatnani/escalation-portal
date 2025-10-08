# Escalation Portal - Technical Design Document

## 1. Executive Summary

A full-stack web application enabling structured escalation workflows between Growth and Operations teams. The system provides role-based access, audit trails, real-time status updates, and comprehensive ticket lifecycle management.

**Key Features:**
- Secure authentication and RBAC (Growth, Ops, Admin)
- Ticket creation with priority levels and issue categorization
- Status-driven workflow: open → processed → resolved/re-opened
- Complete audit trail and activity timeline
- File attachments with S3 storage
- Email and Slack notifications
- Search, filtering, and metrics dashboard

## 2. Architecture Overview

### High-Level Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Browser   │────────▶│  React SPA   │────────▶│  Express    │
│  (Client)   │◀────────│  (Frontend)  │◀────────│  API        │
└─────────────┘  HTTPS  └──────────────┘   REST  └─────────────┘
                                                         │
                                                         │
                          ┌──────────────────────────────┼─────────────┐
                          │                              │             │
                          ▼                              ▼             ▼
                   ┌────────────┐               ┌──────────┐   ┌─────────┐
                   │ PostgreSQL │               │   S3     │   │  Email  │
                   │  Database  │               │ Storage  │   │  /Slack │
                   └────────────┘               └──────────┘   └─────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 + TypeScript + Vite | Modern SPA with type safety |
| UI Framework | Tailwind CSS | Rapid, responsive UI development |
| State Management | Zustand | Lightweight global state |
| Data Fetching | TanStack Query | Server state management, caching |
| Backend | Node.js + Express + TypeScript | REST API server |
| Database | PostgreSQL 15+ | Relational data storage |
| Authentication | JWT + bcrypt (or Clerk) | Secure user authentication |
| File Storage | AWS S3 (or compatible) | Scalable file uploads |
| Notifications | Postmark/SES + Slack | Email and chat notifications |

## 3. Database Design

### Entity-Relationship Diagram

```
┌────────────┐       ┌─────────────┐       ┌──────────────────┐
│   Users    │──────<│   Tickets   │>──────│ Ticket Activities│
└────────────┘       └─────────────┘       └──────────────────┘
                            │
                            │
                            │
                     ┌──────────────┐
                     │ Attachments  │
                     └──────────────┘
```

### Core Tables

#### `users`
```sql
id                uuid PRIMARY KEY
email             text UNIQUE NOT NULL
name              text
role              text NOT NULL  -- 'growth' | 'ops' | 'admin'
password_hash     text
created_at        timestamptz
updated_at        timestamptz
last_login_at     timestamptz
```

**Indexes:** email, role

#### `tickets`
```sql
id                      uuid PRIMARY KEY
ticket_number           text UNIQUE NOT NULL  -- 'GROW-20251008-0001'
created_by              uuid REFERENCES users(id)
brand_name              text NOT NULL
description             text
issue_type              text  -- enum: product_not_as_listed, etc.
expected_output         text
priority                text NOT NULL  -- urgent | high | medium | low
status                  text DEFAULT 'open'  -- open | processed | resolved | re-opened | closed
created_at              timestamptz
updated_at              timestamptz
last_status_change_at   timestamptz
current_assignee        uuid REFERENCES users(id)
resolved_at             timestamptz
resolution_remarks      text
reopen_reason           text
search_vector           tsvector  -- Full-text search
```

**Indexes:** ticket_number, created_by, status, priority, brand_name, created_at, current_assignee, search_vector (GIN)

#### `ticket_activities`
```sql
id          uuid PRIMARY KEY
ticket_id   uuid REFERENCES tickets(id) ON DELETE CASCADE
actor_id    uuid REFERENCES users(id)
action      text NOT NULL  -- 'created' | 'resolution_added' | 'reopened' | etc.
comment     text
payload     jsonb  -- Additional structured data
created_at  timestamptz
```

**Indexes:** ticket_id, created_at

#### `attachments`
```sql
id              uuid PRIMARY KEY
ticket_id       uuid REFERENCES tickets(id) ON DELETE CASCADE
filename        text NOT NULL
url             text NOT NULL  -- S3 URL
file_size       bigint
mime_type       text
uploaded_by     uuid REFERENCES users(id)
created_at      timestamptz
```

**Indexes:** ticket_id

### Key Design Decisions

1. **UUID Primary Keys:** Prevent enumeration attacks, distributed ID generation
2. **Ticket Number Generation:** Human-readable format with daily sequence
3. **Full-Text Search:** PostgreSQL `tsvector` for fast text search
4. **JSONB Payload:** Flexible storage for activity metadata
5. **ON DELETE CASCADE:** Automatic cleanup of related records
6. **Timestamptz:** All timestamps with timezone support

## 4. API Design

### Authentication Flow

```
Client                    API                     Database
  │                        │                         │
  │──POST /auth/login────▶│                         │
  │  {email, password}     │                         │
  │                        │──Query user────────────▶│
  │                        │◀──User + hash───────────│
  │                        │  Verify password        │
  │                        │  Generate JWT           │
  │◀─{token, user}─────────│                         │
  │                        │                         │
  │──GET /tickets─────────▶│                         │
  │  Auth: Bearer token    │  Verify JWT             │
  │                        │──Query tickets──────────▶│
  │                        │◀──Results───────────────│
  │◀─{tickets}─────────────│                         │
```

### Core Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/users/me` - Get current user

#### Tickets
- `POST /api/tickets` - Create ticket (Growth only)
- `GET /api/tickets` - List tickets with filters
- `GET /api/tickets/:ticket_number` - Get ticket details
- `PATCH /api/tickets/:ticket_number` - Update ticket
- `POST /api/tickets/:ticket_number/resolve` - Ops adds resolution
- `POST /api/tickets/:ticket_number/reopen` - Growth reopens ticket
- `POST /api/tickets/:ticket_number/close` - Growth closes ticket
- `GET /api/tickets/:ticket_number/activities` - Get activity timeline

### Request/Response Examples

**Create Ticket:**
```json
POST /api/tickets
{
  "brand_name": "Acme Corp",
  "description": "Product images incorrect",
  "issue_type": "product_not_as_listed",
  "priority": "urgent"
}

Response 201:
{
  "ticket": {
    "id": "uuid",
    "ticket_number": "GROW-20251008-0001",
    "status": "open",
    "created_at": "2025-10-08T10:00:00Z"
  }
}
```

**Add Resolution:**
```json
POST /api/tickets/GROW-20251008-0001/resolve
{
  "remarks": "Root cause: Database sync issue. Fixed records and updated configurations."
}

Response 200:
{
  "ticket": {
    "status": "processed",
    "resolution_remarks": "...",
    "current_assignee": "ops-user-uuid"
  }
}
```

## 5. Frontend Architecture

### Component Hierarchy

```
App
├── LoginPage
└── Layout (authenticated)
    ├── Header
    │   ├── Navigation
    │   └── UserMenu
    └── Routes
        ├── DashboardPage
        │   ├── StatsCards
        │   └── RecentTicketsList
        ├── TicketsListPage
        │   ├── SearchBar
        │   ├── Filters
        │   └── TicketTable
        ├── CreateTicketPage
        │   └── TicketForm
        └── TicketDetailPage
            ├── TicketHeader
            ├── TicketInfo
            ├── ResolutionSection
            ├── ActionForms
            └── ActivityTimeline
```

### State Management Strategy

1. **Authentication State (Zustand):**
   - User object, token, isAuthenticated
   - Persisted to localStorage
   - Global access via `useAuthStore()`

2. **Server State (TanStack Query):**
   - Tickets, activities, user data
   - Automatic caching and revalidation
   - Optimistic updates for mutations

3. **Form State (React Hook Form):**
   - Local form state
   - Validation
   - Submission handling

### Key React Patterns

- **Custom Hooks:** `useTickets()`, `useTicketDetail()`, `useTicketMutations()`
- **Protected Routes:** HOC or redirect logic based on `isAuthenticated`
- **Error Boundaries:** Catch and display errors gracefully
- **Loading States:** Skeleton screens and spinners
- **Optimistic Updates:** Immediate UI feedback before server confirmation

## 6. Security Architecture

### Authentication & Authorization

1. **JWT Tokens:**
   - Issued on login with 7-day expiry
   - Stored in localStorage (or httpOnly cookie for enhanced security)
   - Included in Authorization header: `Bearer {token}`

2. **Role-Based Access Control (RBAC):**
   ```typescript
   // Middleware enforcement
   requireAuth  // Verify token
   requireRole('growth')  // Check role
   requireRole('ops', 'admin')  // Multiple roles
   ```

3. **Permission Matrix:**

| Action | Growth | Ops | Admin |
|--------|--------|-----|-------|
| Create Ticket | ✓ | ✗ | ✓ |
| View Own Tickets | ✓ | - | ✓ |
| View All Tickets | ✗ | ✓ | ✓ |
| Resolve Ticket | ✗ | ✓ | ✓ |
| Reopen Ticket | ✓ | ✗ | ✓ |
| Close Ticket | ✓ | ✗ | ✓ |

### Security Best Practices Implemented

1. **Input Validation:**
   - Zod schemas for request validation
   - SQL injection prevention via parameterized queries
   - XSS prevention via input sanitization

2. **Password Security:**
   - bcrypt hashing with salt rounds = 10
   - Minimum password length enforcement
   - No passwords in logs or responses

3. **API Security:**
   - Rate limiting (express-rate-limit)
   - CORS with whitelist
   - Helmet.js security headers
   - HTTPS in production

4. **File Upload Security:**
   - Signed URLs for upload/download
   - File type validation
   - Size limits (20 MB default)
   - Virus scanning (optional)

5. **Audit Trail:**
   - All status changes logged to `ticket_activities`
   - Actor ID recorded for every action
   - Immutable activity log (no deletes)

## 7. Notification System

### Notification Triggers

| Event | Recipient | Channel | Priority |
|-------|-----------|---------|----------|
| Ticket Created (Urgent) | Ops Team | Slack + Email | High |
| Ticket Assigned | Assignee | Email | Medium |
| Resolution Added | Ticket Creator | Email + In-App | High |
| Ticket Reopened | Assignee | Email + Slack | High |
| SLA Breach Warning | Ops Manager | Slack | High |

### Implementation

**Email (Postmark):**
```typescript
async function sendResolutionNotification(ticket, user) {
  await postmark.sendEmail({
    From: 'noreply@yourdomain.com',
    To: user.email,
    Subject: `Ticket ${ticket.ticket_number} has been resolved`,
    HtmlBody: renderEmailTemplate(ticket),
  });
}
```

**Slack:**
```typescript
async function notifyOpsChannel(ticket) {
  await axios.post(SLACK_WEBHOOK_URL, {
    text: `🚨 New urgent ticket: ${ticket.ticket_number}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${ticket.brand_name}*\n${ticket.description}`,
        },
      },
    ],
  });
}
```

## 8. Scalability & Performance

### Database Optimization

1. **Indexes:**
   - Primary keys (uuid)
   - Foreign keys
   - Frequently filtered columns (status, priority, created_at)
   - Full-text search (GIN index on search_vector)

2. **Query Optimization:**
   - Use EXPLAIN ANALYZE for slow queries
   - Pagination (LIMIT/OFFSET)
   - Avoid N+1 queries (JOIN when needed)

3. **Connection Pooling:**
   - pg-pool with max 20 connections
   - Idle timeout: 30s
   - Connection timeout: 2s

### Caching Strategy

1. **Client-Side (TanStack Query):**
   - 5-minute cache for ticket lists
   - Background refetch on window focus
   - Optimistic updates for mutations

2. **Server-Side (Future):**
   - Redis for session storage
   - Cache ticket counts for dashboard
   - Invalidate on write operations

### Horizontal Scaling

1. **Stateless API:**
   - No in-memory session storage
   - JWT tokens for authentication
   - Can run multiple instances behind load balancer

2. **Database:**
   - Read replicas for heavy read traffic
   - Connection pooling (pgBouncer)
   - Regular VACUUM and ANALYZE

## 9. Monitoring & Observability

### Logging

```typescript
// Winston logger with levels
logger.info('Ticket created', { ticketNumber, userId });
logger.error('Database connection failed', { error });
```

**Log Destinations:**
- Console (development)
- File (`logs/combined.log`, `logs/error.log`)
- Log aggregation service (production - Logtail, Datadog)

### Metrics to Track

1. **Application:**
   - Request rate (requests/sec)
   - Response time (p50, p95, p99)
   - Error rate (4xx, 5xx)

2. **Business:**
   - Tickets created per day
   - Average time to resolution
   - Re-open rate
   - SLA compliance rate

3. **Database:**
   - Query execution time
   - Connection pool utilization
   - Slow query log

### Error Tracking

- **Sentry** integration for frontend and backend
- Captures exceptions, stack traces, user context
- Alerts on error threshold

## 10. Deployment Architecture

### Production Setup

```
Internet
   │
   ├─▶ CDN (CloudFront/Vercel)
   │        │
   │        └─▶ React SPA (S3/Vercel)
   │
   └─▶ Load Balancer (ALB/Nginx)
            │
            ├─▶ API Server 1 (ECS/Render)
            ├─▶ API Server 2 (ECS/Render)
            └─▶ API Server N (ECS/Render)
                     │
                     ├─▶ PostgreSQL (RDS/Render)
                     ├─▶ S3 Bucket (Attachments)
                     └─▶ Redis (Sessions - Optional)
```

### CI/CD Pipeline

```
GitHub Push
    │
    ├─▶ Run Tests (Jest)
    ├─▶ Run Linter (ESLint)
    ├─▶ Build (TypeScript)
    │
    ├─▶ Deploy Backend (Render/ECS)
    │      └─▶ Run Migrations
    │
    └─▶ Deploy Frontend (Vercel)
           └─▶ Build React App
```

## 11. Testing Strategy

### Backend Tests

```typescript
// Unit tests
describe('TicketService', () => {
  it('should create ticket with unique ticket number', async () => {
    const ticket = await ticketService.createTicket(userId, data);
    expect(ticket.ticket_number).toMatch(/^GROW-\d{8}-\d{4}$/);
  });
});

// Integration tests
describe('POST /api/tickets', () => {
  it('should return 401 if not authenticated', async () => {
    const res = await request(app).post('/api/tickets');
    expect(res.status).toBe(401);
  });
});
```

### Frontend Tests

```typescript
// Component tests (React Testing Library)
it('renders ticket list', async () => {
  render(<TicketsListPage />);
  await screen.findByText('GROW-20251008-0001');
});

// E2E tests (Playwright - optional)
test('complete ticket workflow', async ({ page }) => {
  await page.goto('/tickets/new');
  await page.fill('[name="brand_name"]', 'Acme Corp');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/tickets\/GROW-/);
});
```

## 12. Future Enhancements

### Phase 2 Features

1. **Advanced Analytics:**
   - SLA compliance dashboard
   - Team performance metrics
   - Brand-specific insights

2. **Bulk Operations:**
   - Assign multiple tickets
   - Export to CSV/Excel
   - Batch status updates

3. **Templates:**
   - Pre-defined ticket templates
   - Auto-fill based on issue type
   - Custom fields per template

4. **Mobile App:**
   - React Native app for iOS/Android
   - Push notifications
   - Offline mode

5. **Integration:**
   - Webhook API for third-party systems
   - Zapier integration
   - SSO (SAML, OAuth)

### Technical Debt Items

- Add comprehensive test coverage (target: 80%+)
- Implement rate limiting per user
- Add database query performance monitoring
- Set up blue-green deployment
- Implement feature flags
- Add i18n support

## 13. Cursor Development Workflow

### Project Optimization for Cursor AI

1. **`.cursorrules` Configuration:**
   - Defines database conventions (snake_case)
   - Enforces security patterns (parameterized queries)
   - Specifies code style (TypeScript strict mode)
   - Documents RBAC rules

2. **Using Cursor for Development:**

**Generate new endpoint:**
```
Prompt: "Add a POST /api/tickets/bulk-assign endpoint that allows ops to assign 
multiple tickets to a user. Include validation, transaction handling, and tests."
```

**Create React component:**
```
Prompt: "Create a MetricsDashboard component showing: 
1) tickets by status (pie chart)
2) average resolution time by priority (bar chart)
3) top 5 brands by ticket volume (table)
Use recharts library."
```

**Database migration:**
```
Prompt: "Generate a migration to add SLA deadline tracking:
- sla_deadline timestamptz
- sla_breached boolean
- Update existing tickets based on priority"
```

3. **Best Practices:**
   - Commit frequently
   - Use Cursor's diff view to review AI changes
   - Ask Cursor to add tests alongside feature code
   - Use Cursor to explain complex code sections

## 14. Conclusion

This technical design provides a comprehensive blueprint for a production-ready escalation portal. The architecture balances:
- **Developer Experience:** TypeScript, modern React, Cursor-optimized
- **Security:** RBAC, audit trails, input validation
- **Scalability:** Stateless API, database optimization, caching
- **Maintainability:** Clear separation of concerns, comprehensive docs

The implementation is complete and ready for deployment following the [deployment guide](docs/deployment.md).
