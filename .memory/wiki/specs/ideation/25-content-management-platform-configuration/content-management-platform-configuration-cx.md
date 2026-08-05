# Content Management & Platform Configuration — Cross-Cuts

> **Level**: domain
> **Scope**: Connections between domain 25 children and the rest of WeJammin

## Cross-Cut Map

| # | Source | Target | Relationship | Confidence |
|---|---|---|---|---|
| CX-01 | 25.01 | 25.02 | Active schemas govern entries; schema and entry histories remain independently immutable. | High |
| CX-02 | 25.01 | 25.03 | Templates bind only to declared fields/relations and migrate on breaking schema change. | High |
| CX-03 | 25.02 | 25.09 | Approved versions publish as immutable delivery projections with outbox convergence. | High |
| CX-04 | 25.03 | 01.06.01 | CMS composition preserves the fixed profile spine and provenance vocabulary. | High |
| CX-05 | 25.04 | 25.09 | Route/menu versions publish atomically with content and cache manifests. | High |
| CX-06 | 25.05 | 02/04/05/13/16 | Editorial taxonomies reference canonical vocabularies rather than cloning them. | High |
| CX-07 | 25.06 | 09/11/24 | Media use consumes rights, licence, consent, dispute, and takedown state. | High |
| CX-08 | 25.07 | 01–24 | Product-operable variables use typed settings; domain invariants stay outside them. | High |
| CX-09 | 25.08 | 01/24 | Internal capabilities/security events use canonical identity, RLS, and audit. | High |
| CX-10 | 25.09 | Search/SEO/Notifications | Publication fans out idempotently; PostgreSQL remains canonical. | High |
| CX-11 | 25.10 | Privacy/Audit/Object retention | Lifecycle operations preserve provenance and smallest-valid-scope retention. | High |
| CX-12 | 25.07 | 25.09 | Effective settings are version-pinned into delivery projections. | High |

## Cross-Cut Contract

For every High-confidence pair:

1. **Shared state**: the canonical owning domain keeps authority; CMS stores references, editorial versions, and presentation/configuration state only.
2. **Trigger chain**: canonical mutation and outbox commit together; downstream retries idempotently without rewriting source history.
3. **Permissions**: source and target authorize independently; the narrower result wins.
4. **Notifications**: sensitive changes fan out using identifiers and separately authorized hydration, not protected payloads.
5. **Races**: immutable versions and optimistic checks reject stale activation; revocation/takedown overrides cached availability.

## Rejected Pairs

| # | Source | Target | Reason |
|---|---|---|---|
| R-01 | Custom content types | Rights, credits, money, mandates, disputes, entitlements | Generic storage would erase canonical invariants. |
| R-02 | CMS roles | Separate CMS users/roles | Supabase identity and domain 01 authority remain canonical. |
| R-03 | CMS comments | Social/fan/moderation interactions | Domains 03/20/24 already own identity, consent, moderation, and reputation. |
| R-04 | Templates | Themes/plugins | Executable extension and arbitrary presentation are explicitly excluded. |
