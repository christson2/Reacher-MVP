# Acceptance Criteria & Test Mapping

Onboarding
- Creating provider + adding one service marks `is_active=true` and redirects to `/provider/dashboard`.
  - Test: create provider via API + POST a service; assert profile is active.
- Skipping steps preserves partial profile; profile completion card shows missing items.
  - Test: create profile with minimal fields, assert missing list in `/provider/profile/me` response.

Services
- Creating a service returns `normalized_service_name`, `tags`, and `suggested_category_id`.
  - Test: POST service and assert returned fields exist.
- Editing a service updates fields and reflects in listing.
  - Test: PUT service and GET `/api/provider/services/me` to confirm.

Address
- POST `/api/provider/addresses` returns `address_confidence` and parsed fields when possible.
  - Test: POST raw address and assert `address_confidence` > 0.

Local Match Requests
- Request items include distance (estimate) and allow Respond/Decline actions.
  - Test: assert `GET /api/services/search` returns `distance_km` when appropriate.

Payments & Escrow
- Escrow creation returns escrow; release requires `job_completed` unless manual forced by operator.
  - Test: create escrow payment; attempt release without job_completed -> 400; release with job_completed true -> 200.

Digital Products
- Purchase creates a purchase record and `GET /api/digital/:id/access` returns true only for buyer.
  - Test: create product, purchase as user A, assert access true for A and false for B.

Subscriptions
- Creating plan and subscribing attaches provider to plan without altering trust_score.
  - Test: create plan (dev-token), create provider, subscribe, assert provider subscription exists and provider.verification_level unchanged.

Recommendations
- Recommendations include `reason_codes` and `confidence_score` and are non-blackbox.
  - Test: seed a trusted provider/service with tags; assert recommendations include 'trusted' or 'matches_tags'.

E2E Flow (happy path)
- Full setup -> add service -> add address -> finish -> dashboard shows service and completion 100%.

Regression tests
- Ensure existing search tests remain passing after any UI-driven endpoints are modified.

