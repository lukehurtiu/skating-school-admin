---
description: "TODO: Steps to update schema.sql, apply changes, and sync types.
  Use when modifying the Supabase database schema. Triggers on: modify schema,
  add a table, add a column, change the database, update schema.sql, new migration."
allowed-tools: [] # TODO: add tools this skill needs (e.g. Read, Bash, Edit, Glob, Write)
---

# Modify the Database Schema

## Steps

1. Edit `supabase/schema.sql` to reflect the change.
2. Apply the change via the Supabase dashboard SQL editor or the Supabase CLI.
3. Update `lib/types.ts` to match any new/changed columns.
4. If adding a new table, add RLS policies in `schema.sql` following the existing patterns.

## Notes

Extracted from CLAUDE.md by agent-config-migrate on 2026-04-13.
Review the description field above — it was auto-generated and may need refinement.
