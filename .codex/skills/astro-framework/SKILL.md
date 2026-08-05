---
name: astro-framework
description: Build WeJammin's hybrid Astro application with server-first routes, selective hydration, controlled CMS blocks, and Cloudflare deployment.
version: 1.0.0
---

# Astro Framework

Use the canonical bundled guidance at `.codex/skill-library/stack/frameworks/astro-framework/SKILL.md` for Astro components, routing, content collections, SSR adapters, middleware, actions, images, view transitions, and client directives.

## WeJammin Constraints

- Astro owns routes, layouts, data loading, prerendering, SSR, and HTML composition.
- Public routes default to prerendered or cacheable server HTML with no hydration unless an interaction requires it.
- Protected, personalized, preview, and freshness-critical routes render on demand through the Cloudflare adapter.
- React is the only authorized island runtime; do not add another UI framework or global client router.
- Use the least eager hydration directive compatible with each interaction and enforce per-route JavaScript budgets.
- CMS records may select only approved typed blocks/templates; never evaluate stored code, imports, CSS, expressions, or hydration directives.
- Server code performs authorization and passes minimal validated props. Client islands use versioned Worker APIs and never privileged database credentials.
- Preserve useful semantic HTML, accessibility, provenance distinctions, and safe degraded rendering before hydration.
- Offline support is selective and server-authoritative; service-worker caches never become canonical data stores.

Read the canonical bundled skill and its relevant references before implementing Astro features.
