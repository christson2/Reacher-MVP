# Reacher MVP — Modern Modular Marketplace Platform

A **location-based local marketplace** connecting consumers with nearby product sellers and service providers. Built with modern architecture: modular microservices backend, atomic design frontend, and event-driven communication.

## 🚀 Features

✅ **Unified Account System** — One login, three switchable roles (Consumer, Seller, Service Provider)  
✅ **GPS-Based Discovery** — Find nearby sellers and providers using location  
✅ **Competitive Bidding** — Consumers post requests; sellers/providers submit competitive bids  
✅ **Trust & Safety** — Green/Yellow/Red trust badges, community reporting, admin moderation  
✅ **Messaging & Notifications** — Real-time in-app messaging and push notifications  
✅ **Modular Architecture** — Independent services can be updated or replaced without disruption  
✅ **Type-Safe Frontend** — Next.js + TypeScript with atomic design components  
✅ **Production-Ready** — Docker, CI/CD, RLS policies, monitoring ready  

## 📁 Project Structure

```
reacher-mvp/
├── gateway/                          # API Gateway (JWT validation, request routing)
├── backend/
│   ├── auth-service/                # Authentication & JWT issuance
│   ├── user-service/                # User profiles & account management
│   ├── product-service/             # Product listings (sellers)
│   ├── service-provider-service/    # Service listings (providers)
│   ├── trust-service/               # Trust badges, reports, moderation
│   ├── message-service/             # In-app messaging & notifications
│   └── notification-service/        # Push, email, SMS alerts
├── frontend/                         # Next.js + TypeScript + Tailwind
│   ├── src/
│   │   ├── components/              # Atomic design (atoms, molecules, organisms)
│   │   ├── modules/                 # Feature modules (auth, home, dashboards)
│   │   ├── services/api/            # Centralized API client
│   │   ├── store/                   # Zustand global state
│   │   ├── hooks/                   # Custom React hooks
│   │   └── utils/                   # Helpers & validation
├── database/                         # PostgreSQL schema & RLS policies
├── supabase/                         # Supabase configuration
├── deploy/                           # Docker, Kubernetes, deployment guides
├── docs/                             # Architecture & API documentation
├── .github/workflows/               # CI/CD pipelines
├── docker-compose.yml               # Local development environment
├── Makefile                          # Development commands
└── package.json                      # Monorepo workspace config
```

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS |
| **API Gateway** | Express.js, JWT (Redis blacklist) |
| **Microservices** | Node.js + Express (modular, independently deployable) |
| **Database** | PostgreSQL with Row Level Security (RLS) |
| **State Management** | Zustand (frontend), Redis (backend) |
| **Data Fetching** | SWR with centralized axios client |
| **Authentication** | Supabase Auth or JWT-based |
| **Storage** | Supabase Storage or AWS S3 |
| **Containerization** | Docker & Docker Compose |
| **Deployment** | Vercel (frontend), Railway/Render (services), Supabase (DB) |
| **Monitoring** | Sentry, Service provider dashboards |

## ⚡ Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- Git

### Development Setup

```bash
# Clone repository
git clone https://github.com/christson2/Reacher-MVP.git
cd Reacher-MVP

# Copy environment variables
cp .env.example .env

# Start all services (Postgres, Redis, Gateway, all microservices)
docker-compose up

# Or use Makefile
make dev
```

**Services will be running:**
- Frontend: http://localhost:3000
- API Gateway: http://localhost:5000
- Auth Service: http://localhost:5001
- User Service: http://localhost:5002
- Product Service: http://localhost:5003
- Provider Service: http://localhost:5004
- Trust Service: http://localhost:5005
- Postgres: localhost:5432 (postgres/postgres)
- Redis: localhost:6379

### Manual Service Startup

```bash
# Install all dependencies
npm install

# Or install individual service
cd backend/auth-service && npm install

# Start gateway
cd gateway && npm run dev

# Start service (in separate terminal)
cd backend/auth-service && npm run dev

# Start frontend
cd frontend && npm run dev
```

## 📚 Documentation

- **[Architecture](./docs/ARCHITECTURE.md)** — System design, API contracts, scalability strategy
- **[Deployment Guide](./deploy/DEPLOYMENT.md)** — Production deployment on Vercel, Railway, Supabase
- **[Database Setup](./database/README.md)** — Schema, RLS policies, initialization
- **[Frontend Readme](./frontend/README.md)** — Component architecture, Zustand store, API client usage
- **[Gateway Readme](./gateway/README.md)** — JWT validation, rate limiting, service routing
- **[Service Templates](./backend/*/README.md)** — Per-service setup and usage

## 🔐 Security Features

- **Row Level Security (RLS)** — Database-level access control
- **JWT Authentication** — Stateless, scalable auth with Redis token blacklist
- **Input Validation** — express-validator on all endpoints
- **CORS Protection** — Configured per service
- **Password Hashing** — bcrypt with salt rounds
- **Environment Variables** — Secrets management via `.env`

## 🚀 Deployment

### Recommended Stack

| Component | Service |
|-----------|---------|
| Frontend | Vercel |
| Gateway & Services | Railway or Render |
| Database | Supabase or AWS RDS |
| Cache (Redis) | Upstash |
| Storage | Supabase Storage or AWS S3 |

### Deploy Frontend to Vercel

```bash
# Connect GitHub repo → Vercel dashboard
# Set environment variables in Vercel:
NEXT_PUBLIC_API_URL=https://api.reacher.app
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Auto-deploys on push to main
```

### Deploy Backend to Railway

```bash
# Connect GitHub repo → Railway dashboard
# Set environment variables:
NODE_ENV=production
JWT_SECRET=your-strong-secret
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Automatic deployment on push
```

See **[Deployment Guide](./deploy/DEPLOYMENT.md)** for detailed instructions.

## 📊 Database

PostgreSQL with Row Level Security (RLS) for automatic access control:

```sql
-- Example: Users can only see their own data
SELECT * FROM users WHERE id = auth.uid();

-- Example: Public products are visible to everyone
SELECT * FROM products WHERE is_active = TRUE;
```

Schema includes: Users, Profiles, Products, Services, Requests, Bids, Messages, Reviews, Trust Reports, Favorites.

See [database/schema.sql](./database/schema.sql) for complete schema.

## 🏗 Architecture Principles (Modular MVP)

1. **Service Autonomy** — Each service owns its API, logic, and optionally database
2. **API Gateway** — Single entry point with JWT validation and routing
3. **Event-Driven** — Services communicate via events (future: Kafka/RabbitMQ)
4. **Database per Service** — Services don't share tables (enforced via RLS)
5. **Independent Deployment** — Services can be updated without redeploying others
6. **Clean Code** — TypeScript, ESLint, Prettier enforced
7. **Type Safety** — Interface-first development

## 🧪 Testing

```bash
# Run tests for all services
npm test

# Run tests for specific service
cd backend/auth-service && npm test

# Frontend tests
cd frontend && npm test
```

## 📝 Contributing

1. Create feature branch: `git checkout -b feature/my-feature`
2. Commit changes: `git commit -am "Add my feature"`
3. Push: `git push origin feature/my-feature`
4. Open Pull Request (runs CI/CD checks)

See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) for guidelines.

## 📄 License

This project is licensed under the MIT License — see [LICENSE](./LICENSE) for details.

## 🤝 Support

For issues, questions, or feedback:
- Open an issue on GitHub
- Check existing documentation
- Contact the development team

---

**Status**: MVP in active development (Dec 2025)  
**Latest Version**: 1.0.0  
**Repository**: https://github.com/christson2/Reacher-MVP
