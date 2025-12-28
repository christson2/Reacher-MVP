# State Model & Routing

Client state slices (recommended)
- `auth`:
  - `userId`, `roles` (array), `token`, `phoneVerified`.
- `providerProfile`:
  - `id`, `is_active`, `provider_type`, `display_name`, `location_*`, `verification_level`, `addresses[]`, `trainer_profile`, `agency_profile`.
- `services`:
  - map<id, service>, lists, isLoading, lastUpdated
- `addresses`:
  - list with `address_confidence`, geo coords
- `subscriptions`:
  - plans[], mySubscription
- `jobs` and `applications`:
  - jobsById, appsByJobId
- `ui`:
  - toasts, modal states, setupStepperProgress

Caching & invalidation
- On create/update service: optimistic local update; revalidate `GET /api/provider/services/me` after success.
- Profile changes: update `providerProfile` slice and re-fetch dependent data.

Routing rules / guards
- `/provider/*` requires provider profile — if missing, redirect to `/provider/setup`.
- Role switcher toggles UI; when adding role create profile via API.

Offline & retries
- Save forms to `localStorage` on network failure; show `Saved locally, will sync` UI.
- Background sync job retries when online.

Data flows (example: add service)
1. User fills ServiceCard and taps Save.
2. UI does optimistic add to `services` slice with `tempId`.
3. Call `POST /api/provider/services`.
4. On success: replace tempId with real id, update normalized fields from response.
5. On failure: show error, mark item `error=true` and offer retry.

Permissions
- Actions are allowed only when `auth` userId matches resource owner (server enforces). UI should hide unavailable actions (e.g., edit buttons when not owner).

