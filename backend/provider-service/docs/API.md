# Provider Service API

This document describes provider-service endpoints (backend-first).

## Authentication
All endpoints require authentication. For local development the header `Authorization: Bearer dev-token` maps to a dev user.

## Categories
- `GET /api/service-categories?parent_id=` — list categories (active)

## Provider Profile
- `POST /api/provider/profile` — create provider profile. Required fields: `provider_type`, `display_name`, `location_country`. Optional: `trainer_profile`, `agency_profile`, `address: { raw_address }`.
- `GET /api/provider/profile/me` — fetch the authenticated user's provider profile; includes `addresses` array if present.

## Services (ServiceOffering)
- `POST /api/provider/services` — create a `ServiceOffering`. Required fields: `category_id`, `service_mode`, `coverage_scope`, `pricing_model`.
  - Supports extended fields: `raw_service_input`, `input_type`, `service_role_or_name`, `description`, `category_path`, `tags`.
  - The service will be stored with `normalized_service_name` and `tags` derived deterministically (best-effort). A pluggable categorizer may add `suggested_category_id` and `suggested_category_path` (non-authoritative).
- `PUT /api/provider/services/{id}` — update a service (owner only).
- `GET /api/provider/services/me` — list services for the provider.

## Discovery
- `GET /api/services/search?q=&category_id=&service_mode=&coverage_scope=&location_city=&location_state=&location_country=` — local-first search. Location precedence: explicit query params &gt; authenticated user's provider location &gt; headers fallback (`x-user-city`, `x-user-state`, `x-user-country`).

## Addresses

## Service settings (extensibility)
- `POST /api/provider/services/{id}/settings` — create a key/value setting for the provider's service. Required: `key`.
- `GET /api/provider/services/{id}/settings` — list key/value settings for the authenticated provider's service.
## Extensibility
## Categorizer
- A pluggable categorizer runs during service creation and may populate `suggested_category_id` and `suggested_category_path` on the service (non-authoritative). The categorizer is a heuristic placeholder and can be replaced with an AI/pluggable implementation later.
- The system supports `service_settings` (key/value) for future optional settings. Use `service_settings` in the JSON store; API endpoints for settings are planned.


