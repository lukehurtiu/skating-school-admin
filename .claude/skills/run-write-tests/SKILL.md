---
description: "TODO: Conventions and steps for running or adding Jest unit tests.
  Use when writing new tests or running the test suite. Triggers on: run tests,
  write a test, add a test, jest, unit test, npm test."
allowed-tools: [] # TODO: add tools this skill needs (e.g. Read, Bash, Edit, Glob, Write)
---

# Run and Write Tests

## Steps

- Tests live in `__tests__/` and only cover pure utility functions in `lib/utils.ts`.
- Run all tests: `npm test`.
- New tests should follow the existing ts-jest pattern; import with `@/` alias.
- There are no integration or E2E tests; do not add DB mocks — keep tests to pure functions.

## Notes

Extracted from CLAUDE.md by agent-config-migrate on 2026-04-13.
Review the description field above — it was auto-generated and may need refinement.
