# Trust & Safety Service

Handles community reporting, trust badges, and safety management.

## Features
- User/seller reporting system
- Trust badge management (Green/Yellow/Red)
- Report review and moderation
- Safety verification

## Environment Variables

```env
NODE_ENV=development
PORT=5005
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

## API Endpoints

- `POST /reports` — Submit a report
- `GET /reports/:id` — Get report details
- `GET /trust-badges/:userId` — Get user trust badge
- `GET /health` — Health check

## Quick Start

```bash
npm install
npm run dev
```

## Next Steps

1. Implement report submission with validation
2. Add admin review workflow
3. Implement trust badge calculation
4. Add moderation dashboard
