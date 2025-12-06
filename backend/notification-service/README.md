# Notification Service

Handles push notifications, emails, and SMS alerts.

## Features
- Push notifications
- Email notifications
- SMS alerts
- Notification preferences management

## Environment Variables

```env
NODE_ENV=development
PORT=5007
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
FIREBASE_PROJECT_ID=your-project
SMTP_HOST=your-smtp-host
TWILIO_ACCOUNT_SID=your-account-sid
```

## API Endpoints

- `POST /notifications` — Send notification
- `GET /notifications/:userId` — Get user notifications
- `GET /health` — Health check

## Quick Start

```bash
npm install
npm run dev
```

## Next Steps

1. Integrate Firebase Cloud Messaging for push notifications
2. Configure email service (SendGrid/AWS SES)
3. Integrate SMS service (Twilio)
4. Add notification templates and preferences
