# User Service

Handles user profiles, account information, and user management.

## Features
- User profile CRUD
- Profile picture management
- User account settings
- Role management

## Environment Variables

```env
NODE_ENV=development
PORT=5002
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

## API Endpoints

- `GET /users` — List all users (paginated)
- `GET /users/:id` — Get user profile
- `PUT /users/:id` — Update user profile
- `GET /health` — Health check

## Quick Start

```bash
npm install
npm run dev
```

## Next Steps

1. Implement user profile CRUD with Supabase
2. Add profile picture upload to storage
3. Implement user search and filtering
4. Add user role management
