# Cursor Implementation Prompt — NBT Digital Ticketing (Enterprise)

Use this prompt to implement the required PRD flows as **two separate React applications**:

- **App A (this repo)**: `visitor-volunteer-web` — Visitor + Volunteer only (no admin).
- **App B (new repo)**: `admin-web` — Admin portal only.

This prompt is based on `NBT_Digital_Ticketing_PRD.pdf` and must align with `API_DOCUMENTATION.md`.

---

## Product requirements (from PRD)

### Roles
- **Visitor**: OTP login, profile setup (if new), browse events, book tickets, view QR tickets.
- **Volunteer**: credential login, scan QR, on-spot registration, scan history.
- **Admin**: manage events/volunteers, dashboards/analytics (must be in separate app).

### Core flow
Splash (web landing) → **Role Selection** → Visitor Login (OTP) / Volunteer Login (ID+Password).

### Visitor dashboard tabs
- **Events**: list available events with booking option.
- **My Tickets**: QR tickets for booked events.
- **Profile**: visitor profile + settings.

### Ticket generation
After booking:
- Unique Ticket ID
- QR Code
- Event details
- Visitor info

### Volunteer dashboard actions
- Scan QR Ticket (fast, clear feedback: Valid / Invalid / Already Entered)
- On-Spot Visitor Registration (OTP verification toggle for faster queues)
- Scan History

### Non-functional requirements (must be reflected in code)
- Fully responsive (mobile/tablet/desktop).
- High footfall: up to **100,000/day**.
- QR validation target: **< 300ms** (UI must be optimized for rapid scanning workflow).
- Security: OTP verification, secure volunteer login, server-side QR validation, duplicate entry prevention, activity logging.
- Design system:
  - Primary: **#B30447**
  - Typography: **Inter (body)**, **Poppins (headings)**
  - Minimal modern UI

---

## Architecture decision (mandatory)

### Split into two React apps
1) **Visitor+Volunteer Web (this repo)**
   - Remove all admin pages/routes/components.
   - Implement PRD’s visitor/volunteer screens and flows only.

2) **Admin Web (new repo)**
   - Separate React project (Vite + React + TS + Tailwind).
   - Uses admin JWT and admin-service endpoints only.

Do NOT share auth tokens between apps.

---

## API integration rules (must align to `API_DOCUMENTATION.md`)

### Base URLs
Support either:
- **Gateway**: a single `VITE_API_BASE_URL`, OR
- **Per-service** env vars:
  - `VITE_AUTH_BASE_URL` (default `http://localhost:3001`)
  - `VITE_VISITOR_BASE_URL` (default `http://localhost:3002`)
  - `VITE_VOLUNTEER_BASE_URL` (default `http://localhost:3004`)
  - `VITE_ADMIN_BASE_URL` (default `http://localhost:3005`)

### Required headers
- OTP request/verify: must send `event_id` header.
- Visitor self-registration: must send `Authorization: Bearer <visitor-jwt>` from OTP verify.
- Volunteer endpoints: must send `Authorization: Bearer <volunteer-jwt>`; some also require `event_id`.

### Do not invent endpoints
Only call endpoints present in `API_DOCUMENTATION.md`. If an API is missing (ex: “list events”), implement UI with a placeholder data source and a clearly isolated adapter so it can be wired once backend provides the endpoint.

### Token storage (enterprise-grade)
- Store tokens with clear separation:
  - `visitor_jwt`
  - `volunteer_jwt`
  - `admin_jwt` (admin app only)
- Implement a centralized auth module:
  - get/set/clear token
  - inject headers via a single HTTP client
  - handle 401 globally (redirect to login)

---

## App A: Visitor + Volunteer Web (THIS REPO) — required changes

### A0. Remove admin from this app
- Delete/stop using:
  - `src/pages/AdminLogin.tsx`
  - `src/pages/AdminDashboard.tsx`
  - `src/pages/admin/*`
- Remove `/admin/*` routes from `src/App.tsx`.
- Remove any admin-specific API methods from `src/services/api.ts` (move to admin app).

### A1. Global navigation: Role selection + dashboards
Implement these screens:
- **Landing/Splash** (`/`):
  - Branding, short explanation.
  - Primary CTA: “Continue as Visitor”
  - Secondary CTA: “Continue as Volunteer”
- **Role Selection** (may be same as landing):
  - Visitor / Volunteer cards.

### A2. Visitor flow (PRD compliant)

#### Visitor authentication
- Screen: **Visitor Login** (mobile number + OTP)
  - Uses `POST /auth/otp/request` and `POST /auth/otp/verify`.
  - Must send `event_id` header.
  - OTP verify returns a visitor state; store visitor JWT from response (as documented).

#### Visitor profile setup (only if new)
- If OTP verify indicates new visitor:
  - Collect:
    - Name
    - Age range (not DOB; PRD says age range)
    - Optional email
  - Call `POST /visitors/register` with visitor JWT.

#### Visitor dashboard (tabs)
- `/visitor` layout with tab navigation:
  - **Events tab**: list events and allow booking.
  - **My Tickets tab**: show tickets for booked events (QR + details).
  - **Profile tab**: view/edit profile and logout.

#### Events booking + tickets
- Booking must result in ticket generation per PRD.
- Use documented visitor-service endpoints:
  - `GET /visitors/:registrationId/tickets` to render QR tickets.
- QR value must be what backend expects to validate; do NOT hardcode `visitorId` as QR payload unless backend confirms that’s correct.

### A3. Volunteer flow (PRD compliant)

#### Volunteer login
- Screen: `/volunteer/login`
  - Credential auth with `POST /auth/volunteer/login`.
  - Store volunteer JWT.

#### Volunteer dashboard
- `/volunteer` home with large quick-action cards:
  - Scan QR Ticket
  - On-Spot Registration
  - Scan History

#### Scan QR Ticket (critical performance UX)
- Page: `/volunteer/scan`
  - Must call `POST /volunteer/scan`.
  - Must show immediate, high-visibility result:
    - **Valid** (green)
    - **Invalid** (red)
    - **Already Entered** (amber/yellow)
  - Must support rapid repeated scans:
    - auto-focus input
    - “Ready for next scan” state
    - optional sound/vibration hooks (web safe fallback)

#### On-Spot Visitor Registration
- Page: `/volunteer/register`
  - Fields per PRD:
    - Full Name
    - Age Range
    - Mobile Number
    - Email (optional)
  - Include **OTP verification toggle**:
    - If toggle ON: run OTP request/verify, then register via `POST /visitors/register` with visitor JWT
    - If toggle OFF: call `POST /volunteer/visitors/register` with `otpVerified: false` (per API doc)
  - Must send `event_id` header.

#### Scan History
- Page: `/volunteer/history`
  - If backend provides entry logs endpoint for volunteer, integrate it.
  - If not available, implement local in-memory + session persistence (clearly separated), storing last N scans with timestamp and result.

### A4. Design system + responsiveness
- Update Tailwind styling to match:
  - Primary color `#B30447`
  - Fonts:
    - Inter for body
    - Poppins for headings
- Enforce responsive layouts:
  - Mobile-first
  - Tablet optimized
  - Desktop max-width containers
- Replace any hardcoded legacy palette currently used (amber/orange) unless it’s part of branding requirements; PRD primary is #B30447.

---

## App B: Admin Web (NEW REACT PROJECT) — requirements

### B1. Admin auth
- `/login` uses `POST /auth/admin/login`.
- Store `admin_jwt` and apply `Authorization` header to all admin-service endpoints.

### B2. Admin features (minimum)
- Dashboard: `GET /admin/dashboard`
- Manage Volunteers: `POST /admin/volunteers` + list endpoint from backend
- Manage Events: `POST /admin/events`, `DELETE /admin/events/:eventId` + list endpoint if available
- Visitors list: `GET /admin/visitors`
- Entry logs: `GET /admin/entries`
- Tickets: `GET /admin/tickets`
- Analytics: `GET /admin/analytics`

### B3. Admin UI
- Responsive sidebar (collapsible on mobile).
- Tables must degrade to cards on small screens.
- Export and filters should be implemented only if supported by backend docs.

---

## Enterprise engineering standards (must follow)

### Code quality
- TypeScript strict patterns:
  - No `any`
  - Define API request/response types explicitly
- Centralized HTTP client:
  - request timeout
  - abort controller for rapid scan flows
  - consistent error normalization (`{ code, message, details }`)
  - retries only where safe (idempotent or server supports idempotency keys)

### Performance
- Avoid re-render loops and heavy DOM capture on ticket pages.
- Keep scan UI extremely lightweight.
- Use virtualization for very large lists (visitors/tickets/history) if needed.

### Security
- Never trust QR payload client-side; always validate via server (`/volunteer/scan`).
- Clear tokens on logout.
- Handle token expiry (401) globally.
- Avoid storing sensitive PII unnecessarily; store only what’s required for “My Tickets”.

### UX & accessibility
- Keyboard accessible forms
- Proper labels and validation
- Clear loading/error/empty states

### Project structure (suggested)
- `src/app/` (routing/layouts)
- `src/features/visitor/`
- `src/features/volunteer/`
- `src/shared/components/`
- `src/shared/lib/http/`
- `src/shared/lib/auth/`
- `src/shared/theme/`
- `src/shared/types/`

---

## Deliverables (what to implement)

1) Refactor this repo into **Visitor+Volunteer only** app, with PRD-complete visitor dashboard + volunteer tools.
2) Create a separate **Admin** React project with admin dashboard and management screens.
3) Ensure all API calls match `API_DOCUMENTATION.md` and required headers/tokens are correctly handled.
4) Update UI to PRD design system (primary #B30447, Inter/Poppins) and full responsiveness.

