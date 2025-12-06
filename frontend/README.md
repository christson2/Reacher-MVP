# Reacher Frontend

Modern, modular Next.js + TypeScript frontend for Reacher MVP platform.

## Architecture

Follows **Atomic Design** pattern and **Clean Architecture** principles:

```
src/
├── components/
│   ├── atoms/           # Buttons, Inputs, Labels
│   ├── molecules/       # Forms, Cards
│   ├── organisms/       # Complex components
│   ├── templates/       # Layout templates
│   └── pages/           # Page components
├── modules/             # Feature modules (auth, home, etc.)
├── services/
│   └── api/             # Centralized API client
├── store/               # Zustand global state
├── hooks/               # Custom React hooks
├── utils/               # Utilities (validation, helpers)
└── styles/              # Global styles
```

## Stack

- **Framework:** Next.js 14 + React 18
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Data Fetching:** SWR (with custom axios client)
- **UI:** Atomic Design Components

## Setup

### Prerequisites
- Node.js v18+
- npm or yarn

### Install Dependencies

```bash
npm install
```

### Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Running

**Development:**
```bash
npm run dev
```

Frontend runs at `http://localhost:3000`

**Build:**
```bash
npm run build
npm start
```

**Type Check:**
```bash
npm run type-check
```

**Linting:**
```bash
npm run lint
```

## Key Features

- **Modular Components:** Reusable atoms, molecules, organisms
- **Type-Safe:** Full TypeScript support
- **Global State:** Zustand for auth and app state
- **API Integration:** Centralized API client with interceptors
- **Responsive Design:** Tailwind CSS responsive utilities
- **Performance:** Code splitting and lazy loading ready

## Next Steps

1. Implement Login/Signup modules
2. Create Dashboard layouts (Consumer, Seller, Provider)
3. Build Product/Service discovery pages
4. Add real-time features (messaging, notifications)
5. Integrate Supabase authentication
6. Add form validation and error handling
