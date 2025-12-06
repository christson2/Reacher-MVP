# Auth Module

User authentication and authorization flows for Reacher MVP.

## Structure

```
auth/
├── pages/
│   ├── login.tsx       # Login page component
│   └── signup.tsx      # Signup page component
├── components/
│   └── useAuthForm.ts  # Custom hook for form handling
├── services/
│   └── auth-api.ts     # API calls to auth service
└── README.md           # This file
```

## Features

- **User Registration** - Email/password signup with validation
- **User Login** - Email/password authentication with JWT
- **Form Validation** - Client-side validation for all fields
- **Error Handling** - Display error messages to user
- **Loading States** - Visual feedback during async operations
- **Token Management** - Automatic JWT storage in localStorage
- **Auto-redirect** - Redirect to dashboard on successful auth

## API Integration

### Signup Flow
1. User fills signup form
2. Client-side validation runs
3. Submit to `POST /api/auth/signup` via Gateway
4. Backend creates user, hashes password, generates JWT
5. JWT stored in localStorage
6. Redirect to `/dashboard`

### Login Flow
1. User enters email & password
2. Client-side validation runs
3. Submit to `POST /api/auth/login` via Gateway
4. Backend verifies credentials, generates JWT
5. JWT stored in localStorage
6. Redirect to `/dashboard`

## Components Used

- **Button** - Primary/secondary variants
- **Input** - Text input with label and error display
- **Card** - Container wrapper for form
- **Form** - Form wrapper (optional)

## Hooks

### useAuthForm()
Custom hook for handling form state and submission.

```typescript
const { isLoading, error, formErrors, handleSubmit, clearError } = useAuthForm({
  redirectTo: '/dashboard',
  onSuccess: () => console.log('Done!'),
});
```

**Props:**
- `redirectTo` - Path to redirect after successful auth
- `onSuccess` - Callback function on successful submission

**Returns:**
- `isLoading` - boolean - Request in progress
- `error` - string | null - General error message
- `formErrors` - object - Field-level validation errors
- `handleSubmit` - function - Submit handler
- `clearError` - function - Clear error message

## Services

### auth-api.ts

**Functions:**

#### `signup(data: SignupRequest): Promise<AuthResponse>`
Register a new user.

```typescript
import { signup } from '@/modules/auth/services/auth-api';

const response = await signup({
  name: 'John Doe',
  email: 'john@reacher.app',
  password: 'password123',
  phone: '+1234567890' // optional
});
```

#### `login(data: LoginRequest): Promise<AuthResponse>`
Login with email and password.

```typescript
import { login } from '@/modules/auth/services/auth-api';

const response = await login({
  email: 'john@reacher.app',
  password: 'password123',
});
```

#### `verifyToken(): Promise<VerifyResponse>`
Verify JWT token validity.

```typescript
import { verifyToken } from '@/modules/auth/services/auth-api';

const decoded = await verifyToken();
```

#### `logout(): void`
Logout user (clears localStorage token).

```typescript
import { logout } from '@/modules/auth/services/auth-api';

logout();
```

## Validation Rules

### Email
- Required field
- Must be valid email format (email@domain.com)

### Password
- Required field
- Minimum 6 characters
- Cannot be empty

### Confirm Password (Signup only)
- Required field
- Must match password field

### Name (Signup only)
- Required field
- Cannot be empty

### Phone (Optional)
- If provided, must be valid format
- Minimum 10 digits

## Error Handling

Errors are displayed in two ways:

1. **General Errors** - Display at top of form
   - Network errors
   - Server errors (500)
   - Email already registered (409)

2. **Field Errors** - Display below each field
   - Validation errors
   - Required field errors
   - Format errors

## Environment Variables

```
NEXT_PUBLIC_API_URL=http://localhost:5000
JWT_EXPIRY=86400
```

## Security Considerations

- Passwords hashed with bcrypt (10 rounds) on backend
- JWT tokens expire after 24 hours
- Tokens stored in localStorage (vulnerable to XSS)
- Token automatically sent in Authorization header
- HTTPS required in production

## Testing

### Test Signup
```bash
# Invalid email
POST /api/auth/signup
{ "name": "John", "email": "invalid", "password": "test123" }
# Expected: 400 Bad Request - "Invalid email"

# Duplicate email
POST /api/auth/signup
{ "name": "John", "email": "existing@reacher.app", "password": "test123" }
# Expected: 409 Conflict - "Email already registered"

# Valid signup
POST /api/auth/signup
{ "name": "John Doe", "email": "new@reacher.app", "password": "test123" }
# Expected: 201 Created - { user: {...}, token: "..." }
```

### Test Login
```bash
# Invalid password
POST /api/auth/login
{ "email": "john@reacher.app", "password": "wrong" }
# Expected: 401 Unauthorized - "Invalid email or password"

# Valid login
POST /api/auth/login
{ "email": "john@reacher.app", "password": "test123" }
# Expected: 200 OK - { user: {...}, token: "..." }
```

## Next Steps

- [ ] Wire to API Gateway (ensure routing)
- [ ] Test signup/login flows
- [ ] Add "forgot password" functionality
- [ ] Add OAuth (Google, GitHub)
- [ ] Add two-factor authentication
- [ ] Add email verification

