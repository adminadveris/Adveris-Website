# Comprehensive Technical Debt Registry: Adveris Advisors Portal

This registry documents the full scope of technical debt within the Adveris Advisors Portal project. These items range from infrastructure gaps to code-level architectural issues.

---

## 🏗️ 1. Infrastructure & Data Persistence
| Debt Item | Description | Risk |
| :--- | :--- | :--- |
| **LocalStorage Persistence** | The system currently uses `localStorage` (via `mockApi.ts`) as its primary database. | Data is stored only on the user's current browser and will be lost if cache is cleared. No cross-device sync. |
| **Missing Real Backend** | Supabase integration is documented but not active. | The portal is not yet multi-tenant or production-ready for real client data. |
| **Mock Authentication** | Login logic is a client-side simulation without secure token validation. | Insecure; cannot prevent unauthorized API access in a real production environment. |

---

## 🛡️ 2. Type Safety (TypeScript)
| Debt Item | Description | Risk |
| :--- | :--- | :--- |
| **"any" Type Usage** | Over 100+ instances of the `any` type in `Dashboard.tsx`, `NewRequest.tsx`, `CRMHub.tsx`, etc. | Hides potential runtime errors and null-pointer exceptions; makes refactoring extremely dangerous. |
| **Missing Interfaces** | Lack of central interfaces for `Account`, `Record`, and `Client` objects. | Inconsistent data handling across different pages. |

---

## 🔐 3. Security
| Debt Item | Description | Risk |
| :--- | :--- | :--- |
| **Hardcoded Credentials** | `Login.tsx` contains hardcoded mock usernames and passwords. | Critical security vulnerability if deployed as-is. |
| **Client-side Auth Guards** | Routes are protected by simple local state checks. | Easily bypassable by modifying local storage. |

---

## 📂 4. Workspace & File Organization
| Debt Item | Description | Risk |
| :--- | :--- | :--- |
| **Legacy Backups** | `portal/backup_pre_overhaul` and the root `.zip` file remain in the project. | Clutters the workspace and confuses developers on which files are active. |
| **Monolithic CSS Link** | Portal depends on the main website's `css/style.css`. | Changes to the public website's design can unintentionally break the internal portal's layout. |
| **Vite Template Defaults** | Some generic Vite files (e.g., `favicon.svg` in `/public`) haven't been branded. | Professionalism; branding inconsistency. |

---

## 🧩 5. Architectural Redundancy
| Debt Item | Description | Risk |
| :--- | :--- | :--- |
| **Prop Drilling / State Bloat** | Components like `Dashboard.tsx` are overly large and handle multiple sub-views internally. | Hard to maintain and test; poor performance as the system grows. |
| **Duplicate Data Fetching** | Every page independently fetches the same "accounts" and "records" from storage. | High memory usage and potential for state desync between pages. |

---

## 📈 Next Steps for Resolution
1.  **Phase 1**: Replace all `any` types with proper TypeScript Interfaces.
2.  **Phase 2**: Implement a central state (e.g., React Context or simple custom hook) for data fetching.
3.  **Phase 3**: Move `mockApi.ts` to a real Supabase/PostgreSQL connection.
4.  **Phase 4**: Remove hardcoded credentials and implement JWT-based authentication.
