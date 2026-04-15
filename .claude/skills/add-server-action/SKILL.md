---
description: "TODO: Step-by-step guide for creating a Supabase-backed server action.
  Use when writing a new server action in an actions.ts file. Triggers on: add a
  server action, new action, create an action, add mutation, server-side form handler."
allowed-tools: [] # TODO: add tools this skill needs (e.g. Read, Bash, Edit, Glob, Write)
---

# Add a Server Action

## Steps

1. Create or open `app/(protected)/<route>/actions.ts`; add `"use server"` at the top.
2. Call `createClient()` from `lib/supabase/server.ts` and verify the user with `supabase.auth.getUser()`.
3. Fetch the user's profile to check role if the action is admin-only.
4. Validate inputs before any DB call; return an error string on failure.
5. Call `revalidatePath(...)` after successful mutations, then `redirect(...)`.

## Notes

Extracted from CLAUDE.md by agent-config-migrate on 2026-04-13.
Review the description field above — it was auto-generated and may need refinement.
