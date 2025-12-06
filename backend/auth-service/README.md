# Auth Service

Handles user authentication, registration, login, and JWT token generation.

## Features
- User signup and login
- JWT token generation and validation
- Password hashing with bcrypt
- Supabase integration for persistence

## Environment Variables

```env
NODE_ENV=development
PORT=5001
JWT_SECRET=your-secret
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

## API Endpoints

- `POST /auth/signup` — Register new user
- `POST /auth/login` — Login and receive JWT
- `GET /health` — Health check

## Quick Start

```bash
npm install
npm run dev
```

## Next Steps

1. Integrate with Supabase Auth
2. Implement password reset flow
3. Add refresh token mechanism
4. Add unit and integration tests
