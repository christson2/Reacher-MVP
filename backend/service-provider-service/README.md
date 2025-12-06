# Service Provider Service

Handles professional services listings and management.

## Features
- Service CRUD operations
- Service provider portfolio management
- Location-based search
- Rating and review integration

## Environment Variables

```env
NODE_ENV=development
PORT=5004
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

## API Endpoints

- `GET /services` — Search services
- `POST /services` — Create service
- `GET /services/:id` — Get service details
- `PUT /services/:id` — Update service
- `DELETE /services/:id` — Delete service
- `GET /health` — Health check

## Quick Start

```bash
npm install
npm run dev
```

## Next Steps

1. Implement service CRUD with Supabase
2. Add portfolio management
3. Add availability scheduling
4. Implement service reviews
