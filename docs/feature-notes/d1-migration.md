# Cloudflare D1 Migration Implementation Notes

Branch: `staging`

## 2026-09-15 - Replace Supabase

### Changed
- Replaced the server database and authentication boundary with Cloudflare D1 and local password sessions.
- Kept the existing same-origin API surface and Cloudinary attachment storage.

### Verification
- `./node_modules/.bin/tsc --noEmit`

## 2026-09-15 - Separate D1 environments

### Changed
- Added separate Wrangler D1 bindings and migration commands for staging and production.
- Updated deployment workflows to apply the matching D1 migration using the environment-scoped Cloudflare token.
- Deployment now synchronizes the four server runtime values from GitHub Environment secrets to the matching Vercel target before its build.
- Made Vercel environment synchronization fully non-interactive, including the Preview branch scope prompt.

### Bugs And Fixes
- The existing Supabase query surface is broad; a transitional D1 query adapter was introduced so API route contracts can remain stable while SQL paths are migrated.
