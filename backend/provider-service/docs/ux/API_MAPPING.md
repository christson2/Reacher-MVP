# API Mapping (UI → Backend)

Overview: Map UI actions to implemented backend endpoints with sample payloads and responses.

1) Create provider profile (Setup step 1)
- POST `/api/provider/profile` (auth required)
- Body (example):
  {
    "provider_type": "trainer",
    "display_name": "Aisha Fitness",
    "phone": "+123456789",
    "location_country": "Kenya",
    "bio": "Experienced trainer",
    "address": { "raw_address": "23 Market St, Nairobi, Kenya" }
  }
- Response: created `provider_profiles` object; address parsed into `addresses` array.

2) Add service (Setup step 2)
- POST `/api/provider/services` (auth required)
- Body (example):
  {
    "category_id": null,
    "service_mode": "physical",
    "coverage_scope": "local",
    "pricing_model": "negotiable",
    "service_role_or_name": "Plumber",
    "raw_service_input": "Pipe repair and maintenance in homes",
    "description": "Fix leaking pipes"
  }
- Response: created service with `normalized_service_name`, `tags`, and `suggested_category_id` (non-authoritative).

3) Update service
- PUT `/api/provider/services/:id` with editable fields (service_name, description, is_primary, is_active).

4) Address management
- POST `/api/provider/addresses` { raw_address }
- PUT `/api/provider/addresses/:id` to patch fields or raw_address (server re-parses).
- Server returns `address_confidence` (0-100) for UI display.

5) Service settings (pricing)
- POST `/api/provider/services/:id/settings` { key: 'price', value: '100' }
- GET `/api/provider/services/:id/settings`

6) Discovery & Recommendations
- GET `/api/services/search?q=plumber&location_city=Nairobi` → returns enhanced services with `provider`, `distance_km`, `trust` and `final_score`.
- GET `/api/recommendations?q=yoga` → returns items with `reason_codes` and `confidence_score` for explainable UI.

7) Payments & Escrow (opt-in)
- POST `/api/payments` { payee_id, amount, payment_mode: 'escrow' }
  - Response returns `payment` and created `escrow` if payment_mode is escrow.
- POST `/api/escrows/:id/release` { job_completed: true }
  - Only allowed when release condition satisfied; UI must show clear confirmation screens.

8) Jobs marketplace
- POST `/api/jobs` { title, description, job_type, location_scope }
- POST `/api/jobs/:id/apply` { message }
- GET `/api/jobs/:id/applications` (owner only)

9) Digital products
- POST `/api/digital` { title, price, access_type }
- POST `/api/digital/:id/purchase` → creates a purchase record
- GET `/api/digital/:id/access` → returns access boolean

10) Subscriptions
- POST `/api/subscription/plans` (admin/dev-token) { name, benefits, price }
- POST `/api/provider/subscriptions` { plan_id } → attach provider to plan
- GET `/api/provider/subscriptions/me`

Error handling
- UI should handle 4xx with user-friendly messages and 5xx with retry hints.

Auth
- Use `x-user-id` header (gateway) or `Authorization: Bearer dev-token` in development.

