# Accessibility tests

## Contents

Contract, source-boundary, and rendered accessibility verification for shared
web surfaces.

## Ownership

Accessibility tests own WCAG behavior evidence; components own accessible
markup and interaction implementation.

## Extension

Add a focused test for actual rendered semantics or a clearly bounded contract.
Prefer browser checks for focus, keyboard, zoom, and dynamic announcements.

## Conventions

Assert persistent labels, logical headings, named landmarks, status behavior,
and disclosure-safe content. Do not rely solely on constant helper objects.

## Related links

See [`../../.agents/skills/accessibility/SKILL.md`](../../.agents/skills/accessibility/SKILL.md)
and [`../e2e/`](../e2e/).
