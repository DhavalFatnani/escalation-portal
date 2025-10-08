# Escalation Portal - Product Requirements Document

## 1. Product Overview

### 1.1 Purpose
The Escalation Portal is a secure web application that enables structured escalation workflows between Growth and Operations teams. It provides a centralized platform for managing, tracking, and resolving escalation tickets with complete audit trails.

### 1.2 Target Users
- **Growth Team**: Creates and manages escalation tickets for brand-related issues
- **Operations Team**: Processes tickets, provides resolutions, and root cause analysis
- **Administrators**: Manage users, access controls, and system configuration

## 2. Core Features

### 2.1 User Authentication & Authorization
**Requirement**: Secure login system with role-based access control

**Acceptance Criteria**:
- Users can log in with email and password
- JWT tokens are issued upon successful authentication
- Three user roles supported: Growth, Ops, Admin
- Role-based permissions enforced on all actions
- Automatic logout on token expiration
- Session persistence across browser refreshes

### 2.2 Dashboard
**Requirement**: Overview page showing ticket statistics and recent activity

**Acceptance Criteria**:
- Display ticket count cards: Open, Awaiting Review (Processed), Re-opened
- Show list of recent tickets (up to 10)
- Each ticket shows: ticket number, brand, status, priority, creation date
- Stats cards are clickable and filter to respective status
- Dashboard updates when new tickets are created

### 2.3 Ticket Creation (Growth Only)
**Requirement**: Growth users can create escalation tickets

**Acceptance Criteria**:
- Form includes fields: brand name (required), description, issue type, expected output, priority (required)
- Priority options: Urgent, High, Medium, Low
- Issue type options: Product Not As Listed, Giant Discrepancy, Physical vs Scale Mismatch, Other
- System auto-generates unique ticket number in format: GROW-YYYYMMDD-NNNN
- Ticket created with status "open"
- User redirected to ticket detail page after creation
- Creation action logged in activity timeline
- Form validates required fields before submission

### 2.4 Ticket List with Search & Filters
**Requirement**: Users can view, search, and filter tickets

**Acceptance Criteria**:
- Display paginated list of tickets
- Search functionality across ticket number, brand name, description
- Filter by status: open, processed, resolved, re-opened
- Filter by priority: urgent, high, medium, low
- Multiple filters can be applied simultaneously
- Growth users see only their own tickets
- Ops and Admin users see all tickets
- Tickets sorted by priority (urgent first) then creation date
- Color-coded status and priority badges

### 2.5 Ticket Detail View
**Requirement**: Detailed view of individual tickets with complete information and history

**Acceptance Criteria**:
- Display all ticket fields: number, brand, description, issue type, priority, status
- Show creator information and creation date
- Display assignee information if assigned
- Show complete activity timeline in chronological order
- Timeline shows: action type, actor, timestamp, comments
- Resolution remarks displayed prominently if present
- Reopen reason displayed if ticket was reopened
- Context-aware action forms based on user role and ticket status

### 2.6 Add Resolution (Ops Only)
**Requirement**: Ops users can add resolution and mark tickets as processed

**Acceptance Criteria**:
- Resolution form visible only to Ops users
- Form only appears when ticket status is "open" or "re-opened"
- Resolution remarks field is required (multi-line text)
- Submitting resolution changes ticket status to "processed"
- Current user is assigned to the ticket
- Resolution timestamp recorded
- Activity logged with resolution details
- Form shows loading state during submission
- Success/error feedback displayed

### 2.7 Reopen Ticket (Growth Only)
**Requirement**: Growth users can reopen processed tickets if resolution is unsatisfactory

**Acceptance Criteria**:
- Reopen form visible only to Growth users
- Form only appears when ticket status is "processed"
- Reopen reason field is required
- Submitting changes ticket status to "re-opened"
- Activity logged with reopen reason
- Ticket returns to Ops queue
- Previous resolution remains visible

### 2.8 Accept & Close Ticket (Growth Only)
**Requirement**: Growth users can accept resolution and close tickets

**Acceptance Criteria**:
- Close button visible only to Growth users
- Button only appears when ticket status is "processed"
- Clicking changes ticket status to "resolved"
- Resolution timestamp recorded
- Activity logged
- Ticket removed from active queues

### 2.9 Activity Timeline
**Requirement**: Complete audit trail of all ticket actions

**Acceptance Criteria**:
- All status changes logged automatically
- Each activity shows: action type, actor name, timestamp
- Comments/remarks displayed in timeline
- Activities displayed in chronological order (oldest first)
- System actions (auto-generated) clearly distinguished from user actions
- Timeline updates in real-time after actions

## 3. User Workflows

### 3.1 Ticket Creation Workflow (Growth)
1. Growth user logs in
2. Navigates to "New Ticket" page
3. Fills in brand name, description, issue type, priority
4. Clicks "Create Ticket"
5. System validates input
6. System generates unique ticket number
7. Ticket created with status "open"
8. User redirected to ticket detail page
9. Confirmation message displayed

### 3.2 Ticket Resolution Workflow (Ops)
1. Ops user logs in
2. Views list of open/re-opened tickets
3. Selects a ticket to process
4. Reviews ticket details and issue
5. Enters resolution remarks (root cause, fix details)
6. Clicks "Mark as Processed"
7. Ticket status changes to "processed"
8. Ops user assigned to ticket
9. Growth user notified (future: email/Slack)

### 3.3 Ticket Review Workflow (Growth)
1. Growth user views processed tickets
2. Opens ticket detail
3. Reviews resolution provided by Ops
4. Decision point:
   - **Accept**: Click "Accept & Close" → status becomes "resolved"
   - **Reopen**: Enter reason → Click "Reopen" → status becomes "re-opened"
5. Activity logged
6. Dashboard updated

## 4. User Interface Requirements

### 4.1 General UI/UX
- Modern, clean design with Tailwind CSS
- Responsive layout (desktop, tablet, mobile)
- Consistent color scheme and typography
- Loading states for all async operations
- Clear error messages with actionable guidance
- Success confirmations for all actions
- Accessible (WCAG 2.1 AA compliant)

### 4.2 Navigation
- Top navigation bar with:
  - Logo/Title
  - Dashboard link
  - Tickets link
  - New Ticket button (Growth only)
  - User menu (name, role, logout)
- Active page highlighted in navigation
- Back button on detail pages

### 4.3 Visual Indicators
**Priority Colors**:
- Urgent: Red badge
- High: Orange badge
- Medium: Yellow badge
- Low: Green badge

**Status Colors**:
- Open: Blue badge
- Processed: Yellow badge
- Resolved: Green badge
- Re-opened: Red badge

### 4.4 Forms
- Clear field labels
- Required field indicators (*)
- Inline validation errors
- Submit buttons with loading states
- Cancel buttons return to previous page
- Disabled states for invalid submissions

## 5. Security Requirements

### 5.1 Authentication
- Passwords hashed with bcrypt (salt rounds ≥ 10)
- JWT tokens with 7-day expiration
- Automatic logout on token expiration
- Session persistence in localStorage

### 5.2 Authorization
- All API endpoints require authentication
- Role-based middleware enforces permissions
- Growth users cannot access Ops-only actions
- Ops users cannot reopen/close tickets
- Admin users have all permissions

### 5.3 Data Protection
- Input validation on all forms (client & server)
- XSS prevention via React's automatic escaping
- SQL injection prevention via parameterized queries
- CSRF protection via JWT tokens
- HTTPS in production

## 6. Performance Requirements

### 6.1 Load Times
- Initial page load: < 2 seconds
- Ticket list page: < 1 second
- Ticket detail page: < 1 second
- Search results: < 500ms

### 6.2 Responsiveness
- Form submissions: < 1 second
- Search/filter updates: < 500ms
- UI interactions: < 100ms

## 7. Browser Compatibility
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

## 8. Success Metrics
- Ticket creation time: < 2 minutes
- Time to resolution: tracked per priority
- Re-open rate: < 20%
- User satisfaction: > 4/5 rating
- System uptime: > 99.9%

## 9. Out of Scope (Future Phases)
- File attachment uploads
- Email notifications
- Slack integration
- Bulk operations
- Advanced analytics dashboard
- Mobile native apps
- SSO integration
- Webhook API
