# Growth ↔ Ops Escalation Portal

A secure, modern web application for managing escalation tickets between Growth and Operations teams with advanced manager workflows and bidirectional ticket creation.

## Features

- 🎫 **Ticket Management**: Create, track, and resolve escalation tickets
- 👥 **Role-Based Access**: Separate workflows for Growth, Ops, Managers, and Admin roles
- 👨‍💼 **Manager Workflow**: Team management, ticket assignment, and performance analytics
- 📎 **File Attachments**: Upload and manage reference files with Supabase storage
- 🔄 **Bidirectional Flow**: Both Growth and Ops teams can create and escalate tickets
- 📊 **Real-time Dashboard**: Live updates and comprehensive metrics
- 🔍 **Advanced Search**: Filter by status, priority, team, and more
- 📝 **Complete Audit Trail**: Detailed activity history for every ticket
- 📱 **PWA Support**: Progressive Web App with offline capabilities
- 🔒 **Row Level Security**: Database-level security with RLS policies

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL 15+ with Supabase
- **Auth**: Custom JWT Authentication
- **Storage**: Supabase Storage (S3-compatible)
- **Deployment**: Render (Backend) + Vercel (Frontend)

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
- Supabase account (PostgreSQL + Storage)
- Render account (for backend deployment)
- Vercel account (for frontend deployment)

### 1. Clone and Install

```bash
cd "/Users/abcom/Downloads/KNOT/Escalation Portal"
npm install
```

### 2. Database Setup

The project uses Supabase for PostgreSQL database and file storage. Set up your Supabase project and run the migrations:

```bash
# Run migrations (apply SQL files in backend/migrations/ to Supabase)
# See docs/deployment.md for detailed instructions
```

### 3. Environment Variables

Create `.env` files in both `backend/` and `frontend/`:

**backend/.env**:
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
JWT_SECRET=your-secret-key-change-in-production

# Supabase Storage
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

**frontend/.env**:
```env
VITE_API_URL=http://localhost:3001
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

### Growth Team Member
- Create tickets
- View assigned tickets
- Accept/reopen tickets
- Add comments and attachments

### Ops Team Member
- View assigned tickets
- Add resolutions
- Change ticket status to processed
- Add comments and attachments

### Growth Manager
- All Growth Team Member permissions
- Manage team members (activate/deactivate)
- Assign tickets to team members
- View team performance metrics
- Reassign tickets within team

### Ops Manager
- All Ops Team Member permissions
- Manage team members (activate/deactivate)
- Assign tickets to team members
- View team performance metrics
- Reassign tickets within team

### Admin
- All permissions across all roles
- Manage users and roles
- View system-wide analytics
- Configure system settings
- Force status changes

## Ticket Workflow

### Bidirectional Escalation Flow

**Growth → Ops Escalation:**
1. **Growth creates ticket** → Status: `open`
2. **Growth Manager assigns** → Assigned to Ops team member
3. **Ops adds resolution** → Status: `processed`
4. **Growth reviews**:
   - Accept → Status: `resolved`
   - Reopen with remarks → Status: `re-opened`

**Ops → Growth Escalation:**
1. **Ops creates ticket** → Status: `open`
2. **Ops Manager assigns** → Assigned to Growth team member
3. **Growth adds resolution** → Status: `processed`
4. **Ops reviews**:
   - Accept → Status: `resolved`
   - Reopen with remarks → Status: `re-opened`

## Development

This project is optimized for development with Cursor AI and includes:

- **TypeScript**: Full type safety across frontend and backend
- **Real-time Updates**: Auto-refresh every 30 seconds
- **PWA Features**: Install prompt, offline support, fullscreen toggle
- **Manager Workflows**: Complete team management and assignment system
- **Security**: Row Level Security (RLS) with JWT authentication

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

See [docs/deployment.md](docs/deployment.md) for detailed deployment instructions.

## Documentation

- [Product Requirements Document](ESCALATION_PORTAL_PRD.md) - Complete feature specifications
- [Technical Design](TECHNICAL_DESIGN.md) - Architecture and implementation details
- [API Specification](docs/api-spec.md) - Complete API documentation
- [Deployment Guide](docs/deployment.md) - Step-by-step deployment instructions

## Contributing

1. Create feature branch
2. Make changes following TypeScript conventions
3. Add tests for new functionality
4. Submit PR with description

## License

MIT
