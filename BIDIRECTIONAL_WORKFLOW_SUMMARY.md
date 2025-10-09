# Bidirectional Workflow Implementation

## Overview
The Escalation Portal now supports bidirectional ticketing where both Growth and Ops teams can create tickets and escalate to each other.

## Key Changes

### 1. **Ticket Creation**
- **Growth Team** can create tickets (prefixed with `GROW-`) to escalate issues to Ops
- **Ops Team** can create tickets (prefixed with `OPS-`) to escalate issues to Growth
- Admin can view all tickets but typically doesn't create them

### 2. **Ticket Resolution Flow**

#### Growth → Ops Flow:
1. Growth team member creates ticket (GROW-XXX)
2. Ops team resolves the ticket (marks as "processed")
3. Growth team can either:
   - **Accept**: Close the ticket (mark as "resolved")
   - **Reject**: Reopen with reason (status becomes "re-opened")
4. If reopened, Ops provides updated resolution
5. Growth reviews and closes

#### Ops → Growth Flow:
1. Ops team member creates ticket (OPS-XXX)
2. Growth team resolves the ticket (marks as "processed")
3. Ops team can either:
   - **Accept**: Close the ticket (mark as "resolved")
   - **Reject**: Reopen with reason (status becomes "re-opened")
4. If reopened, Growth provides updated resolution
5. Ops reviews and closes

### 3. **Permissions**

| Action | Growth Team | Ops Team | Admin |
|--------|-------------|----------|-------|
| Create Ticket | ✅ (GROW-XXX) | ✅ (OPS-XXX) | ❌ |
| Resolve Growth Ticket | ❌ | ✅ | ✅ |
| Resolve Ops Ticket | ✅ | ❌ | ✅ |
| Reopen Own Ticket | ✅ | ✅ | ✅ |
| Close Own Ticket | ✅ | ✅ | ✅ |

### 4. **Visual Segregation**

#### Ticket List Page:
- **Team Filter Buttons**:
  - `All Tickets`: Show all tickets
  - `My Team Created`: Show only tickets created by your team
  - `Assigned to My Team`: Show only tickets the other team created for you to resolve

- **Direction Badges**: Each ticket shows flow direction
  - `GROWTH → OPS`: Growth team escalated to Ops
  - `OPS → GROWTH`: Ops team escalated to Growth

#### Ticket Detail Page:
- Large banner showing: `"[CREATOR] Team escalated to [HANDLER] Team"`
- Color-coded badges for easy identification

### 5. **Database Changes**

#### Backend Types Updated:
```typescript
export interface Ticket {
  // ... existing fields
  creator_role?: UserRole;  // NEW: Role of ticket creator
  creator_name?: string;
  creator_email?: string;
}
```

#### SQL Queries Updated:
All ticket retrieval queries now include:
```sql
SELECT t.*, 
  u.name as creator_name, 
  u.email as creator_email,
  u.role as creator_role  -- NEW
FROM tickets t
LEFT JOIN users u ON t.created_by = u.id
```

### 6. **Frontend Components Updated**

#### Files Modified:
- `frontend/src/pages/CreateTicketPage.tsx`: Dynamic messaging based on user role
- `frontend/src/pages/TicketsListPage.tsx`: Team filters and direction badges
- `frontend/src/pages/TicketDetailPage.tsx`: Permissions and flow indicators
- `frontend/src/components/Layout.tsx`: "New Ticket" button visible for both teams
- `backend/src/routes/tickets.ts`: Bidirectional permission checks
- `backend/src/services/ticketService.ts`: Dynamic ticket prefixes (GROW vs OPS)

## Testing Checklist

### As Growth User:
- [ ] Can create ticket (GROW-XXX prefix)
- [ ] Can see "Assigned to My Team" tickets (OPS team tickets)
- [ ] Can resolve OPS team tickets
- [ ] Can reopen/close own GROWTH tickets
- [ ] Cannot resolve own GROWTH tickets

### As Ops User:
- [ ] Can create ticket (OPS-XXX prefix)
- [ ] Can see "Assigned to My Team" tickets (GROWTH team tickets)
- [ ] Can resolve GROWTH team tickets
- [ ] Can reopen/close own OPS tickets
- [ ] Cannot resolve own OPS tickets

### As Admin:
- [ ] Can view all tickets
- [ ] Can resolve any ticket
- [ ] Can force status changes
- [ ] Can delete tickets

## Debugging

If permission issues occur, check browser console for debug logs:
```javascript
Permission Debug: {
  userRole: 'growth' | 'ops' | 'admin',
  creatorRole: 'growth' | 'ops',
  ticketStatus: 'open' | 'processed' | ...
  ticketNumber: 'GROW-001' | 'OPS-001'
}

Permission Results: {
  canResolve: boolean,
  canReopen: boolean,
  canClose: boolean
}
```

## Notes

- Ticket numbers automatically get the correct prefix based on creator's role
- The "opposite team" resolves tickets (Ops resolves Growth tickets, Growth resolves Ops tickets)
- Only the creator's team can reopen or close their own tickets
- Admin has override permissions for all actions
