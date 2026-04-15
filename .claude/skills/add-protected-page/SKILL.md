---
description: "TODO: Step-by-step guide for adding a new authenticated route.
  Use when adding a new page under app/(protected)/. Triggers on: add a page,
  new route, new protected page, add a screen, create a page."
allowed-tools: [] # TODO: add tools this skill needs (e.g. Read, Bash, Edit, Glob, Write)
---

# Add a New Protected Page

## Steps

1. Create `app/(protected)/<route>/page.tsx` (server component by default).
2. If the page needs Supabase data, use `createClient()` from `lib/supabase/server.ts`.
3. Add a link to `components/NavLinks.tsx` if it belongs in the main nav.
4. No middleware changes needed — all `(protected)` routes are automatically guarded.

## Notes

Extracted from CLAUDE.md by agent-config-migrate on 2026-04-13.
Review the description field above — it was auto-generated and may need refinement.
