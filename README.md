# Reacher API Gateway

Central entry point for all Reacher API requests. Validates JWT tokens, routes requests to microservices, and handles cross-cutting concerns like logging and rate limiting.

## Quick Start

### Prerequisites
- Node.js v16+
- Redis (for token blacklist)

### Setup

```bash
npm install
```

### Environment Variables

Create `.env` file:

```env
NODE_ENV=development
PORT=5000
JWT_SECRET=your-secret-key-here
REDIS_HOST=localhost
REDIS_PORT=6379

# Service URLs (will be implemented)
AUTH_SERVICE_URL=http://localhost:5001
USER_SERVICE_URL=http://localhost:5002
PRODUCT_SERVICE_URL=http://localhost:5003
SERVICE_PROVIDER_SERVICE_URL=http://localhost:5004
MESSAGE_SERVICE_URL=http://localhost:5005
TRUST_SERVICE_URL=http://localhost:5006
```

### Running

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Server listens on `http://localhost:5000` (or custom `PORT`).

## API Endpoints

### Public (No Auth Required)
- `POST /api/auth/signup` — Create new user
- `POST /api/auth/login` — Login and receive JWT

### Protected (JWT Required)
- `GET /api/users` — List users
- `GET /api/products` — Search products
- `GET /api/services` — Search services
- `GET /api/messages` — List messages
- `GET /api/trust` — View trust reports

## Architecture

```
[Frontend] → [Gateway] → [Auth Service]
                      → [User Service]
                      → [Product Service]
                      → [Message Service]
                      → [Trust Service]
                      ...
```

- **Gateway** validates JWT and forwards requests to appropriate microservices
- **Redis** maintains token blacklist for logout functionality
- Each service handles its own business logic and database

## Testing

```bash
npm test
```

## Deployment

See root `README.md` for deployment instructions.
