# **ESCALATION PORTAL - PRODUCT REQUIREMENTS DOCUMENT**

**Version:** 2.0  
**Last Updated:** October 22, 2025  
**Document Owner:** Product Team  
**Status:** Production Ready

---

## **1. EXECUTIVE SUMMARY**

### **1.1 Product Vision**
The Escalation Portal is a secure, bidirectional ticketing system enabling seamless escalation workflows between Growth and Operations teams at KNOT. It provides structured ticket management with manager oversight, real-time collaboration, and comprehensive audit trails.

### **1.2 Product Goals**
- ✅ Enable both Growth and Ops teams to create and escalate tickets to each other
- ✅ Provide manager-level oversight and workload distribution
- ✅ Ensure accountability through complete activity tracking
- ✅ Streamline resolution workflows with status-driven processes
- ✅ Maintain security with role-based access control (RBAC)

### **1.3 Success Metrics**
- Average ticket resolution time < 48 hours
- Ticket reopen rate < 15%
- 100% audit trail coverage
- Manager utilization rate > 80%
- Zero unauthorized access incidents

---

## **2. USER PERSONAS**

### **2.1 Growth Team Member**
**Role:** growth  
**Responsibilities:**
- Creates tickets to escalate issues to Ops team
- Resolves tickets created by Ops team
- Reviews and accepts/reopens processed tickets
- Tracks their escalations

**Key Needs:**
- Simple ticket creation interface
- Clear visibility of tickets assigned to them
- Easy acceptance/rejection workflow
- Real-time status updates

### **2.2 Growth Manager**
**Role:** growth + `is_manager: true`  
**Responsibilities:**
- Oversees all tickets created by Growth team members
- Assigns incoming tickets (from Ops) to Growth team members
- Monitors team workload and performance
- Manages team member activation status
- Can create and resolve tickets (same as team member)

**Key Needs:**
- Dashboard showing incoming vs outgoing tickets
- Team performance metrics
- Quick assignment interface
- Workload balancing tools

### **2.3 Ops Team Member**
**Role:** ops  
**Responsibilities:**
- Creates tickets to escalate issues to Growth team
- Resolves tickets created by Growth team
- Reviews and accepts/reopens processed tickets
- Tracks their escalations

**Key Needs:**
- Same as Growth Team Member (full symmetry)

### **2.4 Ops Manager**
**Role:** ops + `is_manager: true`  
**Responsibilities:**
- Oversees all tickets created by Ops team members
- Assigns incoming tickets (from Growth) to Ops team members
- Monitors team workload and performance
- Manages team member activation status
- Can create and resolve tickets (same as team member)

**Key Needs:**
- Same as Growth Manager (full parity)

### **2.5 Administrator**
**Role:** admin  
**Responsibilities:**
- Full system access and oversight
- User management (create, delete, promote to manager)
- Force status changes for stuck tickets
- System configuration and settings
- Attachment approval workflow management

**Key Needs:**
- Global visibility across all teams
- Override capabilities for edge cases
- User and permission management
- System health monitoring

---

## **3. FUNCTIONAL REQUIREMENTS**

### **3.1 Authentication & Authorization**

#### **FR-3.1.1: User Authentication**
- Users authenticate with email and password (JWT-based)
- Passwords hashed with bcrypt (10 salt rounds)
- JWT tokens expire after 24 hours
- Inactive users (`is_active: false`) cannot log in

#### **FR-3.1.2: Role-Based Access Control (RBAC)**
Three primary roles with hierarchical permissions:

| Permission | Team Member | Manager | Admin |
|-----------|-------------|---------|-------|
| Create tickets | ✅ | ✅ | ✅ |
| View own tickets | ✅ | ✅ | ✅ |
| View team tickets | ❌ | ✅ | ✅ |
| Assign tickets | ❌ | ✅ | ✅ |
| Manage users | ❌ | Partial | ✅ |
| Force status | ❌ | ❌ | ✅ |
| Delete tickets | ❌ | ❌ | ✅ |

#### **FR-3.1.3: Manager Designation**
- Admins can promote any Growth/Ops user to manager via toggle
- Managers retain their team role (growth/ops) + `is_manager: true` flag
- Managers have extended permissions within their team only

---

### **3.2 Ticket Management**

#### **FR-3.2.1: Ticket Creation**
**Who:** Growth members, Ops members, Managers, Admins

**Required Fields:**
- Brand Name (text, required)
- Description (text, optional)
- Issue Type (dropdown, optional):
  - Product Not Live After Return
  - GRN Discrepancy
  - Physical Product vs SKU Mismatch
  - Other (with custom text input)
- Expected Output (dropdown or custom text, optional)
- Priority (required):
  - Urgent (red)
  - High (orange)
  - Medium (yellow)
  - Low (green)

**Business Rules:**
- Ticket number auto-generated based on creator's role:
  - Growth: `GROW-YYYYMMDD-####`
  - Ops: `OPS-YYYYMMDD-####`
- Initial status: `open`
- Initial `assigned_to`: `NULL` (pending manager assignment)
- Automatic activity log: "Ticket created by [team] - Pending manager assignment"

**File Attachments:**
- Up to 5 files per upload
- Max 20MB per file
- Compressed before upload (images, PDFs, documents)
- Stored in Supabase Storage with CDN caching

#### **FR-3.2.2: Ticket Assignment**
**Who:** Managers, Admins

**Functionality:**
- Assign unassigned tickets to active team members
- Reassign already-assigned tickets to different team members
- Add optional notes during assignment
- Auto-assign toggle for round-robin distribution

**Business Rules:**
- Can only assign to active (`is_active: true`) team members
- Can only assign to members from same team (Growth manager → Growth members)
- Assignment tracked in `ticket_assignments` table
- Activity log records: "Assigned to [User]" or "Reassigned from [Old] to [New]"

#### **FR-3.2.3: Ticket Resolution (Processing)**
**Who:** The opposite team from the creator

**Flow:**
- Growth ticket → Ops member resolves
- Ops ticket → Growth member resolves

**Requirements:**
- Resolution remarks (required)
- Resolution files (optional, up to 5 files)
- Status changes: `open` → `processed` OR `re-opened` → `processed`
- Sets `current_assignee` to resolver's user ID
- Records `primary_resolution_remarks` on first resolution

#### **FR-3.2.4: Ticket Acceptance/Closure**
**Who:** Creator's team (same team that created the ticket)

**Options:**
1. **Accept & Close:**
   - Status: `processed` → `closed`
   - Optional acceptance remarks
   - Sets `resolved_at` timestamp
   
2. **Reopen:**
   - Status: `processed` → `re-opened`
   - Reopen reason (required)
   - Optional reopen files
   - Clears `current_assignee`
   - Returns to opposite team for updated resolution

#### **FR-3.2.5: Ticket Status Lifecycle**

```
┌─────────────────────────────────────────────────┐
│                TICKET LIFECYCLE                 │
└─────────────────────────────────────────────────┘

    Created
      ↓
   [open] ────────────────┐
      ↓                   │
   Assigned               │
      ↓                   │
   Processing             │
      ↓                   │
   [processed] ←──────────┘
      ↓          ↑
      │    Reopen│
      │  [re-opened]
      │          │
   Accept        │
      ↓          │
   [closed] ─────┘
```

**Valid Transitions:**
- `open` → `processed` (resolve)
- `re-opened` → `processed` (updated resolve)
- `processed` → `re-opened` (reopen)
- `processed` → `closed` (accept)

---

### **3.3 Manager Workflow**

#### **FR-3.3.1: Manager Dashboard**
**Page:** Manager Overview

**Displays:**
1. **Incoming Tickets Overview:**
   - Total incoming (escalated TO your team)
   - Unassigned count
   - Urgent priority count (excluding resolved)

2. **Outgoing Tickets Overview:**
   - Total outgoing (created BY your team)
   - Status breakdown

3. **Quick Actions:**
   - Auto-assign toggle
   - View detailed incoming/outgoing lists

#### **FR-3.3.2: Incoming Tickets**
**Purpose:** Manage tickets escalated TO the manager's team

**Features:**
- List of tickets created by opposite team
- Inline assignment dropdown for each ticket
- Bulk assignment with checkboxes
- Reassignment capability for already-assigned tickets
- Priority-based sorting
- Status filter: All, Unassigned, Assigned
- Auto-refresh every 15 seconds
- Custom checkbox design with hover effects

**Visual Design:**
- Unassigned tickets: Show checkbox + "Assign to..." dropdown
- Assigned tickets: Show assignee name + "Reassign to..." dropdown (orange accent)
- Entire card clickable to view details
- Assignment controls positioned absolutely to prevent navigation conflicts

#### **FR-3.3.3: Outgoing Tickets**
**Purpose:** Track tickets created BY the manager's team

**Features:**
- List of all tickets created by team members
- Status breakdown cards (Open, Processed, Resolved)
- Filter by team member
- Filter by status and priority
- Real-time status updates
- Full card clickable

#### **FR-3.3.4: Team Performance**
**Purpose:** Analytics and metrics for manager oversight

**Key Performance Indicators (KPIs):**
- Average response time (in hours)
- Completion rate (resolved/total percentage)
- Reopen rate (reopened/resolved percentage)
- Team throughput (total tickets created)

**Time Range Filters:**
- Last 7 days
- Last 30 days
- Last 90 days
- All time

**Team Workload:**
- Active tickets per team member
- Workload distribution chart
- Overload alerts (>5 active tickets)

#### **FR-3.3.5: Team Management (My Team)**
**Purpose:** Manage team member roster

**Features:**
- List of all team members managed by this manager
- Toggle active/inactive status
- View individual performance metrics
- See current active ticket count per member
- Full-width layout for better visibility

---

### **3.4 Team Member Workflow**

#### **FR-3.4.1: My Work (Dashboard)**
**Purpose:** Overview of all work for the team member

**Sections:**
1. **Assigned to Me Summary:**
   - Total assigned tickets
   - Breakdown by status (Open, Processed, Resolved)
   - Urgent count

2. **I Created Summary:**
   - Total created tickets
   - Breakdown by status

**Business Rule:**
- Tickets are NOT double-counted
- If a ticket is both created AND assigned to same user, it appears in both sections (intentional)

#### **FR-3.4.2: Assigned to Me**
**Purpose:** Dedicated list of tickets assigned by manager

**Features:**
- Full list of assigned tickets
- Search and filter capabilities
- Status and priority filters
- Full card clickable
- Auto-refresh every 15 seconds

#### **FR-3.4.3: My Escalations**
**Purpose:** Track tickets the user created

**Features:**
- Full list of tickets created by the user
- Status tracking and progress indicators
- Filter by status and priority
- See who is handling each ticket
- Full card clickable
- Auto-refresh every 15 seconds

**Critical Business Rule:**
- ONLY show tickets where `created_by = user.id`
- Must NOT show tickets user processed but didn't create

---

### **3.5 Admin Features**

#### **FR-3.5.1: User Management**
**Page:** Users Management

**Features:**
- View all users with details (name, email, role, last login)
- Create new users (generates temporary password)
- Delete users (with validation)
- Toggle manager status (promote/demote)
- Visual indicators:
  - Role badges (Growth, Ops, Admin)
  - Manager status badge (indigo for managers)
  - Last login timestamp

#### **FR-3.5.2: Force Status Change**
**Purpose:** Override ticket status for edge cases

**Functionality:**
- Change ticket to any status
- Provide mandatory reason
- Proper field clearing based on new status
- Detailed activity logging

**Actions Available:**
- Mark as Processed
- Mark as Resolved
- Reopen Ticket
- Close Ticket

#### **FR-3.5.3: System Settings**
**Page:** System Settings

**Configurable Settings:**
- Auto-assignment default (ON/OFF)
- SLA thresholds
- Email notification preferences
- Slack webhook configuration

---

## **4. NON-FUNCTIONAL REQUIREMENTS**

### **4.1 Performance**
- Page load time < 2 seconds
- API response time < 500ms (p95)
- Support 100 concurrent users
- Real-time updates every 15-30 seconds
- Pagination: 25 tickets per page (default)

### **4.2 Security**
- All API endpoints require authentication (except `/api/health`, `/api/auth/login`)
- JWT tokens with HTTP-only cookies (if using cookies)
- SQL injection prevention (parameterized queries)
- File upload validation (type, size)
- Database-level user restrictions (service user with limited permissions)
- Row-level security for cross-team data access
- Password requirements: min 8 characters

### **4.3 Scalability**
- Database connection pooling (max 20 connections)
- Image/file compression before upload
- CDN caching for attachments (1 year max-age)
- Lazy loading for attachments (load on demand)
- Efficient indexing on frequently queried columns

### **4.4 Reliability**
- Health check endpoint for uptime monitoring
- Graceful error handling with user-friendly messages
- Transaction rollback on failures
- Comprehensive logging (Winston)
- Database backups (daily via Supabase)

### **4.5 Usability**
- Responsive design (mobile, tablet, desktop)
- Progressive Web App (PWA) support
- Offline fallback page
- Keyboard navigation support
- Clear visual hierarchy and role-based UI
- Modal-based alerts (no browser alerts)

---

## **5. USER INTERFACE SPECIFICATIONS**

### **5.1 Navigation Structure**

#### **Sidebar Navigation** (Collapsible, Dark Gradient)
**Manager View:**
```
📊 Manager Overview
   ├── 📥 Incoming Tickets [badge: unassigned count]
   ├── 📤 Outgoing Tickets
   ├── 👥 My Team
   └── 📈 Team Performance

🎫 Tickets
   └── ➕ Create Ticket

🗑️ Deletion Requests [badge: pending count]

👤 [User Footer with Profile/Logout]
```

**Team Member View:**
```
💼 My Work
   ├── 📋 Assigned to Me [badge: assigned count]
   └── 📤 My Escalations

🎫 Tickets
   └── ➕ Create Ticket

🗑️ Deletion Requests [badge: pending count]

👤 [User Footer with Profile/Logout]
```

**Admin View:**
```
📊 Dashboard

🎫 Tickets
   ├── 📋 All Tickets
   └── ➕ Create Ticket

👥 Admin
   ├── 👤 Users
   └── ⚙️ Settings

🗑️ Deletion Requests [badge: pending count]

👤 [User Footer with Profile/Logout]
```

### **5.2 Color Scheme & Design System**

**Primary Colors:**
- Indigo: `#4f46e5` (primary actions, active states)
- Purple: `#7c3aed` (secondary accents)
- Slate: `#0f172a` to `#1e293b` (sidebar gradient)

**Status Colors:**
- Open: Blue (`#3b82f6`)
- Processed: Yellow (`#eab308`)
- Resolved: Green (`#22c55e`)
- Re-opened: Red (`#ef4444`)
- Closed: Gray (`#6b7280`)

**Priority Colors:**
- Urgent: Red background (`bg-red-100`)
- High: Orange background (`bg-orange-100`)
- Medium: Yellow background (`bg-yellow-100`)
- Low: Green background (`bg-green-100`)

**UI Components:**
- Cards: `card-modern` class with shadow and hover effects
- Stat Cards: `stat-card-*` classes with gradients and borders
- Buttons: Gradient backgrounds with hover animations
- Inputs: White background, dark text (global fix for modals)
- Custom Checkboxes: Gradient backgrounds with smooth animations

### **5.3 Key Page Layouts**

#### **Manager Overview**
```
┌─────────────────────────────────────────────────┐
│ Manager Overview                         [Logo] │
├─────────────────────────────────────────────────┤
│                                                 │
│ [Incoming: 5 Total] [Outgoing: 12 Total]       │
│                                                 │
│ Team Workload Summary:                          │
│ • John: 3 active tickets                        │
│ • Sarah: 5 active tickets (⚠️ high load)        │
│ • Mike: 2 active tickets                        │
│                                                 │
│ [Auto-Assign: ON ✓]                             │
└─────────────────────────────────────────────────┘
```

#### **Incoming Tickets**
```
┌─────────────────────────────────────────────────┐
│ Incoming Tickets                [Auto-Assign: ON]│
├─────────────────────────────────────────────────┤
│ Stats: [15 Total] [8 Unassigned] [3 Urgent]    │
│                                                 │
│ ☐ GROW-001 🔴 URGENT 🟠 Unassigned    [Assign▼]│ ← Clickable
│    Brand XYZ - Issue description...             │
│                                                 │
│   GROW-002 🟡 HIGH ✅ Assigned       [Reassign▼]│ ← Clickable
│    Brand ABC - Already assigned to John         │
└─────────────────────────────────────────────────┘
```

#### **My Work (Team Member)**
```
┌─────────────────────────────────────────────────┐
│ My Work                                  [Logo] │
├─────────────────────────────────────────────────┤
│                                                 │
│ [Assigned to Me: 5]    [I Created: 3]          │
│  • 3 Open               • 2 Open                │
│  • 1 Processed          • 1 Processed           │
│  • 1 Resolved                                   │
│                                                 │
│ Recent Assigned Tickets:                        │
│ • OPS-002 - Brand XYZ [View →]                  │
│ • OPS-005 - Brand ABC [View →]                  │
│                                                 │
│ Recent Escalations:                             │
│ • GROW-010 - Brand DEF [View →]                 │
└─────────────────────────────────────────────────┘
```

---

## **6. TICKET WORKFLOW SPECIFICATIONS**

### **6.1 Bidirectional Flow**

#### **Growth Member Creates Ticket (GROW-XXX)**
```
1. Growth Member creates ticket
   ↓ (Status: open, Assigned: NULL)
   
2. Growth Manager assigns to Growth member
   ↓ (Assigned: Growth Member)
   
3. [If Growth needs to handle internally]
   Growth Member processes → Growth Manager reviews → Closed
   
4. [If needs Ops escalation]
   Appears in Ops Manager "Incoming"
   ↓
   
5. Ops Manager assigns to Ops member
   ↓ (Assigned: Ops Member)
   
6. Ops Member processes (resolves)
   ↓ (Status: processed)
   
7. Growth Member (creator) reviews:
   • Accept → Closed ✓
   • Reopen → Back to step 5
```

#### **Ops Member Creates Ticket (OPS-XXX)**
```
[Mirror flow - exact symmetry with Growth/Ops roles reversed]
```

### **6.2 Status Transition Rules**

| From Status | To Status | Action | Who Can Perform |
|-------------|-----------|--------|-----------------|
| `open` | `processed` | Resolve | Opposite team + Admin |
| `re-opened` | `processed` | Updated resolve | Opposite team + Admin |
| `processed` | `re-opened` | Reopen | Creator team + Admin |
| `processed` | `closed` | Accept | Creator team + Admin |
| Any | Any | Force change | Admin only |

---

## **7. DATA SPECIFICATIONS**

### **7.1 Core Database Schema**

#### **users Table**
```sql
id                    UUID PRIMARY KEY
email                 TEXT UNIQUE NOT NULL
name                  TEXT
role                  TEXT NOT NULL  -- 'growth' | 'ops' | 'admin'
password_hash         TEXT NOT NULL
is_manager            BOOLEAN DEFAULT FALSE
is_active             BOOLEAN DEFAULT TRUE
managed_by            UUID REFERENCES users(id)  -- Manager's user ID
auto_assign_enabled   BOOLEAN DEFAULT FALSE
profile_picture       TEXT
created_at            TIMESTAMPTZ DEFAULT now()
updated_at            TIMESTAMPTZ DEFAULT now()
last_login_at         TIMESTAMPTZ
must_change_password  BOOLEAN DEFAULT FALSE
```

#### **tickets Table**
```sql
id                      UUID PRIMARY KEY
ticket_number           TEXT UNIQUE NOT NULL
created_by              UUID REFERENCES users(id) NOT NULL
brand_name              TEXT NOT NULL
description             TEXT
issue_type              TEXT
expected_output         TEXT
priority                TEXT NOT NULL  -- 'urgent'|'high'|'medium'|'low'
status                  TEXT DEFAULT 'open'
assigned_to             UUID REFERENCES users(id)  -- Current handler
current_assignee        UUID REFERENCES users(id)  -- Who processed it
created_at              TIMESTAMPTZ DEFAULT now()
updated_at              TIMESTAMPTZ DEFAULT now()
last_status_change_at   TIMESTAMPTZ
resolved_at             TIMESTAMPTZ
primary_resolution_remarks TEXT  -- First resolution
resolution_remarks      TEXT  -- Current resolution
reopen_reason           TEXT
acceptance_remarks      TEXT
search_vector           TSVECTOR  -- Full-text search
```

#### **ticket_assignments Table**
```sql
id            UUID PRIMARY KEY
ticket_id     UUID REFERENCES tickets(id)
assigned_by   UUID REFERENCES users(id)
assigned_to   UUID REFERENCES users(id)
notes         TEXT
assigned_at   TIMESTAMPTZ DEFAULT now()
```

#### **ticket_activities Table**
```sql
id          UUID PRIMARY KEY
ticket_id   UUID REFERENCES tickets(id)
actor_id    UUID REFERENCES users(id)
action      TEXT  -- 'created'|'assigned'|'reassigned'|'resolved'|'reopened'|'closed'
comment     TEXT
payload     JSONB
created_at  TIMESTAMPTZ DEFAULT now()
```

### **7.2 API Specifications**

**Base URL:** `/api`

#### **Authentication Endpoints**
```
POST /api/auth/login
Body: { email, password }
Response: { user, token }

POST /api/auth/change-password
Body: { current_password, new_password }
Response: { message }

GET /api/users/me
Response: { user }
```

#### **Ticket Endpoints**
```
POST /api/tickets
Body: CreateTicketDTO
Response: { ticket }

GET /api/tickets
Query: status, priority, created_by, assigned_to, search, limit, offset
Response: { tickets[], total, page, totalPages, hasMore }

GET /api/tickets/:ticket_number
Response: { ticket }

POST /api/tickets/:ticket_number/assign
Body: { assigned_to, notes }
Response: { ticket, message }

POST /api/tickets/:ticket_number/resolve
Body: { remarks }
Response: { ticket }

POST /api/tickets/:ticket_number/reopen
Body: { reason }
Response: { ticket }

POST /api/tickets/:ticket_number/close
Body: { acceptance_remarks? }
Response: { ticket }
```

#### **Manager Endpoints**
```
GET /api/managers/team
Response: { team_members[] }

GET /api/managers/metrics
Response: { metrics }

GET /api/managers/incoming
Response: { tickets[] }

GET /api/managers/outgoing
Response: { tickets[] }

GET /api/managers/workload
Response: { workload[] }

PATCH /api/managers/users/:user_id/toggle-active
Body: { is_active }
Response: { message, is_active }

PATCH /api/managers/auto-assign
Body: { enabled }
Response: { enabled }
```

#### **Admin Endpoints**
```
PATCH /api/admin/users/:user_id/toggle-manager
Body: { is_manager }
Response: { user, message }

POST /api/tickets/:ticket_number/force-status
Body: { status, reason }
Response: { ticket, message }

DELETE /api/tickets/:ticket_number
Response: { message }
```

---

## **8. BUSINESS RULES**

### **8.1 Ticket Visibility Rules**

**Team Members (Non-Managers):**
- See tickets WHERE `assigned_to = user.id` OR `created_by = user.id`
- When explicit `created_by` filter: ONLY tickets they created
- When explicit `assigned_to` filter: ONLY tickets assigned to them

**Managers:**
- See tickets WHERE:
  - `assigned_to` is one of their team members, OR
  - `created_by = manager.id` (their own tickets)
- Can filter by team member to see specific member's tickets

**Admins:**
- See ALL tickets (no restrictions)

### **8.2 Assignment Rules**
- Can only assign to active users (`is_active = true`)
- Managers can only assign to users they manage (`managed_by = manager.id`)
- Admins can assign to anyone
- Reassignment allowed by same rules

### **8.3 Resolution Rules**
- Growth tickets resolved by Ops (bidirectional)
- Ops tickets resolved by Growth (bidirectional)
- Admins can resolve any ticket
- Cannot resolve own team's tickets (except admin override)

### **8.4 Acceptance/Reopen Rules**
- Only creator's team can accept or reopen
- Must provide reason when reopening
- Acceptance remarks optional when closing
- Admins can accept/reopen any ticket

### **8.5 Priority Calculation Rules**
- **Urgent Priority Count**: Total urgent tickets MINUS resolved urgent tickets
- **High Priority Count**: Total high priority tickets (all statuses)
- **Medium Priority Count**: Total medium priority tickets (all statuses)
- **Low Priority Count**: Total low priority tickets (all statuses)

---

## **9. TECHNICAL SPECIFICATIONS**

### **9.1 Frontend Architecture**

**Framework:** React 18 with TypeScript  
**Build Tool:** Vite 7.x  
**Styling:** Tailwind CSS 3.x  
**State Management:**
- Zustand (auth store)
- TanStack Query (server state)

**Key Libraries:**
- `react-router-dom` - Routing
- `@tanstack/react-query` - Data fetching
- `axios` - HTTP client
- `lucide-react` - Icons
- `browser-image-compression` - File compression
- `pako` - Gzip compression

**PWA Features:**
- Manifest file with app metadata
- Service worker with cache-first strategy
- Offline fallback page
- Install prompt component
- Fullscreen toggle

### **9.2 Backend Architecture**

**Framework:** Express.js with TypeScript  
**Database Driver:** node-postgres (pg)  
**Authentication:** JWT with bcrypt  

**Middleware Stack:**
1. CORS configuration
2. JSON body parser
3. Request logging
4. Authentication check (`requireAuth`)
5. Role validation (`requireManager`, `requireRole`)
6. Input validation (Zod schemas)
7. Error handling

**Services Layer:**
- `ticketService` - Ticket CRUD and business logic
- `managerService` - Manager-specific operations
- `attachmentService` - File upload/download
- `authService` - Authentication and authorization

### **9.3 Database Optimization**

**Indexes:**
```sql
-- Users
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_managed_by ON users(managed_by);

-- Tickets
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_created_by ON tickets(created_by);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX idx_tickets_search_vector ON tickets USING gin(search_vector);

-- Activities
CREATE INDEX idx_activities_ticket_id ON ticket_activities(ticket_id);
```

**Full-Text Search:**
- PostgreSQL tsvector on brand_name + description
- English language configuration
- Automatic update trigger

---

## **10. DEPLOYMENT SPECIFICATIONS**

### **10.1 Infrastructure**

**Frontend Hosting:** Vercel (Free Tier)  
**Backend Hosting:** Render (Free Tier)  
**Database:** Supabase PostgreSQL (Free Tier)  
**File Storage:** Supabase Storage (Free Tier)  

### **10.2 Environment Variables (Production)**

**Backend:**
```
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://service_user:***@db.supabase.co:5432/postgres
JWT_SECRET=*** (generated secure random)
SUPABASE_URL=https://***supabase.co
SUPABASE_KEY=***
```

**Frontend:**
```
VITE_API_URL=https://escalation-portal.onrender.com
```

### **10.3 Free Tier Optimization**

**Strategies to Extend Free Usage:**
1. ✅ **UptimeRobot** - Pings `/api/health` every 10 min to prevent cold starts
2. ✅ **File Compression** - Reduces storage usage by 60-80%
3. ✅ **Pagination** - Default 25 items/page to reduce bandwidth
4. ✅ **CDN Caching** - 1-year max-age for attachments
5. ✅ **Lazy Loading** - Attachments load on demand, not by default
6. ✅ **Query Limits** - Dashboard queries limited to 5-10 items

**Expected Usage:**
- Render: ~450 hours/month (stays under 750h limit)
- Supabase: ~500MB database, ~2GB storage (under limits)
- Bandwidth: ~5GB/month with compression

---

## **11. SECURITY SPECIFICATIONS**

### **11.1 Authentication Security**
- Passwords hashed with bcrypt (salt rounds: 10)
- JWT tokens signed with HS256 algorithm
- Token expiration: 24 hours
- HTTP-only cookies (optional, currently using localStorage)

### **11.2 Database Security**
- Service user with limited permissions (no DROP, CREATE)
- Read-only user for analytics/reporting
- Parameterized queries (no string concatenation)
- Transaction management for atomic operations

### **11.3 File Upload Security**
- File type validation (MIME type check)
- File size limits (20MB per file, 5 files max)
- Virus scanning (optional, recommended for production)
- Signed URLs for downloads (Supabase)
- No direct file path exposure

### **11.4 API Security**
- All endpoints require authentication (except health/login)
- Role-based access checks on every protected route
- Input validation with Zod schemas
- SQL injection prevention (parameterized queries)
- XSS prevention (React's built-in escaping)

---

## **12. EDGE CASES & ERROR HANDLING**

### **12.1 Ticket Assignment Edge Cases**

**Case 1:** Manager tries to assign to inactive user  
**Behavior:** Show error "Cannot assign to inactive user"

**Case 2:** User logs in while ticket is being assigned to them  
**Behavior:** Real-time update (15s refresh) shows new assignment

**Case 3:** Multiple managers try to assign same ticket simultaneously  
**Behavior:** Last write wins (optimistic locking not implemented)

**Case 4:** Team member creates ticket and manager assigns it back to them  
**Behavior:** Allowed - ticket appears in both "Assigned to Me" and "I Created"

### **12.2 Status Transition Edge Cases**

**Case 1:** Ticket reopened multiple times  
**Behavior:** 
- `primary_resolution_remarks` preserved (first resolution)
- `resolution_remarks` updated with each new resolution
- Activity log tracks all state changes

**Case 2:** Admin force-changes status to invalid state  
**Behavior:** 
- Allowed (admin override)
- Clears/sets appropriate fields based on new status
- Logs reason in activity with "Admin forced status change"

### **12.3 Manager Workflow Edge Cases**

**Case 1:** Manager is deactivated while having assigned tickets  
**Behavior:** 
- Their team members' tickets remain visible to admin
- New manager can be assigned to take over the team

**Case 2:** Manager promotes team member who has active tickets  
**Behavior:** 
- New manager can still see their own created/assigned tickets
- Can now also see team tickets

**Case 3:** Auto-assign with all team members at capacity  
**Behavior:** Assigns to member with fewest active tickets (round-robin)

---

## **13. FUTURE ENHANCEMENTS**

### **Phase 2 Roadmap**
- [ ] Email notifications for status changes
- [ ] Slack integration for real-time alerts
- [ ] SLA tracking and breach alerts
- [ ] Advanced analytics dashboard
- [ ] Bulk operations (bulk close, bulk reassign)
- [ ] Comment threads on tickets
- [ ] @mentions in comments
- [ ] Ticket templates
- [ ] Export to CSV/Excel
- [ ] Mobile native app (React Native)

### **Phase 3 Roadmap**
- [ ] AI-powered ticket categorization
- [ ] Predictive assignment (ML-based)
- [ ] Customer-facing portal
- [ ] API webhooks for integrations
- [ ] Custom workflows (low-code)
- [ ] Multi-language support
- [ ] Dark mode

---

## **14. TESTING REQUIREMENTS**

### **14.1 Unit Testing**
- All service layer functions
- Utility functions
- Validation schemas

### **14.2 Integration Testing**
- API endpoint flows
- Authentication and authorization
- Ticket lifecycle workflows

### **14.3 E2E Testing**
- Complete ticket creation to closure flow
- Manager assignment workflow
- Cross-team resolution flow
- Admin override scenarios

### **14.4 Security Testing**
- SQL injection attempts
- Unauthorized access attempts
- Role escalation attempts
- File upload attacks

---

## **15. ACCEPTANCE CRITERIA**

### **15.1 Manager Workflow**
- ✅ Managers can view all tickets created by their team members
- ✅ Managers can assign incoming tickets to team members
- ✅ Managers can reassign tickets to different team members
- ✅ Managers see real-time team metrics
- ✅ Auto-assign works with round-robin distribution
- ✅ Team members can be toggled active/inactive

### **15.2 Team Member Workflow**
- ✅ Team members see ONLY tickets created by OR assigned to them
- ✅ "My Escalations" shows ONLY tickets they created
- ✅ "Assigned to Me" shows ONLY tickets assigned to them
- ✅ Full card clickable on all ticket lists
- ✅ Cannot see other team members' tickets

### **15.3 Cross-Team Workflow**
- ✅ Growth can resolve Ops tickets
- ✅ Ops can resolve Growth tickets
- ✅ Creator team can accept/reopen processed tickets
- ✅ Full audit trail of all cross-team interactions

### **15.4 Admin Capabilities**
- ✅ Can promote/demote managers
- ✅ Can force status changes with reason
- ✅ Can view all tickets across teams
- ✅ Can delete users and tickets

### **15.5 UI/UX Requirements**
- ✅ Custom checkbox design with hover effects
- ✅ Full-width Team Management page
- ✅ Correct urgent priority calculation (Total - Resolved)
- ✅ Responsive sidebar navigation
- ✅ PWA support with offline fallback

---

## **16. KNOWN ISSUES & LIMITATIONS**

### **Current Known Issues:**
1. ⚠️ Browser cache sometimes requires hard refresh after deployments
2. ⚠️ PWA install prompt shows even after installation (needs persistent flag)

### **Limitations:**
- No real-time WebSocket updates (uses polling every 15-30s)
- No push notifications (web notifications not implemented)
- File size limited to 20MB (Supabase free tier constraint)
- No virus scanning on uploads (recommended for production)
- Single database instance (no read replicas)

---

## **17. GLOSSARY**

| Term | Definition |
|------|------------|
| **Escalation** | Ticket created by one team for the other team to resolve |
| **Incoming Tickets** | Tickets created by opposite team, needing assignment to your team |
| **Outgoing Tickets** | Tickets created by your team members |
| **Manager** | User with `is_manager: true` flag, can assign and oversee team |
| **Team Member** | Regular user (non-manager) who creates and processes tickets |
| **Processed** | Ticket has been resolved by opposite team, awaiting creator review |
| **Reassignment** | Changing `assigned_to` when already assigned to someone else |
| **Custom Checkbox** | Enhanced checkbox component with gradient backgrounds and animations |
| **PWA** | Progressive Web App with offline support and install capabilities |

---

## **18. APPENDICES**

### **18.1 Demo Credentials**

**Managers:**
- Growth Manager: `growth-manager@example.com` / `growth123`
- Ops Manager: `ops-manager@example.com` / `ops123`

**Team Members:**
- Growth Member 1: `growth-member1@example.com` / `growth123`
- Growth Member 2: `growth-member2@example.com` / `growth123`
- Ops Member 1: `ops-member1@example.com` / `ops123`
- Ops Member 2: `ops-member2@example.com` / `ops123`

**Legacy/Admin:**
- Growth: `growth@example.com` / `growth123`
- Ops: `ops@example.com` / `ops123`
- Admin: `admin@example.com` / `admin123`

### **18.2 Sample Ticket Numbers**
- `GROW-20251022-0001` - Growth ticket (urgent, processed)
- `GROW-20251022-0002` - Growth ticket (urgent, open)
- `GROW-20251022-0003` - Growth ticket (high, processed)
- `OPS-20251022-0001` - Ops ticket (would be created by Ops team)

### **18.3 API Response Examples**

**Team Metrics Response:**
```json
{
  "total_tickets": 5,
  "open_tickets": 2,
  "processed_tickets": 2,
  "resolved_tickets": 1,
  "avg_resolution_time_hours": 0.94,
  "reopen_rate": 0,
  "team_members": [...]
}
```

**Ticket Response:**
```json
{
  "id": "uuid",
  "ticket_number": "GROW-20251022-0001",
  "created_by": "uuid",
  "brand_name": "Brand XYZ",
  "description": "Issue description",
  "issue_type": "GRN Discrepancy",
  "priority": "urgent",
  "status": "processed",
  "assigned_to": "uuid",
  "creator_name": "Sarah Johnson",
  "assigned_to_name": "Ops User"
}
```

---

**Document End**

*This PRD serves as the comprehensive specification for the Escalation Portal v2.0, covering all functional requirements, technical specifications, and business rules for the bidirectional ticketing system with manager workflow capabilities.*
