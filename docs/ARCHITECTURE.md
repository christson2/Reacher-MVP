# Reacher MVP — System Architecture

## Overview

Reacher is a **modular, event-driven marketplace platform** architected for:
- **Independent service evolution** — Each module develops at its own pace
- **Fault isolation** — Bugs in one service don't cascade
- **Parallel development** — Teams work on different services simultaneously
- **Easy scalability** — Services can be replicated, scaled, or replaced independently

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js + TS)                      │
│  ┌─────────┐ ┌──────────┐ ┌──────────────┐ ┌──────────────────┐│
│  │  Auth   │ │   Home   │ │   Consumer   │ │  Seller/Provider ││
│  │ Module  │ │ Module   │ │  Dashboard   │ │    Dashboards    ││
│  └─────────┘ └──────────┘ └──────────────┘ └──────────────────┘│
│                                                                  │
│  State: Zustand (auth, app state)                              │
│  API: Centralized axios client + SWR                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│               API Gateway (Port 5000)                           │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ • JWT Validation                                            ││
│  │ • Rate Limiting                                             ││
│  │ • Request Routing                                           ││
│  │ • Response Transformation                                   ││
│  │ • Error Handling                                            ││
│  └─────────────────────────────────────────────────────────────┘│
└──────────────────────────┬──────────────────────────────────────┘
             │             │              │              │
    ┌────────┴──────┐      │       ┌──────┴─────┐       │
    ▼               ▼      ▼       ▼             ▼       ▼
┌─────────┐   ┌──────────┐  ┌──────────────┐  ┌────────────────┐
│   Auth  │   │  User    │  │   Product    │  │  Service       │
│Service  │   │ Service  │  │   Service    │  │  Provider Svc  │
│         │   │          │  │              │  │                │
│ • Login │   │ • CRUD   │  │ • CRUD       │  │ • CRUD         │
│ • Signup│   │ • Roles  │  │ • Search     │  │ • Search       │
│         │   │          │  │ • Images     │  │ • Portfolio    │
└─────────┘   └──────────┘  └──────────────┘  └────────────────┘

    ┌────────┐   ┌──────────┐   ┌─────────────┐
    ▼        ▼   ▼          ▼   ▼             ▼
┌────────────────┐  ┌──────────────┐  ┌──────────────────┐
│  Trust         │  │  Message     │  │  Notification    │
│  Service       │  │  Service     │  │  Service         │
│                │  │              │  │                  │
│ • Reports      │  │ • Messaging  │  │ • Push notifs    │
│ • Moderation   │  │ • WebSockets │  │ • Email          │
│ • Trust badges │  │ • History    │  │ • SMS            │
└────────────────┘  └──────────────┘  └──────────────────┘
         │                 │                    │
         └─────────────────┼────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────────┐
         │    PostgreSQL (w/ RLS Policies)     │
         │                                     │
         │  • Users & Profiles                 │
         │  • Products & Services              │
         │  • Requests & Bids                  │
         │  • Messages & Reviews               │
         │  • Trust Reports & Badges           │
         │  • Favorites                        │
         └─────────────────────────────────────┘
                           │
                    ┌──────┴──────┐
                    ▼             ▼
              ┌──────────┐    ┌─────────┐
              │  Redis   │    │ Storage │
              │ (Cache)  │    │ (S3)    │
              └──────────┘    └─────────┘
```

## Layers

### 1. Presentation Layer (Frontend)
- **Framework**: Next.js 14 + React 18 + TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand + SWR (React Query alternative)
- **Components**: Atomic Design (atoms → molecules → organisms → pages)
- **Features**:
  - Server-side rendering for SEO
  - Code splitting & lazy loading
  - Responsive design
  - Progressive enhancement

### 2. API Gateway Layer
- **Purpose**: Single entry point for all API requests
- **Responsibilities**:
  - JWT token validation
  - Request routing to appropriate service
  - Rate limiting
  - Logging and monitoring
  - CORS management
  - Response transformation

### 3. Service Layer (Microservices)
Each service is **independently deployable** and **database agnostic**:

| Service | Port | Responsibility |
|---------|------|-----------------|
| Auth Service | 5001 | User registration, login, JWT issuance |
| User Service | 5002 | User profiles, account management |
| Product Service | 5003 | Product listings, search |
| Provider Service | 5004 | Professional services, portfolios |
| Trust Service | 5005 | Reports, moderation, trust badges |
| Message Service | 5006 | Messaging, WebSockets (real-time) |
| Notification Service | 5007 | Push, email, SMS alerts |

**Service Characteristics:**
- REST APIs with JSON responses
- Input validation via express-validator
- Error handling with appropriate HTTP status codes
- Logging for debugging and monitoring
- Health check endpoint `/health`

### 4. Data Access Layer (Database)
- **Type**: PostgreSQL (managed via Supabase or self-hosted)
- **Access Control**: Row Level Security (RLS) policies
- **Schema Versioning**: Migrations (future: Flyway/Liquibase)
- **Caching**: Redis for session tokens, frequently accessed data
- **Storage**: Supabase Storage or AWS S3 for media

## Communication Patterns

### 1. Request-Response (Synchronous)
**Frontend ↔ API Gateway ↔ Services ↔ Database**
- Used for immediate responses (login, CRUD operations)
- All requests validated with JWT

### 2. Pub-Sub / Event-Driven (Asynchronous - Future)
**Service A → Event Bus → Service B**
- Example: User completes order → Order Service publishes event → Notification Service listens
- Tools: Kafka, RabbitMQ, or Redis Streams
- Benefit: Loose coupling, scalability

### 3. Database-to-Database (Via RLS)
- Services read from shared Postgres database
- Row Level Security ensures no data leakage between users
- Each service queries tables relevant to its domain

## Data Model

### Core Entities

```
Users
├── Profiles (one-to-one)
├── Products (one-to-many, seller)
├── Services (one-to-many, provider)
├── Requests (one-to-many, consumer)
├── Bids (one-to-many, seller)
├── Messages (one-to-many, sender/recipient)
└── Reviews (one-to-many, reviewer)

Requests
├── Bids (one-to-many)
└── Consumer (many-to-one)

Reviews
├── Reviewer (many-to-one)
└── Reviewee (many-to-one)

TrustReports
├── Reporter (many-to-one)
└── ReportedUser (many-to-one)
```

## Security Model

### Frontend
- JWT stored in `localStorage`
- Centralized API client adds token to all requests
- Input validation before submission
- CORS ensures browser security

### Backend
- JWT validation in API Gateway middleware
- Role-based access control (RBAC) via user roles
- Row Level Security (RLS) in database
- Rate limiting to prevent abuse
- Password hashing with bcrypt

### Database
- RLS policies enforce access rules automatically
- Example: `SELECT * FROM products WHERE seller_id = auth.uid()` or `is_active = TRUE`
- No raw SQL in services (use parameterized queries)

## Deployment Architecture

### Development (Local)
```
Docker Compose
├── Postgres (port 5432)
├── Redis (port 6379)
├── API Gateway (port 5000)
├── Auth Service (port 5001)
├── ... other services
└── Frontend dev server (port 3000)
```

### Staging/Production
```
Cloud Infrastructure
├── Frontend (Vercel)
├── API Gateway (Railway/Render)
├── Microservices (Railway/Render)
├── Database (Supabase/AWS RDS)
├── Cache (Upstash Redis)
└── Storage (Supabase Storage/AWS S3)
```

## Scalability Strategy

### Horizontal Scaling
- **Frontend**: Served globally via Vercel CDN
- **Services**: Docker containers auto-replicated on Railway/Render
- **Database**: Read replicas, connection pooling via PgBouncer
- **Cache**: Managed Redis (Upstash)

### Vertical Scaling
- Increase RAM, CPU on individual services
- Optimize database queries with indexes (already defined in schema)
- Enable caching for expensive operations

### Future: Event-Driven Scaling
- Replace synchronous calls with async pub-sub
- Scale individual services based on queue depth
- Example: High bid volume → scale Bid Service

## Monitoring & Observability

### Frontend
- Sentry for error tracking
- Vercel Analytics for performance
- Google Analytics (optional)

### Backend
- Service logs → ELK Stack or Cloudflare Logs
- Application metrics → Prometheus/Grafana
- Error tracking → Sentry

### Database
- Supabase built-in monitoring
- Query performance logs
- Backup & replication status

## API Design Principles

### Endpoint Structure
```
/api/v1/{resource}
/api/v1/{resource}/{id}
/api/v1/{resource}/{id}/{sub-resource}
```

### HTTP Methods
- `GET` — Retrieve resource
- `POST` — Create resource
- `PUT` — Update entire resource
- `PATCH` — Partial update
- `DELETE` — Delete resource

### Response Format
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

### Status Codes
- `200` — OK
- `201` — Created
- `400` — Bad Request
- `401` — Unauthorized
- `403` — Forbidden
- `404` — Not Found
- `500` — Server Error

## Future Enhancements

### Phase 2: Event-Driven
- Replace some sync calls with async events
- Add Kafka for event bus
- Enable real-time notifications

### Phase 3: GraphQL Gateway
- Supplement REST with GraphQL
- More flexible queries from frontend

### Phase 4: Advanced Caching
- Redis caching layer for frequently accessed data
- Cache invalidation strategies

### Phase 5: Advanced Search
- Elasticsearch for product/service search
- Geo-spatial queries optimization

### Phase 6: Analytics & Recommendations
- Event tracking pipeline
- ML-based recommendations
- Admin analytics dashboard

## Conclusion

Reacher's modular architecture enables:
✅ **Parallel Development** — Teams work independently  
✅ **Independent Scaling** — Scale services as needed  
✅ **Fault Isolation** — Issues don't cascade  
✅ **Technology Flexibility** — Can swap services over time  
✅ **Rapid Iteration** — Deploy features independently  
