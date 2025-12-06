# Message Service

Handles in-app messaging between users with real-time support.

## Features
- Send and receive messages
- Conversation management
- Real-time messaging via WebSockets
- Message history and search

## Environment Variables

```env
NODE_ENV=development
PORT=5006
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

## API Endpoints

- `POST /messages` — Send a message
- `GET /messages/:conversationId` — Get conversation messages
- `GET /conversations` — List user conversations
- `GET /health` — Health check

## WebSocket Events

- `connect` — Establish WebSocket connection
- `message` — Receive real-time message
- `typing` — User typing indicator

## Quick Start

```bash
npm install
npm run dev
```

## Next Steps

1. Implement message CRUD with Supabase
2. Add WebSocket support for real-time messaging
3. Implement typing indicators
4. Add message search and filtering
