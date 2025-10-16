# API Specification

Base URL: `https://your-api-domain.com/api`

All endpoints require authentication unless otherwise specified.

## Authentication

### POST /auth/login
Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "growth"
  }
}
```

### POST /auth/register
Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "growth"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "growth"
  }
}
```

## Users

### GET /users/me
Get current authenticated user.

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "growth"
  }
}
```

## Tickets

### POST /tickets
Create a new ticket (Growth role only).

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "brand_name": "Acme Corporation",
  "description": "Product images showing wrong specifications",
  "issue_type": "product_not_as_listed",
  "expected_output": "images, scale_level_with_remarks",
  "priority": "urgent"
}
```

**Response:**
```json
{
  "ticket": {
    "id": "uuid",
    "ticket_number": "GROW-20251008-0001",
    "created_by": "uuid",
    "brand_name": "Acme Corporation",
    "description": "Product images showing wrong specifications",
    "issue_type": "product_not_as_listed",
    "expected_output": "images, scale_level_with_remarks",
    "priority": "urgent",
    "status": "open",
    "created_at": "2025-10-08T10:00:00Z",
    "updated_at": "2025-10-08T10:00:00Z"
  }
}
```

### GET /tickets
List tickets with optional filters.

**Query Parameters:**
- `status` (optional): Comma-separated list of statuses
- `priority` (optional): Comma-separated list of priorities
- `brand_name` (optional): Filter by brand name (partial match)
- `search` (optional): Full-text search
- `created_by` (optional): Filter by creator UUID
- `current_assignee` (optional): Filter by assignee UUID
- `date_from` (optional): ISO date string
- `date_to` (optional): ISO date string
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Example:**
```
GET /tickets?status=open,processed&priority=urgent&limit=10
```

**Response:**
```json
{
  "tickets": [
    {
      "id": "uuid",
      "ticket_number": "GROW-20251008-0001",
      "brand_name": "Acme Corporation",
      "status": "open",
      "priority": "urgent",
      "creator_name": "John Doe",
      "creator_email": "john@example.com",
      "created_at": "2025-10-08T10:00:00Z"
    }
  ],
  "total": 42
}
```

### GET /tickets/:ticket_number
Get ticket details.

**Response:**
```json
{
  "ticket": {
    "id": "uuid",
    "ticket_number": "GROW-20251008-0001",
    "created_by": "uuid",
    "brand_name": "Acme Corporation",
    "description": "Product images showing wrong specifications",
    "issue_type": "product_not_as_listed",
    "expected_output": "images, scale_level_with_remarks",
    "priority": "urgent",
    "status": "open",
    "created_at": "2025-10-08T10:00:00Z",
    "updated_at": "2025-10-08T10:00:00Z",
    "creator_name": "John Doe",
    "creator_email": "john@example.com"
  }
}
```

### PATCH /tickets/:ticket_number
Update ticket fields.

**Request:**
```json
{
  "priority": "high",
  "current_assignee": "uuid"
}
```

**Response:**
```json
{
  "ticket": { /* updated ticket */ }
}
```

### POST /tickets/:ticket_number/resolve
Ops adds resolution and marks ticket as "processed".

**Request:**
```json
{
  "remarks": "Root cause: Data sync issue. Fixed database records.",
  "attachments": ["url1", "url2"]
}
```

**Response:**
```json
{
  "ticket": { /* updated ticket with status=processed */ }
}
```

### POST /tickets/:ticket_number/reopen
Growth reopens a processed ticket.

**Request:**
```json
{
  "reason": "Resolution incomplete - images still incorrect"
}
```

**Response:**
```json
{
  "ticket": { /* updated ticket with status=re-opened */ }
}
```

### POST /tickets/:ticket_number/close
Growth closes ticket as resolved (accepts resolution).

**Response:**
```json
{
  "ticket": { /* updated ticket with status=resolved */ }
}
```

### GET /tickets/:ticket_number/activities
Get activity timeline for a ticket.

**Response:**
```json
{
  "activities": [
    {
      "id": "uuid",
      "ticket_id": "uuid",
      "actor_id": "uuid",
      "action": "created",
      "comment": "Initial ticket creation",
      "payload": null,
      "created_at": "2025-10-08T10:00:00Z",
      "actor_name": "John Doe",
      "actor_email": "john@example.com"
    },
    {
      "id": "uuid",
      "ticket_id": "uuid",
      "actor_id": "uuid",
      "action": "resolution_added",
      "comment": "Root cause identified and fixed",
      "payload": {"attachments": []},
      "created_at": "2025-10-08T14:00:00Z",
      "actor_name": "Jane Smith",
      "actor_email": "jane@example.com"
    }
  ]
}
```

## Data Types

### User Roles
- `growth`
- `ops`
- `admin`

### Ticket Status
- `open`
- `processed`
- `resolved`
- `re-opened`
- `closed`

### Ticket Priority
- `urgent`
- `high`
- `medium`
- `low`

### Issue Types
- `product_not_as_listed` - "Product Not Live After Return"
- `giant_discrepancy_brandless_inverterless` - "GRN Discrepancy"
- `physical_vs_scale_mismatch` - "Physical Product vs SKU Mismatch"
- `other` - "Other" (custom issue type can be specified in description)

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "details": [ /* optional validation details */ ]
}
```

### Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error
