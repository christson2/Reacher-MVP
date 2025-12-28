# Service Provider UX Spec (MVP)

Purpose
- Enable quick, progressive onboarding for Service Providers.
- Keep flows optional, mobile-first, and modular so features can be extended.

Principles
- One account, multiple roles: user may have consumer/provider/seller roles.
- Progressive: user can skip any step and save partial progress.
- Explainable: recommendations and monetization are transparent and optional.

Pages (priority)
- `/provider/setup` — multi-step setup: Basic Info → Services → Location → Availability & Pricing.
- `/provider/dashboard` — services list, requests inbox, profile completion card, insights.
- `/provider/services/new` & `/provider/services/:id/edit` — service editor.
- `/provider/addresses` — manage addresses and show address confidence.
- `/provider/subscriptions` — list plans + subscribe (opt-in).
- `/jobs/*` — posting & application management (owner views applications).
- `/digital/*` — create digital product, purchase, access control.

Setup stepper behavior
- Stepper shows completed steps.
- Each step saves incrementally via API.
- If user adds >=1 service, mark provider active and redirect to dashboard.
- Autosave + local cache: if network fails, retain form data and retry later.

Key interactions
- Adding a service: create `ServiceCard` client-side; POST to `/api/provider/services`. Server returns suggested category and normalized fields.
- Adding address: POST `/api/provider/addresses` with `raw_address`. Show `address_confidence` returned.
- Pricing: use `POST /api/provider/services/:id/settings` for price keys; UI shows short price snippet.

Accessibility & Mobile
- Ensure all forms are usable via single-hand mobile (large touch targets).
- Progressive enhancement: audio input supported but optional.

Security & Privacy
- Payments/subscriptions are optional and explicitly opt-in.
- No PII leakage; only required fields stored; phone verification optional.

Extensibility
- All components are modular and receive props/events to allow replacement or A/B experiment.


