# P2 — Auth Provider Package (Provider Confirmed)

**Date:** 2026-08-02  
**Pipeline stage:** create-prd-stack  
**Decision scope:** human authentication and session identity only; resource authorization remains a separate server-side and PostgreSQL RLS concern.

## Locked Constraints

- One human holds one account with simultaneous role facets; neither a role facet nor a UI context grants permission.
- Every protected write carries an explicit acting party, while entity-scoped mandates determine whether that human may act for that party.
- Claiming a pre-existing party proves a relationship, not legal identity. KYC/KYB remains a payout gate.
- Roster role, mandate activity/domain/term, NDA, and resource visibility are all live access inputs; revocation must fail closed and invalidate active asset access.
- OAuth is required for bounded third-party claim proofs, but consumer login OAuth must not become the source of authority for a party or resource.
- Pre-revenue operating posture remains $0/month. Supabase Pro is selected but purchase and provisioning are deferred to `/setup-workspace`.

## Confirmed Scope

- **Provider:** Supabase Auth.
- **Enterprise SSO/SAML:** not required for consumer launch; deferred.
- **Enterprise-only features:** deferred until consumer launch readiness is explicitly confirmed.
- **Unconfirmed consumer detail:** social-login providers and the final consumer sign-in/recovery mix remain open.
- **Consumer recovery baseline:** passwordless email magic-link/OTP.
- **Launch social providers:** Google, Apple, Meta/Facebook, SoundCloud.
- **Lower priority:** TikTok after consumer launch.
- **Conditional:** BandLab only after an official OAuth/OIDC identity integration is available and approved.

## Options

| # | Option | Strengths for WeJammin | Risks for WeJammin | Fit |
|---|---|---|---|---|
| 1 | **Supabase Auth with server-issued authorization decisions** | Uses the selected PostgreSQL identity UUID and RLS model; supports magic links, OTP, social OAuth, and SAML when needed; keeps the human identity close to the canonical record and avoids a second provider. | Must not encode live mandates or roster permissions in stale JWT/user metadata; provider-token refresh for external OAuth proofs needs a trusted server integration. | **5/5** |
| 2 | Clerk as an external authentication provider | Polished consumer sign-in and enterprise-connection experience if it becomes a conversion or enterprise-sales priority. | Adds a second vendor, subject-ID synchronization boundary, and a separate billing/provisioning path while authorization still has to live in PostgreSQL/server policy. | **2/5** |
| 3 | Auth0 as an external authentication provider | Broad enterprise identity-provider ecosystem if enterprise federation dominates the roadmap. | The strongest value is enterprise SSO, which is not a locked launch need; it adds the same subject-mapping and provider-cost boundary without solving entity-scoped authorization. | **2/5** |
| 4 | Custom authentication in Workers | Maximum implementation control. | Requires WeJammin to own credential security, recovery, MFA, session revocation, identity linking, abuse controls, and audit hardening from day one; incompatible with the constraint-first $0 pre-revenue posture. | **1/5** |

## Recommendation

**Confirmed:** Supabase Auth is the sole baseline authentication provider.

- Use passwordless email magic-link/OTP as the recovery baseline.
- Enable Google, Apple, Meta/Facebook, and SoundCloud as additive consumer login identities.
- Add TikTok after launch unless consumer evidence raises its priority.
- Keep BandLab disabled behind a provider-capability gate.
- Defer enterprise SAML SSO until a paying customer requires it; Supabase Pro includes a bounded SSO allowance, while a second auth vendor would be unjustified before that signal.
- Use the Supabase user UUID as the immutable human identity key. Never authorize from user-editable metadata; compute acting-party and resource authority on the server and enforce the resulting policy through PostgreSQL RLS.

## Additive Identity Contract

- One `auth.users.id` is canonical; provider identities are many-to-one login credentials.
- Signing in with any linked provider resolves the same canonical user and therefore the same person, parties, rights, purchases, and settings.
- Users manage linked identities from account security settings. Link and unlink require an authenticated session and recent step-up verification.
- A provider identity is unique to one canonical user. If it already belongs to another user, the platform starts a proof-of-both-accounts merge workflow instead of silently reassigning it.
- Unlink is allowed only when another verified login identity remains. The last identity is non-removable.
- Link, unlink, failed collision, and completed merge events are security-notified and append-only audited.
- Social identity claims and profile fields never grant roles, acting contexts, mandates, or resource access.
- Provider API access is a separate consent grant with separate encrypted token storage and revocation; a login token is not an integration token.

## Provider Matrix

| Provider | Supabase route | Priority | Decision |
|---|---|---|---|
| Google | Built-in social provider | Launch | Confirmed |
| Apple | Built-in social provider | Launch | Confirmed; provider subject is canonical even when Apple private relay changes the visible email |
| Meta/Facebook | Built-in Facebook provider | Launch | Confirmed; `Meta` means Facebook Login, not a separate Instagram login |
| SoundCloud | Custom OAuth2 provider | Launch | Confirmed, gated on app registration, minimum-profile scopes, and callback validation |
| TikTok | Custom OAuth2 provider through Login Kit | Post-launch | Confirmed lower priority |
| BandLab | None currently documented | Conditional | Deferred until official OAuth/OIDC endpoints, stable subject identity, registration, and terms are available |

## Current Provider Evidence

- [Supabase Auth](https://supabase.com/docs/guides/auth) supports password, magic link, OTP, social login, custom OAuth/OIDC providers, SSO, JWT sessions, and RLS integration.
- [Supabase social login](https://supabase.com/docs/guides/auth/social-login) supports the relevant social providers, but does not refresh third-party provider tokens on the app's behalf; external claim-proof tokens therefore belong in a trusted server integration.
- [Supabase pricing](https://supabase.com/pricing) currently includes social OAuth and 100,000 MAUs on Pro, with SAML usage separately metered after its included allowance.
- [Supabase identity linking](https://supabase.com/docs/guides/auth/auth-identity-linking) requires UUID-based identity references; SAML identities do not link to existing accounts automatically.
- [Supabase custom OAuth/OIDC providers](https://supabase.com/docs/guides/auth/custom-oauth-providers) support standards-compliant OAuth2 providers, PKCE by default, and email-optional identities.
- [TikTok Login Kit](https://developers.tiktok.com/doc/login-kit-overview) provides OAuth 2.0 login for web and native clients.
- [SoundCloud API authentication](https://developers.soundcloud.com/docs/api) provides OAuth 2.1, PKCE, a `/me` identity endpoint, and a Connect with SoundCloud sign-in flow.
- No official BandLab developer identity/OAuth documentation was found as of 2026-08-02; BandLab therefore remains a capability-gated provider, not a launch dependency.

## Decision Status

Consumer authentication provider, social-provider priority, additive identity behavior, and enterprise deferral are confirmed. No auth-provider owner input remains.
