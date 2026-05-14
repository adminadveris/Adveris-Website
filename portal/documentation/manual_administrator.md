# Adveris Advisors Portal: End-to-End Administrator Manual (v1.2)

## 1. Governance Overview & System Access
As an **Administrator**, you hold the "L1 - Global Governance" clearance. Your role is to oversee the entire lifecycle of professional advisory services, from client intake to financial disbursal.

### 1.1 Secure Session & Auto-Signout
*   **The Inactivity Guardian**: The system monitors your activity. 
    *   **Threshold**: 30 minutes of inactivity will trigger a logout.
    *   **Warning**: At 28 minutes, a glass-blurred modal appears. You must click **"Stay Logged In"** to extend your session.
    *   **Validation**: This timer is shared across all Adveris tabs.
*   **Profile Management**: Access your profile via the top-right avatar. 
    *   **Update Validation**: You can update your Full Name, Phone, Gender, and DOB. Email is locked to your identity.

### 1.2 Real-Time Notifications
*   **The Bell Icon**: Displays an unread count.
*   **Functionality**: Click to see the last 20 events (New requests, expense submissions, etc.).
*   **Action**: Use **"Mark All As Read"** to clear the visual indicator.
*   **Validation**: Notifications are pushed in real-time via Supabase; no page refresh is required.

---

## 2. Tab-by-Tab Functional Breakdown

### 2.1 Tab: Operational Overview (The Pulse)
*   **Operating Score**: A dynamic metric (0-100). 
    *   **Validation**: Every "Pending Verification" request subtracts 12 points from the score.
*   **KPI Strip**: Instant totals for Pending Verifications, Active Mandates, Weekly Hours, and Pending Expenses.
*   **Search/Filter**: None required here; it is a live telemetry view.

### 2.2 Tab: All Requests (Mandate Governance)
*   **Search Engine**: Search by Mandate Title, Client Name, or reference ID.
*   **Functional Lifecycle**:
    1.  **Verification**: New requests arrive as `Pending`. You must audit the 3 scoping documents.
    2.  **Activation (Update)**: To move to `Active`, click Edit.
        *   **Validation**: You **must** select an "Assigned Professional" from the dropdown. 
        *   **Validation**: You must ensure the "Engagement Scope" is not empty.
    3.  **Completion**: Mark as `Completed` once work is delivered.
*   **Audit History**: Click the "History" pulse icon to see every timestamped change.

### 2.3 Tab: New Request (Administrative Override)
*   **Process**: Use this to manually register a client.
*   **Admin Privilege**: Admins can skip the PAN verification and select an existing account from the registry.
*   **Validation**: 
    *   File Upload: Max 3 files, Max 5MB per file.
    *   Field Requirements: Account Name, Service Domain, and assigned Professional are mandatory for Admin-created records.

### 2.4 Tab: Timesheets (Operational Audit)
*   **Global View**: View professional hours logged by the entire firm.
*   **Approval Process**: 
    *   Admins can view entries but cannot edit professional notes (to preserve audit integrity).
    *   Hours are locked once the billing month is closed (Strategic Road-map).
*   **Search**: Filter by Professional Name or Client Account.

### 2.5 Tab: Expenses (Financial Disbursement)
*   **The Approval Workflow**:
    1.  **Detail Review**: Click the expense record to see all 3 receipts.
    2.  **Commitment**: Click **"Approve Disbursement"**.
        *   **Validation**: This action locks the record. The status changes to `Approved`. 
        *   **Validation**: The staff member who submitted it can no longer edit the amount or date.
    3.  **Payment**: Mark as `Paid` once the bank transfer is confirmed.

### 2.6 Tab: Accounts & Clients (CRM Hub)
*   **Account Management**:
    *   **Create/Update**: Manage PAN, GSTIN, CIN, and Registered Address.
    *   **Validation**: PAN must be 10 characters; GSTIN must be 15 characters.
*   **Deduplication Logic**: The system will prevent duplicate accounts by checking PAN or Name during the creation process.

### 2.7 Tab: User Governance (The Identity Hub)
*   **Provisioning Process**:
    *   Click "Create New User".
    *   **Validation**: Email must be unique. Staff roles require **Expertise Tags** to be assigned.
*   **Expertise Authorizations**: 
    *   Admins can select from 11 specialized services (e.g., Bankruptcy, FDI).
    *   **Global Access**: Selecting "ALL (Global Access)" auto-selects all other tags.
*   **Status Management**: Use **"Revoke System Access"** to immediately suspend a user. This prevents them from logging in but preserves their historical logs.

### 2.8 Tab: Service Hub (System Auditor)
*   **Function**: A raw view of the `AuditLog` table.
*   **Detail**: Shows User ID, Action Type, Entity Affected, and Timestamp.
*   **Search**: None (Immutable Stream).

---
**Adveris Advisors LLP — Internal Governance Framework v1.2**
**STRICT ADHERENCE TO THESE VALIDATIONS IS MANDATORY FOR SYSTEM INTEGRITY.**
