# Component Inventory (Service Provider MVP)

Atoms
- `Input` { props: label, value, onChange, placeholder, type }
- `Textarea` { props: label, value, onChange, rows }
- `Button` { props: label, variant, disabled, onClick }
- `Toggle` { props: checked, onChange, labels }
- `Badge` { props: text, tone }
- `Avatar` { props: src, alt }

Molecules
- `ServiceCard` { props: service, provider, onEdit, onPause, onView }
  - states: loading, error, active/paused
- `AddressField` { props: raw, onDetectGeo, confidence }
- `ProfileCompletionCard` { props: percent, missingItems, onComplete }

Organisms
- `ServicesList` { props: services, onAdd }
- `LocalMatchInbox` { props: requests, onRespond, onDecline }
- `SetupStepper` { props: steps[], currentStep, onSkip, onNext }

Pages consume organisms; components should be framework-agnostic and accessible.

Events & Contracts
- `onSaveService(payload)` → calls `POST /api/provider/services`
- `onUpdateService(id, payload)` → calls `PUT /api/provider/services/:id`
- `onAddAddress(raw)` → calls `POST /api/provider/addresses`
- `onAddSetting(serviceId, {key,value})` → calls `POST /api/provider/services/:id/settings`

Design tokens
- Spacing scale (4,8,12,16)
- Color tokens: primary, neutral, success, warning, critical
- Typography: base-size 16px, large 20px for headings

Acceptance visuals
- Each component includes empty, loading, error, and filled states in the component spec.
