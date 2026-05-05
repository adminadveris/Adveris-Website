# Tech Debt & Post-Stabilization Tracking

This document tracks items that require future verification, hardening, or technical refinement after the initial stabilization phase.

## 1. Pending Verifications

### [ ] Supabase Keep-Alive Automation
- **Issue**: GitHub Actions experienced "Hosted Runner acquisition failures" during initial setup (2026-05-05).
- **Status**: **Pending Final Test**.
- **Context**: Manual terminal pings confirmed the API and Keys are correct, but the automated workflow file (`.github/workflows/supabase_keep_alive.yml`) needs to be seen in a "Green" (Successful) state once GitHub infrastructure stabilizes.
- **Action**: Manually trigger the workflow in the GitHub Actions tab and verify a 200 OK response.

---

## 2. Technical Hardening

### [ ] UI State-Reset (NewRequest.tsx)
- **Issue**: Minor intermittent state-reset observed in the "Assigned Professional" dropdown when other fields are modified rapidly.
- **Status**: **Low Priority / Hardening Needed**.
- **Action**: Refactor the form state to use a more robust state management pattern (e.g., `useReducer` or a dedicated form library) to prevent accidental resets during re-renders.

### [ ] Notification Schema Refinement
- **Issue**: Current `timesheets` and `expenses` tables store `logged_by` as a string (Full Name) rather than a `user_id`.
- **Context**: Notifications for time/expense approvals currently rely on string matching to find the recipient.
- **Action**: Migrate tables to include a `user_id` foreign key for more robust notification targeting.

---

## 3. Future Roadmap

### [ ] Client Persona Portal
- **Phase**: UI Design / Integration.
- **Status**: **Proposed**.
- **Action**: Build the "Client" specific dashboard views to allow external stakeholders to track their own mandates.
