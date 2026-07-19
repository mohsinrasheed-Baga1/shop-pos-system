# Task 6-a: User Management View

Agent: full-stack-developer
Task ID: 6-a
Component: `src/components/pos/views/users-view.tsx`

## What was built
A complete admin-only User Management view (`UsersView`) in Urdu with RTL layout and an emerald color scheme.

## Key features
- Header with title, description, "تازہ کریں" (refresh) and "نیا یوزر" (add user) buttons.
- Stats row showing total / admin / manager / cashier counts with loading skeletons.
- shadcn Table with columns: #, نام, ای میل, فون, رول (badge), حالت (badge), تخلیق کی تاریخ, اقدامات (edit/delete).
- Role badges: ADMIN = emerald, MANAGER = amber, CASHIER = zinc/slate.
- Active badge: emerald "فعال" / muted "غیر فعال".
- `overflow-x-auto` wrapper so the table scrolls horizontally on mobile (`min-w-[760px]`).
- Loading skeleton rows (5) while fetching; empty state with icon + Urdu hint.
- Create / Edit dialog (single `UserDialog` component) with fields:
  - name (required), email (required, regex validated), phone (optional),
  - role (Select: ایڈمن / مینجر / کیشیئر), password (required on create, optional on edit),
  - active (Switch with descriptive helper text).
- Inline validation errors with rose color + `aria-invalid`, plus toast on validation failure.
- Pre-fills form when editing; password placeholder explains "keep blank to retain old".
- On submit: POST `/api/users` (create) or PUT `/api/users/[id]` (update); reflects returned user in state immediately + toast.
- Delete: AlertDialog confirmation showing user name + email; DELETE `/api/users/[id]`; optimistic state removal + toast. Buttons disabled while deleting.
- All fetches use relative URLs only. Toast via `import { toast } from "sonner"`.
- Shared type `import type { User, Role } from "@/types"`.

## API contracts consumed (verified against worklog Task 1)
- GET `/api/users` -> `{ users: User[] }`
- POST `/api/users` (name, email, password, phone, role, active) -> `{ user }`
- PUT `/api/users/[id]` (same fields; password optional) -> `{ user }`
- DELETE `/api/users/[id]`

## Files touched
- `/home/z/my-project/src/components/pos/views/users-view.tsx` (overwrote stub with full implementation)

## Lint
`bun run lint` passes with no errors related to this file.

## Notes for downstream agents
- The component is fully self-contained and state-driven (no global store dependency).
- Optimistic list updates are done locally; a manual "تازہ کریں" button also re-fetches.
- The dialog component `UserDialog` is internal (not exported) — only `UsersView` is exported (default + named).
