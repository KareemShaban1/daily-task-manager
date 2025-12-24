# Architecture Documentation

## System Architecture Overview

The Daily Life Task Manager is built as a scalable, multi-tenant SaaS application with a clear separation between frontend and backend.

## Architecture Diagram

```
┌─────────────────┐
│   React Frontend │
│   (Port 5173)    │
└────────┬─────────┘
         │ HTTP/REST API
         │
┌────────▼─────────┐
│  Express Backend  │
│   (Port 3001)     │
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────┐
│ MySQL │ │ SMTP  │
│  DB   │ │ Email │
└───────┘ └───────┘
```

## Backend Architecture

### Layer Structure

1. **Routes Layer** (`src/routes/`)
   - Defines API endpoints
   - Routes requests to controllers
   - Applies middleware (authentication, validation)

2. **Controllers Layer** (`src/controllers/`)
   - Handles HTTP request/response
   - Validates input
   - Calls services for business logic
   - Returns JSON responses

3. **Services Layer** (`src/services/`)
   - Business logic
   - Background jobs (cron)
   - Notification processing
   - Complex calculations

4. **Database Layer** (`src/database/`)
   - Connection pooling
   - Schema definitions
   - Migration scripts

5. **Utils Layer** (`src/utils/`)
   - Reusable utilities
   - Email sending
   - JWT handling
   - Password hashing
   - Timezone conversion

### Multi-tenant Architecture

The application is designed for multi-tenancy:

- **User Isolation**: All queries filter by `user_id`
- **Subscription Tiers**: Built-in structure for free/premium/enterprise
- **Scalable**: Can be extended with organization/team features

### Database Design

#### Key Tables

1. **users** - Core user data
2. **tasks** - Task definitions with reminders
3. **task_completions** - Daily completion records
4. **task_streaks** - Calculated streak data
5. **scheduled_reminders** - Reminder queue for cron
6. **notifications** - In-app notification storage

#### Indexing Strategy

- Primary keys on all tables
- Foreign key indexes
- Composite indexes on frequently queried columns
- Date-based indexes for statistics queries

### Notification System

#### Architecture

```
┌──────────────┐
│  Cron Job     │
│  (Every min) │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ Check Reminders  │
│ scheduled_reminders│
└──────┬───────────┘
       │
   ┌───┴───┐
   │       │
┌──▼──┐ ┌─▼────┐
│ In- │ │Email │
│ App │ │SMTP  │
└─────┘ └──────┘
```

#### Flow

1. User creates task with reminder times
2. System creates entries in `scheduled_reminders`
3. Cron job runs every minute
4. Checks for reminders due in next minute
5. Creates in-app notification
6. Sends email (if enabled)
7. Updates next reminder time

### Timezone Handling

- All dates stored in UTC
- User timezone stored in `users.timezone`
- Conversion happens at:
  - Display time (frontend)
  - Reminder calculation (backend)
  - Statistics aggregation (backend)

Uses Luxon library for reliable timezone conversion.

## Frontend Architecture

### Component Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   └── ...              # Custom components
├── contexts/            # React contexts
│   └── AuthContext.tsx
├── lib/
│   └── api.ts          # API client
├── pages/              # Page components
└── hooks/              # Custom hooks
```

### State Management

- **React Query** - Server state, caching, synchronization
- **React Context** - Authentication state
- **Local State** - Component-specific state

### API Client

Centralized API client (`src/lib/api.ts`):
- Handles authentication tokens
- Consistent error handling
- Type-safe requests
- Automatic token refresh (future)

## Security Architecture

### Authentication Flow

```
1. User submits credentials
2. Backend validates
3. Returns JWT token
4. Frontend stores in localStorage
5. Token included in Authorization header
6. Middleware validates on each request
```

### Security Measures

1. **Password Security**
   - bcrypt hashing (12 rounds)
   - Minimum 8 characters
   - Reset tokens expire in 1 hour

2. **JWT Security**
   - Secret key in environment
   - Token expiration (7 days)
   - HTTP-only cookies (optional enhancement)

3. **API Security**
   - Rate limiting (100 req/15min)
   - Helmet.js security headers
   - CORS configuration
   - Input validation

4. **Database Security**
   - Parameterized queries (SQL injection prevention)
   - User isolation (row-level security)
   - Connection pooling limits

## Scalability Considerations

### Horizontal Scaling

- **Stateless Backend**: Can run multiple instances
- **Database**: MySQL with read replicas
- **Load Balancer**: Required for multiple instances
- **Session Storage**: JWT (stateless) or Redis (if needed)

### Performance Optimizations

1. **Database**
   - Connection pooling
   - Indexed queries
   - Query optimization
   - Caching layer (future: Redis)

2. **API**
   - Response compression
   - Pagination for large datasets
   - Efficient queries (avoid N+1)

3. **Frontend**
   - Code splitting
   - Lazy loading
   - React Query caching
   - Optimistic updates

### Background Jobs

- **Cron Jobs**: node-cron for scheduled tasks
- **Queue System**: Can be enhanced with Bull/BullMQ
- **Job Processing**: Separate worker processes (future)

## Deployment Architecture

### Recommended Setup

```
┌─────────────┐
│   CDN/      │
│   Frontend  │
└─────────────┘
       │
┌──────▼──────┐
│ Load        │
│ Balancer    │
└──────┬──────┘
       │
   ┌───┴───┐
   │       │
┌──▼──┐ ┌─▼──┐
│App  │ │App │
│Inst1│ │Inst2│
└──┬──┘ └─┬──┘
   │      │
   └──┬───┘
      │
  ┌───▼────┐
  │ MySQL  │
  │Primary │
  └───┬────┘
      │
  ┌───▼────┐
  │ MySQL  │
  │Replica │
  └────────┘
```

### Environment Setup

- **Development**: Local MySQL, single instance
- **Staging**: Cloud MySQL, single instance
- **Production**: Managed MySQL, multiple instances, load balancer

## Monitoring & Logging

### Recommended Tools

1. **Application Monitoring**
   - Error tracking (Sentry)
   - Performance monitoring (New Relic, Datadog)

2. **Database Monitoring**
   - Query performance
   - Connection pool status
   - Slow query log

3. **Infrastructure Monitoring**
   - Server resources
   - Network latency
   - Uptime monitoring

## Future Enhancements

### Microservices (Optional)

If scaling beyond monolith:

```
┌─────────────┐
│   API       │
│   Gateway   │
└──────┬──────┘
       │
   ┌───┴───┬──────────┬──────────┐
   │       │          │          │
┌──▼──┐ ┌─▼──┐ ┌────▼───┐ ┌────▼───┐
│Auth │ │Task│ │Notify │ │Stats   │
│Svc  │ │Svc │ │Svc    │ │Svc     │
└─────┘ └────┘ └───────┘ └────────┘
```

### Caching Strategy

- **Redis** for:
  - Session storage
  - API response caching
  - Rate limiting
  - Real-time notifications (pub/sub)

### Message Queue

- **Bull/BullMQ** for:
  - Email queue
  - Background processing
  - Scheduled jobs
  - Retry logic

---

This architecture is designed to scale from a small application to a large SaaS platform while maintaining code quality and developer experience.


