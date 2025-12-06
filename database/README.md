# Database Setup & Initialization

This directory contains SQL scripts for setting up the Reacher database.

## Files

- **schema.sql** — Core database tables (users, products, services, requests, bids, messages, reviews, reports, favorites)
- **policies.sql** — Row Level Security (RLS) policies for data access control
- **config.toml** — Supabase configuration

## Setup Instructions

### Option 1: Supabase Dashboard

1. Create a new Supabase project
2. Go to SQL Editor → New Query
3. Copy contents of `schema.sql` and run
4. Copy contents of `policies.sql` and run

### Option 2: Supabase CLI

```bash
supabase db push
```

### Option 3: Local Docker Postgres

If using Docker Compose locally:

```bash
docker exec reacher-postgres psql -U postgres -d reacher_dev < schema.sql
docker exec reacher-postgres psql -U postgres -d reacher_dev < policies.sql
```

## Key Features

- **Users & Profiles** — User accounts with roles and trust badges
- **Products & Services** — Listings for sellers and service providers
- **Requests & Bids** — Consumer requests with competitive bidding
- **Messaging** — In-app communication between users
- **Reviews & Ratings** — Trust and quality feedback
- **Reports & Safety** — Community reporting and trust management
- **Row Level Security** — Automatic data access control at DB level

## RLS Policies

All tables are protected with RLS policies:

- Users can only read/update their own data
- Public data (active products, services) is readable by everyone
- Sellers can only manage their own listings
- Messages are visible only to sender/recipient
- Reports are visible only to reporter and admins

## Indexes

Performance indexes created on:
- Foreign keys (seller_id, provider_id, etc.)
- Location columns (for geo-queries)
- Frequently filtered columns (status, is_active)
