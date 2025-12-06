# Reacher MVP - Implementation Plan

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Development Rules & Standards](#development-rules--standards)
3. [Modular Development Structure](#modular-development-structure)
4. [Task Breakdown](#task-breakdown)
5. [API Specifications](#api-specifications)
6. [Database Schema](#database-schema)
7. [Authentication & Security](#authentication--security)
8. [Frontend Architecture](#frontend-architecture)
9. [Testing Strategy](#testing-strategy)

---

## Architecture Overview

### System Design
**Reacher MVP** follows a **modular microservices architecture** deployed as a monorepo with:
- **API Gateway** (port 5000) - Single entry point for all requests
- **8 Independent Microservices** (ports 5001-5007) - Domain-specific business logic
- **Next.js Frontend** (port 3000) - Modern React SPA with atomic design
- **Postgres Database** (Supabase managed) - Centralized data persistence
- **Redis** (optional, Upstash managed) - Token blacklist & session caching

### Deployment Model
```
┌─────────────────────────────────────────┐
│         API Gateway (5000)               │
│  - JWT validation & middleware           │
│  - Request routing & composition         │
│  - Error handling & logging              │
└────────────────┬────────────────────────┘
                 │
    ┌────────────┼────────────┬────────────┬──────────────┐
    │            │            │            │              │
┌───▼──┐  ┌──────▼────┐  ┌───▼──┐  ┌────▼───┐  ┌──────▼──┐
│Auth  │  │User       │  │Product│  │Provider│  │Message  │
│5001  │  │5002       │  │5003   │  │5004    │  │5005     │
└──────┘  └───────────┘  └───────┘  └────────┘  └─────────┘

┌─────────────────────────────┐
│  Frontend (Next.js, 3000)   │
│  - Atomic design components │
│  - Zustand state mgmt       │
│  - SWR data fetching        │
└─────────────────────────────┘

┌─────────────────────────────┐
│  Data Layer                 │
│  - Supabase PostgreSQL      │
│  - Redis (token blacklist)  │
└─────────────────────────────┘
```

### Technology Stack
| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | Next.js 14, React 18, TypeScript | 14.0.0, 18.0.0 |
| **Gateway & Services** | Node.js, Express | 20.12.1 |
| **Database** | PostgreSQL (Supabase), SQLite (dev) | 15.0+ |
| **Auth** | JWT, bcrypt | - |
| **State** | Zustand, Redux? | 4.4.0 |
| **HTTP Client** | Axios, SWR | Latest |
| **Styling** | Tailwind CSS | 3.4.0 |
| **Build** | Webpack (Next.js), ESBuild | - |

---

## Development Rules & Standards

### 1. Code Organization
```
reacher-mvp/
├── backend/
│   ├── gateway/
│   │   ├── src/
│   │   │   ├── index.js (entry point)
│   │   │   ├── middleware/ (JWT, error handling)
│   │   │   ├── routes/ (request routing)
│   │   │   └── utils/ (helpers)
│   │   ├── package.json
│   │   └── README.md
│   ├── services/ (auth, user, product, etc.)
│   │   └── [service-name]/
│   │       ├── src/
│   │       │   ├── index.js
│   │       │   ├── controllers/ (request handlers)
│   │       │   ├── services/ (business logic)
│   │       │   ├── db.js (database queries)
│   │       │   └── utils/ (helpers)
│   │       ├── package.json
│   │       └── README.md
│   └── db/
│       ├── schema.sql (table definitions)
│       ├── policies.sql (RLS rules)
│       └── migrations/ (versioned changes)
├── frontend/
│   ├── src/
│   │   ├── app/ (Next.js app router pages)
│   │   ├── components/ (atomic design)
│   │   │   ├── atoms/ (Button, Input, Label)
│   │   │   ├── molecules/ (Card, Form, FormGroup)
│   │   │   ├── organisms/ (Navbar, Footer, Modal)
│   │   │   └── templates/ (Layout, PageLayout)
│   │   ├── modules/ (feature domains)
│   │   │   ├── auth/ (signup, login, forgot-password)
│   │   │   ├── dashboard/ (consumer, seller, provider)
│   │   │   ├── products/ (list, detail, create)
│   │   │   ├── profile/ (view, edit)
│   │   │   └── messages/ (conversations, threads)
│   │   ├── services/ (API clients, external services)
│   │   │   └── api/ (centralized API client)
│   │   ├── store/ (global state - Zustand)
│   │   ├── hooks/ (custom React hooks)
│   │   ├── utils/ (validation, formatting, helpers)
│   │   ├── types/ (TypeScript interfaces)
│   │   └── styles/ (global CSS, tailwind)
│   ├── next.config.js
│   ├── tsconfig.json
│   └── package.json
├── database/
│   ├── schema.sql
│   ├── policies.sql
│   └── README.md
├── docker-compose.yml
├── package.json (monorepo root)
└── IMPLEMENTATION_PLAN.md (this file)
```

### 2. Naming Conventions
- **Files**: kebab-case (e.g., `user-controller.js`, `profile-service.ts`)
- **Directories**: kebab-case (e.g., `backend`, `auth-service`)
- **Functions/Methods**: camelCase (e.g., `getUserById()`, `validateEmail()`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `JWT_SECRET`, `DB_HOST`)
- **Classes/Types**: PascalCase (e.g., `UserController`, `AuthResponse`)
- **Routes**: kebab-case (e.g., `/api/users/{id}`, `/auth/signup`)

### 3. Service Structure Pattern
Each microservice follows this pattern:

```javascript
// src/index.js
const express = require('express');
const { PORT, NODE_ENV, SERVICE_NAME } = process.env;

const app = express();

// Middleware
app.use(express.json());

// Routes
app.post('/[resource]', handler);
app.get('/[resource]/:id', handler);
app.put('/[resource]/:id', handler);
app.delete('/[resource]/:id', handler);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: SERVICE_NAME });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`[${SERVICE_NAME}] listening on port ${PORT}`);
});
```

### 4. Error Handling
- All endpoints return consistent response format:
  ```json
  {
    "success": true|false,
    "data": {...} or null,
    "error": "error message" or null,
    "statusCode": 200|400|401|404|500
  }
  ```
- HTTP status codes:
  - `200` - OK
  - `201` - Created
  - `400` - Bad Request (validation)
  - `401` - Unauthorized
  - `403` - Forbidden
  - `404` - Not Found
  - `409` - Conflict (duplicate email)
  - `500` - Internal Server Error

### 5. Validation
- Frontend: Use `utils/validation.ts` functions
- Backend: Use `express-validator` middleware
- Always validate email, password, required fields
- Sanitize user input

### 6. Async/Await Pattern
```javascript
// ✓ Good
async function getUserById(id) {
  try {
    const user = await db.getOne('SELECT * FROM users WHERE id = ?', [id]);
    return user;
  } catch (err) {
    throw new Error(`Failed to fetch user: ${err.message}`);
  }
}

// ✗ Avoid
function getUserById(id) {
  return db.getOne('SELECT * FROM users WHERE id = ?', [id]); // Unhandled promise
}
```

### 7. Environment Variables
Define all configuration in `.env` (development) or `.env.production`:
```
# Auth
JWT_SECRET=your-secret-key
JWT_EXPIRY=86400

# Database
DATABASE_URL=postgresql://user:pass@host/db
DATABASE_PATH=./db/reacher.sqlite (dev only)

# Redis
REDIS_URL=redis://host:port

# Services
GATEWAY_PORT=5000
AUTH_SERVICE_PORT=5001
USER_SERVICE_PORT=5002
...

# Environment
NODE_ENV=development
LOG_LEVEL=info
```

---

## Modular Development Structure

### Frontend Module Pattern
Each feature module (auth, dashboard, products) is self-contained:

```
frontend/src/modules/[feature-name]/
├── pages/
│   ├── index.tsx (list/home page)
│   ├── [id].tsx (detail page)
│   └── create.tsx (creation form)
├── components/
│   ├── [ComponentName].tsx (feature-specific)
│   └── hooks.ts (feature hooks)
├── services/
│   └── api.ts (feature API calls)
├── store/
│   └── [featureName]Store.ts (Zustand store)
├── types/
│   └── index.ts (TypeScript interfaces)
└── README.md (feature documentation)
```

### Backend Service Pattern
Each microservice is independently deployable:

```
backend/[service-name]/
├── src/
│   ├── index.js (entry point, routes)
│   ├── controllers/
│   │   └── [resource]Controller.js (request handlers)
│   ├── services/
│   │   └── [resource]Service.js (business logic)
│   ├── db.js (database utility)
│   └── utils/
│       └── [utility].js (helpers)
├── .env (service config)
├── package.json (service dependencies)
└── README.md (setup & API docs)
```

---

## Task Breakdown

### Task 2.1: Auth Service ✅ COMPLETED
**Objective**: Implement user registration, login, JWT generation

**Deliverables**:
- [x] POST `/auth/signup` - Register new user
  - Validate email, password (≥6 chars), name
  - Hash password with bcrypt (10 rounds)
  - Create user record with UUID
  - Auto-create user profile
  - Return user + JWT token
  - Status: 201 Created

- [x] POST `/auth/login` - Authenticate user
  - Find user by email
  - Verify password with bcrypt.compare()
  - Generate JWT with userId & email
  - Return user + token
  - Status: 200 OK (or 401 Unauthorized)

- [x] POST `/auth/verify` - Validate token
  - Extract token from Authorization header
  - Verify JWT signature
  - Return decoded token or 403 error

- [x] Database setup
  - SQLite (dev): `backend/db/reacher.sqlite`
  - Tables: users (id, email, phone, password_hash, name, roles, created_at)
  - Tables: profiles (id, user_id, bio, avatar_url, location, etc.)

**Status**: ✅ COMPLETED - Service running on port 5001

---

### Task 2.2: Frontend Auth Pages (THIS TASK - IN PROGRESS)
**Objective**: Create signup and login pages with full validation and API integration

**Deliverables**:
- [ ] **Signup Page** (`frontend/src/modules/auth/pages/signup.tsx`)
  - Form fields: name, email, password, confirm password
  - Validation: client-side + server-side
  - Submit: POST to `/api/auth/signup` via Gateway
  - Error handling & display
  - Success: Store JWT in localStorage, redirect to dashboard
  - Loading state during submission

- [ ] **Login Page** (`frontend/src/modules/auth/pages/login.tsx`)
  - Form fields: email, password
  - Validation: client-side + server-side
  - Submit: POST to `/api/auth/login` via Gateway
  - Error handling & display
  - Success: Store JWT in localStorage, redirect to dashboard
  - "Remember me" checkbox (optional)
  - "Forgot password?" link (placeholder)

- [ ] **Auth Store Integration** (`frontend/src/store/authStore.ts`)
  - Already created - use existing Zustand store
  - Methods: `login()`, `signup()`, `logout()`, `setUser()`
  - Persist JWT in localStorage

- [ ] **API Client Integration** (`frontend/src/services/api/client.ts`)
  - Already created - centralized axios client
  - JWT interceptor: Add token to all requests
  - Error interceptor: Handle 401 (logout)

- [ ] **Reusable Components** (already available)
  - Button.tsx (primary, secondary, danger variants)
  - Input.tsx (with label, error state)
  - Card.tsx (container)
  - Form.tsx (form wrapper with submit)

- [ ] **Utilities** (already available)
  - validation.ts: validateEmail(), validatePassword(), validateRequired()

**Implementation Steps**:
1. Create module structure: `frontend/src/modules/auth/`
2. Create signup page with form
3. Create login page with form
4. Wire both to API client
5. Add error handling & loading states
6. Test signup → login flow

**API Endpoints Called**:
- `POST /api/auth/signup` (routed to port 5001 via Gateway)
- `POST /api/auth/login` (routed to port 5001 via Gateway)

---

### Task 2.3: Gateway Service Routing
**Objective**: Wire API Gateway to route to all microservices

**Deliverables**:
- [ ] Route `/api/auth/*` → Auth Service (5001)
- [ ] Route `/api/users/*` → User Service (5002)
- [ ] Route `/api/products/*` → Product Service (5003)
- [ ] Route `/api/providers/*` → Provider Service (5004)
- [ ] Route `/api/messages/*` → Message Service (5005)
- [ ] Preserve JWT context (req.user)
- [ ] Add request/response logging
- [ ] Replace 501 placeholders with real proxying

---

### Task 2.4: End-to-End Auth Testing
**Objective**: Verify complete auth flow works

**Test Scenarios**:
- [ ] Signup new user → verify JWT returned
- [ ] Login with valid credentials → verify JWT returned
- [ ] Login with invalid password → verify 401 error
- [ ] Verify JWT token → verify user data extracted
- [ ] Use JWT on protected endpoint → verify accepted
- [ ] Use invalid JWT → verify 403 error
- [ ] Logout → verify token cleared

---

### Task 2.5: User Service CRUD
**Objective**: Implement user profile management

**Endpoints**:
- [ ] `GET /users/:id` - Fetch user profile
- [ ] `POST /users` - Create user (or auto-create via signup)
- [ ] `PUT /users/:id` - Update profile
- [ ] `DELETE /users/:id` - Soft delete user

---

### Task 2.6: Product Service CRUD
**Objective**: Implement product listings and management

**Endpoints**:
- [ ] `GET /products` - List products (with search, filter, pagination)
- [ ] `GET /products/:id` - Get product detail
- [ ] `POST /products` - Create product (seller only)
- [ ] `PUT /products/:id` - Update product (seller only)
- [ ] `DELETE /products/:id` - Delete product (seller only)

---

## API Specifications

### Auth Service API

#### POST `/auth/signup`
**Request**:
```json
{
  "name": "John Doe",
  "email": "john@reacher.app",
  "password": "securePassword123",
  "phone": "+1234567890" (optional)
}
```

**Response (201)**:
```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "id": "uuid-here",
    "email": "john@reacher.app",
    "name": "John Doe",
    "phone": "+1234567890"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error (409 Conflict)**:
```json
{
  "success": false,
  "error": "Email or phone already registered"
}
```

#### POST `/auth/login`
**Request**:
```json
{
  "email": "john@reacher.app",
  "password": "securePassword123"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "uuid-here",
    "email": "john@reacher.app",
    "name": "John Doe",
    "phone": "+1234567890"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error (401 Unauthorized)**:
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

#### POST `/auth/verify`
**Request**:
```
Headers: Authorization: Bearer <token>
```

**Response (200)**:
```json
{
  "success": true,
  "user": {
    "userId": "uuid-here",
    "email": "john@reacher.app"
  }
}
```

---

## Database Schema

### Core Tables
1. **users** - User accounts
   - id (UUID, PK)
   - email (string, unique)
   - phone (string, unique, nullable)
   - password_hash (string)
   - name (string)
   - roles (string, e.g., "user,seller,provider")
   - created_at (timestamp)
   - updated_at (timestamp)

2. **profiles** - User profile information
   - id (UUID, PK)
   - user_id (UUID, FK → users)
   - bio (text, nullable)
   - avatar_url (string, nullable)
   - location (string, nullable)
   - rating (float, nullable)
   - verified (boolean, default false)

3. **products** - Seller listings
   - id (UUID, PK)
   - seller_id (UUID, FK → users)
   - title (string)
   - description (text)
   - price (decimal)
   - category (string)
   - status (string: "active", "inactive", "sold")
   - images (json array)
   - created_at (timestamp)
   - updated_at (timestamp)

4. **services** - Provider services
5. **requests** - Buyer requests
6. **bids** - Auction bids
7. **messages** - Private messages
8. **reviews** - User/product reviews
9. **trust_reports** - Trust & safety reports
10. **favorites** - Saved items

---

## Authentication & Security

### JWT Strategy
- **Algorithm**: HS256 (HMAC SHA-256)
- **Secret**: 32+ character string from env (JWT_SECRET)
- **Payload**: `{ userId, email, iat, exp }`
- **Expiry**: 24 hours (86400 seconds)
- **Storage**: localStorage (frontend)
- **Transmission**: Authorization header (`Bearer <token>`)

### Password Security
- **Hashing**: bcrypt with 10 rounds
- **Validation**: Min 6 characters (enforce stronger in UI)
- **Never log**: Passwords should never appear in logs

### Request Authentication
1. Frontend sends request with `Authorization: Bearer <JWT>`
2. Gateway middleware verifies JWT
3. Middleware decodes token and attaches `req.user` with userId
4. Service receives authenticated request
5. Service can access `req.user.userId`

### Row Level Security (RLS)
- Postgres policies enforce access control
- Users can only see/modify their own data
- Public data (products) visible to all

---

## Frontend Architecture

### Atomic Design Pattern
```
Atoms (basic elements)
  ├── Button.tsx
  ├── Input.tsx
  ├── Label.tsx
  └── Icon.tsx

Molecules (combinations of atoms)
  ├── Card.tsx
  ├── Form.tsx
  ├── FormGroup.tsx
  └── Modal.tsx

Organisms (complex components)
  ├── Navbar.tsx
  ├── Footer.tsx
  ├── Sidebar.tsx
  └── ProductCard.tsx

Templates (page layouts)
  └── PageLayout.tsx

Pages (full pages)
  ├── /auth/login
  ├── /auth/signup
  ├── /dashboard
  └── /products
```

### State Management (Zustand)
```typescript
// Global store for auth state
import create from 'zustand';

interface AuthStore {
  user: User | null;
  token: string | null;
  login: (email, password) => Promise<void>;
  signup: (name, email, password) => Promise<void>;
  logout: () => void;
}

const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  login: async (email, password) => { /* ... */ },
  signup: async (name, email, password) => { /* ... */ },
  logout: () => { /* ... */ }
}));
```

### Data Fetching (SWR + Axios)
```typescript
import useSWR from 'swr';
import { apiClient } from '@/services/api/client';

function useUser(userId: string) {
  const { data, error, isLoading } = useSWR(
    userId ? `/api/users/${userId}` : null,
    (url) => apiClient.get(url).then(r => r.data)
  );
  return { user: data, error, isLoading };
}
```

---

## Testing Strategy

### Unit Tests (per service)
- Endpoint validation
- Error scenarios
- Database operations

### Integration Tests
- Auth → User Service flow
- Gateway routing
- JWT validation

### E2E Tests (frontend)
- Signup → Login → Dashboard
- Product creation → listing
- User interactions

### Test Tools
- Jest (unit/integration)
- Cypress or Playwright (E2E)
- Postman (API testing)

---

## Development Workflow

### 1. Start All Services
```bash
npm run dev        # Root: starts gateway + all services
# or individually:
cd gateway && npm run dev
cd backend/auth-service && npm run dev
```

### 2. Frontend Development
```bash
cd frontend
npm run dev        # Starts Next.js dev server (port 3000)
```

### 3. Database Changes
```bash
# Apply migrations or schema changes
# Update database/schema.sql
# Restart services to sync
```

### 4. Testing
```bash
npm test           # Run unit tests
npm run test:e2e   # Run E2E tests
```

### 5. Commit & Push
```bash
git add .
git commit -m "feat: [module] description"
git push origin main
```

---

## Key Files & Locations

| File | Purpose |
|------|---------|
| `backend/auth-service/src/index.js` | Auth endpoints (signup, login) |
| `backend/auth-service/src/db.js` | SQLite database utility |
| `frontend/src/modules/auth/` | Auth pages & components (TO CREATE) |
| `frontend/src/store/authStore.ts` | Global auth state (Zustand) |
| `frontend/src/services/api/client.ts` | Centralized API client |
| `gateway/src/index.js` | Request routing & JWT validation |
| `database/schema.sql` | Table definitions |

---

## Success Criteria

✅ **Phase 1**: Auth Service working
- [x] Signup creates user with hashed password
- [x] Login returns JWT token
- [x] Database persists data
- [x] Service running on port 5001

✅ **Phase 2**: Frontend Auth (THIS PHASE)
- [ ] Signup page renders with form validation
- [ ] Login page renders with form validation
- [ ] API calls work via Gateway
- [ ] JWT stored in localStorage
- [ ] Redirect to dashboard on success
- [ ] Error messages display
- [ ] Loading states work

✅ **Phase 3**: Integration
- [ ] Gateway routes to all services
- [ ] E2E test: signup → login → profile
- [ ] Services accessible via Gateway

✅ **Phase 4**: Remaining Services
- [ ] User Service CRUD operational
- [ ] Product Service CRUD operational
- [ ] All microservices functional

---

## Notes
- Always follow the atomic design pattern for frontend components
- Keep services independent and loosely coupled
- Use environment variables for all configuration
- Test locally before pushing
- Document API changes in this file
- Follow Git commit message format: `feat|fix|refactor|docs: [area] description`

