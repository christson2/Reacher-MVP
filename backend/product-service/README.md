# Product Service

Handles product listings, search, and management for sellers.

## Features
- Product CRUD operations
- Search and filtering by category, price, location
- Product image management
- Seller product management

## Environment Variables

```env
NODE_ENV=development
PORT=5003
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

## API Endpoints

- `GET /products` — Search products
- `POST /products` — Create product
- `GET /products/:id` — Get product details
- `PUT /products/:id` — Update product
- `DELETE /products/:id` — Delete product
- `GET /health` — Health check

## Quick Start

```bash
npm install
npm run dev
```

## Next Steps

1. Implement product CRUD with Supabase
2. Add location-based search
3. Implement product image handling
4. Add inventory management
