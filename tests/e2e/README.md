# Browser flows

## Contents

Playwright checks for the server-first web shell and bounded infrastructure
job presentation.

## Ownership

These tests own browser-observable navigation, responsive behavior, focus, and
safe asynchronous presentation. They do not provision providers or use paid
service credentials.

## Extension

Add a focused spec for a route or browser-visible state. Use injected local
fixtures when a protected server callback is not available in the local shell.

## Conventions

Prefer role/name assertions, explicit request outcomes, and axe checks. Never
treat a client hint or fixture as canonical server authority.

## Related links

See [`../README.md`](../README.md) for the cross-surface test boundary and
[`../../.agents/skills/playwright/SKILL.md`](../../.agents/skills/playwright/SKILL.md)
for browser-flow guidance.
