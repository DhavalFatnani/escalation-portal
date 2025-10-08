# Growth ↔ Ops Escalation Portal

A secure, modern web application for managing escalation tickets between Growth and Operations teams.

## Features

- 🎫 **Ticket Management**: Create, track, and resolve escalation tickets
- 👥 **Role-Based Access**: Separate workflows for Growth, Ops, and Admin roles
- 📎 **File Attachments**: Upload and manage reference files with S3-compatible storage
- 🔔 **Notifications**: Email and Slack notifications for key events
- 📊 **Dashboard & Metrics**: Real-time insights and SLA tracking
- 🔍 **Search & Filters**: Advanced filtering by status, priority, brand, date
- 📝 **Audit Trail**: Complete activity history for every ticket

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL 15+
- **Auth**: Clerk (or Logto/Auth0)
- **Storage**: S3-compatible (AWS S3, DigitalOcean Spaces)
- **Notifications**: Email (Postmark/SES) + Slack webhooks

## Project Structure

```
escalation-portal/
├── backend/          # Express API server
│   ├── src/
│   │   ├── config/   # Configuration
│   │   ├── middleware/ # Auth, validation, error handling
│   │   ├── routes/   # API endpoints
│   │   ├── services/ # Business logic
│   │   ├── types/    # TypeScript types
│   │   └── utils/    # Helper functions
│   └── migrations/   # Database migrations
├── frontend/         # React application
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── pages/    # Page components
│   │   ├── hooks/    # Custom React hooks
│   │   ├── services/ # API client
│   │   └── types/    # TypeScript types
└── docs/            # Documentation
```

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+
- AWS S3 account (or compatible storage)
- Clerk account (for authentication)

### 1. Clone and Install

```bash
cd "/Users/abcom/Downloads/KNOT/Escalation Portal"
npm install
```

### 2. Database Setup

```bash
# Create database
createdb escalation_portal

# Run migrations
cd backend
npm run migrate
```

### 3. Environment Variables

Create `.env` files in both `backend/` and `frontend/`:

**backend/.env**:
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/escalation_portal
JWT_SECRET=your-secret-key-change-in-production

# Clerk
CLERK_SECRET_KEY=your-clerk-secret-key

# S3 Storage
S3_BUCKET=your-bucket-name
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key

# Notifications
POSTMARK_API_KEY=your-postmark-key
SLACK_WEBHOOK_URL=your-slack-webhook-url
```

**frontend/.env**:
```env
VITE_API_URL=http://localhost:3001
VITE_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
```

### 4. Run Development Servers

```bash
# From root directory
npm run dev

# Or separately:
npm run dev:backend   # Runs on http://localhost:3001
npm run dev:frontend  # Runs on http://localhost:5173
```

### 5. Seed Initial Data (Optional)

```bash
cd backend
npm run seed
```

This creates sample users:
- `growth@example.com` (password: `growth123`, role: growth)
- `ops@example.com` (password: `ops123`, role: ops)
- `admin@example.com` (password: `admin123`, role: admin)

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/users/me` - Get current user

### Tickets
- `POST /api/tickets` - Create ticket (Growth)
- `GET /api/tickets` - List tickets with filters
- `GET /api/tickets/:ticket_number` - Get ticket details
- `PATCH /api/tickets/:ticket_number` - Update ticket
- `POST /api/tickets/:ticket_number/resolve` - Ops posts resolution
- `POST /api/tickets/:ticket_number/reopen` - Growth reopens ticket
- `POST /api/tickets/:ticket_number/close` - Close ticket
- `GET /api/tickets/:ticket_number/activities` - Get activity timeline

### Attachments
- `POST /api/tickets/:ticket_number/attachments` - Upload file

## User Roles & Permissions

### Growth
- Create tickets
- View own tickets
- Accept/reopen tickets
- Add comments

### Ops
- View all tickets
- Claim tickets
- Add resolutions
- Change ticket status to processed

### Admin
- All Growth + Ops permissions
- Manage users
- View analytics
- Configure system settings

## Ticket Workflow

1. **Growth creates ticket** → Status: `open`
2. **Ops adds resolution** → Status: `processed`
3. **Growth reviews**:
   - Accept → Status: `resolved`
   - Reopen with remarks → Status: `re-opened`

## Development with Cursor

This project is optimized for development with Cursor AI:

1. **`.cursorrules`** file defines project conventions
2. Use Cursor to:
   - Generate new API endpoints with tests
   - Create React components from descriptions
   - Refactor code while maintaining conventions
   - Generate SQL migrations

Example Cursor prompts:
- "Add a new API endpoint to bulk assign tickets"
- "Create a React component for the metrics dashboard"
- "Generate a migration to add SLA fields to tickets table"

## Testing

```bash
# Run all tests
npm test

# Run backend tests
npm test --workspace=backend

# Run frontend tests
npm test --workspace=frontend
```

## Deployment

See [docs/deployment.md](docs/deployment.md) for detailed deployment instructions for:
- Vercel/Netlify (Frontend)
- Render/AWS ECS (Backend)
- AWS RDS (Database)

## Contributing

1. Create feature branch
2. Make changes following `.cursorrules` conventions
3. Add tests
4. Submit PR with description

## License

MIT
# escalation-portal
# escalation-portal
