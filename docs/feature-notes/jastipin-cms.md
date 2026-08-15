# JASTIPin CMS Implementation Notes

Branch: `main`

## 2026-08-15 - Full internal CMS MVP

### Changed
- Initialized the Next.js and Supabase codebase for the complete internal package lifecycle.
- Enforced a same-origin API boundary; Supabase credentials and clients remain server-only.
- Added HttpOnly-cookie authentication, backend RBAC, rate-limited login, CRUD and workflow APIs, private evidence uploads, reports, and exports.
- Added schema migrations and transactional RPCs for closing, shipment, reconciliation, payments, and pickup.
- Added Indonesian operational UI for every MVP module, including scanner-focused package intake and arrival screens.
- Added server-generated grouped closing PDF/XLSX/CSV, package CSV export, private file proxying, and database-backed settings.

### Stayed The Same
- Application workflows and API contracts are unchanged by the later environment split.

### Bugs And Fixes
- Bug: Pickup locking originally combined `FOR UPDATE` with an aggregate query.
  Fix: Lock package rows first, then count eligible rows in a separate statement.
- Bug: Concurrent pnpm verification commands attempted to reconstruct `node_modules` simultaneously.
  Fix: Restored dependencies serially and ran verification through local binaries.

### Verification
- `tsc --noEmit` passed.
- ESLint passed with zero warnings.
- Vitest passed: 4 files, 8 tests.
- Next.js 16.2.11 production build passed.
- `git diff --check` passed.
- Supabase migration execution and Playwright were not run because the requested local Docker/browser approvals were declined.

## 2026-08-15 - Fix Owner bootstrap execution

### Bugs And Fixes
- Bug: `tsx` compiled `scripts/bootstrap-owner.ts` as CommonJS and rejected its top-level `await` expressions.
  Fix: Wrapped validation and Supabase operations in an async `main()` with explicit error handling while preserving Auth-user rollback when profile creation fails.

### Verification
- TypeScript and ESLint passed.
- A credential-free execution reached environment validation, proving the CommonJS transform error is resolved without creating a remote user.

## 2026-08-15 - Neutral CMS design system

### Changed
- Rebuilt the application shell around a white canvas, light-gray sidebar, thin borders, and charcoal actions matching the supplied admin reference.
- Added a documented grayscale token system, shared page header, neutral inputs/buttons/tables/statuses, responsive sidebar drawer, and reduced-motion behavior.
- Downloaded Inter weights 400–700 from Google Fonts, included the OFL license, and configured local font delivery through Next.js.
- Updated login, dashboard, package intake, resource headers, tables, feedback states, and global navigation to use the same design language.

### Stayed The Same
- Business workflows, API contracts, permissions, and database behavior are unchanged.

### Verification
- TypeScript strict checking and ESLint completed without errors or warnings.
- The Next.js production build completed successfully with the locally hosted Inter font files.
- A source color audit found no bright, non-neutral color literals in the application UI.
- Browser visual QA was not run because permission to start the local development server was declined.

## 2026-08-15 - Remove inactive topbar controls

### Changed
- Removed the notification button and profile chevron from the dashboard topbar because neither control had an associated action.

### Stayed The Same
- Package search, user identity, logout, and responsive sidebar controls remain functional and unchanged.

### Verification
- TypeScript, targeted ESLint, and `git diff --check` completed successfully.

## 2026-08-15 - Rose-pink design system

### Changed
- Added a rose-pink token scale and applied it to primary actions, the brand mark, active navigation, focus states, feedback, badges, row hover, user avatar, and login backdrop.
- Updated the design-system documentation to define pink as a restrained hierarchy accent over white and warm-gray foundations.

### Stayed The Same
- Layout, typography, component geometry, responsive behavior, and application workflows are unchanged.

### Verification
- The primary pink with white text measures `5.06:1`, passing WCAG AA contrast for normal text.
- TypeScript, ESLint with zero warnings, `git diff --check`, and the Next.js production build completed successfully.

## 2026-08-15 - Simplify dashboard topbar

### Changed
- Removed global package search and its routing state from the dashboard shell.
- Prevented the responsive hamburger and close controls from appearing simultaneously: hamburger is shown only while the drawer is closed, and close is shown only while it is open.
- Right-aligned user identity in the simplified desktop topbar.

### Stayed The Same
- Resource-level search remains available on list screens, and responsive sidebar navigation remains accessible.

### Verification
- TypeScript, targeted ESLint, stale global-search reference scan, and `git diff --check` completed successfully.

## 2026-08-15 - Hide desktop hamburger control

### Bugs And Fixes
- Bug: The shared `.button` display rule overrode `.mobile-menu-button`, causing the hamburger to remain visible on desktop.
  Fix: Increased the menu-control selector specificity for both its desktop-hidden and mobile-visible states.

### Verification
- TypeScript, ESLint with zero warnings, selector inspection, and `git diff --check` completed successfully.

## 2026-08-15 - Customer free-text intake

### Changed
- Replaced the Barang Masuk customer select with an accessible free-text combobox that requests debounced fuzzy suggestions and supports mouse and keyboard selection.
- Package intake now accepts either a selected customer ID or a typed customer name; the backend reuses normalized exact matches and creates genuinely new customers with an audit entry.
- Added normalized customer-name identity, concurrency-safe uniqueness, and trigram-based suggestion search in migration `202608150003_customer_name_identity.sql`.
- Empty customer text continues to create an unidentified package.

### Stayed The Same
- Tracking autofocus, duplicate override, pricing, scanner reset, and the rest of the package intake workflow remain unchanged.

### Bugs And Fixes
- Bug: The first combobox reset implementation updated local state synchronously inside React effects.
  Fix: Reset the component through a keyed remount after a successful package submission and update loading state from input events.

### Verification
- TypeScript, ESLint with zero warnings, all 10 unit/architecture tests, `git diff --check`, and the Next.js production build completed successfully.
- The new migration was not applied to local or remote Supabase; remote mutation remains an explicit deployment step.

## 2026-08-15 - Staging and production delivery pipeline

### Changed
- Split Supabase into an existing Tokyo staging project and a clean Singapore production project, then applied migrations `202608150001` through `202608150003` to both.
- Regenerated the database types from the migrated production schema and restored the local Supabase link to staging.
- Bootstrapped one production Owner while preserving the existing staging profiles and keeping business data isolated.
- Created one Vercel project with isolated Preview and Production variables, stable staging and production aliases, and successful deployments for both targets.
- Added GitHub Actions validation and environment-locked staging/production workflows that validate code, dry-run and apply migrations, build with pinned tooling, deploy, alias staging, and smoke-test public/auth endpoints.
- Added deployment documentation, GitHub Environment secret inventory, promotion flow, and manual GitHub initialization steps.

### Stayed The Same
- No staging business data was copied to production.
- GitHub remote setup, initial commit/push, branch creation, and GitHub Environment secrets remain manual as requested.

### Bugs And Fixes
- Bug: Vercel CLI `47.1.1` was rejected by the current deployment API.
  Fix: Pinned the supported `59.1.3` release in workflows and documentation.
- Bug: Initial Vercel variables contained trailing newlines, making generated `Set-Cookie` headers invalid.
  Fix: Replaced all Preview and Production values using newline-free input and redeployed both environments.
- Bug: The auto-created production `sb_secret_` value returned by the CLI was not a usable plaintext key.
  Fix: Used the validated legacy service-role key as the backend-only production secret without exposing it to client code or repository files.

### Verification
- Migration history matches locally and remotely through `202608150003`; local project linkage ends on staging.
- Staging and production `/login` return `200`, authenticated `/api/v1/auth/me` returns `200`, and anonymous access returns `401`.
- Invalid mutation Origin is rejected with `403` in production.
- Vercel Preview and Production builds completed successfully and their stable aliases point to the latest deployments.
- ESLint, strict TypeScript, all 10 unit/architecture tests, the production build, workflow YAML parsing, and repository secret scanning passed; Playwright E2E was skipped at the user's request.

## 2026-08-15 - Fix Vercel CLI installation in GitHub Actions

### Bugs And Fixes
- Bug: `pnpm add --global vercel@59.1.3` failed on GitHub-hosted runners because pnpm's global binary directory was not present in `PATH`.
  Fix: Removed global installation and invoked the pinned CLI through `pnpm dlx vercel@59.1.3` for pull, build, deploy, and alias operations in both deployment workflows.

### Verification
- Both workflow files parse as valid YAML and no unpinned or global Vercel CLI invocation remains.

## 2026-08-15 - Make Vercel project linking explicit in CI

### Bugs And Fixes
- Bug: Vercel CLI ran successfully in GitHub Actions but could not auto-resolve the project settings from environment IDs.
  Fix: Added a non-secret API access preflight and an explicit `vercel link` using the configured Team ID and Project ID before pulling environment settings.

### Verification
- Staging and production workflows validate Vercel access without printing tokens and provide actionable HTTP status errors for invalid token scope or resource IDs.
