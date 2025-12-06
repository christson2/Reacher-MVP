# Deployment Guide

## Local Development

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- Git

### Quick Start

```bash
# Clone repository
git clone https://github.com/christson2/Reacher-MVP.git
cd Reacher-MVP

# Setup environment
cp .env.example .env

# Start all services
docker-compose up

# Or use Makefile
make dev
```

All services will be running:
- **Frontend:** http://localhost:3000
- **Gateway:** http://localhost:5000
- **Auth Service:** http://localhost:5001
- **User Service:** http://localhost:5002
- **Product Service:** http://localhost:5003
- **Provider Service:** http://localhost:5004
- **Trust Service:** http://localhost:5005
- **Postgres:** localhost:5432
- **Redis:** localhost:6379

### Database

Initial schema is auto-loaded from `database/schema.sql` and policies from `database/policies.sql`.

To reset database:
```bash
make docker-down
make docker-up
```

## Staging / Production Deployment

### Recommended Services

| Component | Recommended Service |
|-----------|-------------------|
| Frontend | Vercel |
| API Gateway | Railway / Render |
| Services | Railway / Render |
| Database | Supabase / AWS RDS |
| Cache (Redis) | Upstash / AWS ElastiCache |
| Storage | Supabase Storage / AWS S3 |

### Environment Setup

1. **Supabase Setup**
   ```bash
   # Initialize Supabase project
   supabase projects create --name reacher-prod
   supabase db push
   ```

2. **Frontend Deployment (Vercel)**
   ```bash
   # Connect GitHub repo to Vercel
   # Set environment variables:
   NEXT_PUBLIC_API_URL=https://api.reacher.app
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Backend Deployment (Railway/Render)**
   ```bash
   # Deploy Docker containers
   # Set environment variables:
   NODE_ENV=production
   JWT_SECRET=your-strong-secret
   DATABASE_URL=postgresql://...
   REDIS_URL=redis://...
   ```

4. **CI/CD Pipeline**
   - Configured in `.github/workflows/ci.yml`
   - Runs on PR creation and merge to `main`
   - Tests, builds, and deploys automatically

## Environment Variables

### Development (.env.local)
```env
NODE_ENV=development
JWT_SECRET=dev-secret-key
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### Production (.env)
```env
NODE_ENV=production
JWT_SECRET=your-strong-random-secret
NEXT_PUBLIC_API_URL=https://api.reacher.app
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://user:pass@host/db
REDIS_URL=redis://user:pass@host:port
```

## Monitoring & Logging

- **Frontend:** Vercel Analytics
- **Backend:** Sentry for error tracking
- **Database:** Supabase Logs
- **Infrastructure:** Service provider dashboards

## Troubleshooting

### Port Already in Use
```bash
# Kill existing process
lsof -i :5000  # Find PID
kill -9 <PID>
```

### Database Connection Failed
```bash
# Check Postgres is running
docker-compose logs postgres

# Reset database
make db:reset
```

### Services Not Communicating
```bash
# Check Docker network
docker network ls
docker network inspect reacher-network

# Check service health
docker-compose ps
```
