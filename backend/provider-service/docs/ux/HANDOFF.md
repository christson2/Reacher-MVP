# Implementation Handoff Checklist

Artifacts to include
- Annotated wireframes for `/provider/setup` (mobile + tablet)
- Component spec sheet (`COMPONENTS.md`) with props, variants, accessibility guidelines
- API contract (`API_MAPPING.md`) with sample payloads
- Acceptance criteria (`ACCEPTANCE_CRITERIA.md`) for QA
- State & routing doc (`STATE_AND_ROUTING.md`) for frontend engineers

Tasks for devs
- Implement `SetupStepper` and `ServiceCard` components with props listed.
- Wire `onSaveService` to `POST /api/provider/services` and implement optimistic updates.
- Add route guard for `/provider/*` → redirect to setup if profile missing.
- Add localStorage backup for setup forms and background sync.

QA checklist
- Run automated Mocha tests (backend) and add Cypress E2E for setup flow.
- Validate address parsing confidence and geo-fallback flows.
- Validate payments/escrow flow with dev-token operator releases.

Handoff notes
- All monetization features are opt-in and must display clear consent screens.
- Recommendations are explainable; UI must display `reason_codes` and `confidence_score` returned by backend.

Delivery
- Zip annotated designs + this docs folder and attach to the feature ticket. Include story points and acceptance tests.
