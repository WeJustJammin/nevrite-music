# Architecture Ambiguity Audit — Architecture Design

- **Document:** `.memory/wiki/specs/2026-08-02-architecture-design.md`
- **Graph source:** [[specs/2026-08-02-architecture-design]]
- **Processed counter after report:** 1/2
- **Audit mode:** fresh independent implementer simulation
- **Pre-remediation score:** 12.5 ambiguity points / 22 checkpoints = **56.8%**

## Implementer Simulation

| Path | Forced decisions and observed divergence |
|---|---|
| Happy path | A capable team can build the modular edge application, but must independently choose CSS architecture, DI mechanism, pagination wire shape, Stripe payer UI mode, and several failure fallbacks. |
| Malicious path | An implementer can claim compliance while putting protected fields into generic `details`, using unsigned reusable cursors, embedding Stripe UI under the existing CSP, or treating a Queue event as sufficient recovery evidence. |
| Incompetent path | A literal implementer may select Tailwind or runtime CSS-in-JS, install a reflection DI container, omit route-specific fallback behavior, or ignore the normative persistence table because it is outside the audited final artifact. |
| Concurrent path | Two teams can produce incompatible CSS conventions, cursor encodings, provider boundaries, PII dictionaries, and component-degradation behavior while each cites the architecture. |

## Rubric Score

| Dimension | Result | Evidence |
|---|---|---|
| Tech Stack | ⚠️ | The runtime stack is locked, but exact CSS architecture is deferred at line 343. |
| System Architecture | ⚠️ | The component diagram is complete, but protocols and per-component fallback semantics are not enumerated. |
| Data Strategy | ❌ | PII is described by classes rather than canonical field identifiers, and the full feature/query map is outside the final artifact. |
| Security Model | ✅ | Trust, authentication, authorization, data protection, validation, abuse, and browser controls are explicit. |
| Compliance | ✅ | Privacy, payments, signatures, minors, sensitive data, and declarations have explicit gates and exclusions. |
| API Design | ⚠️ | Error and pagination semantics exist, but field types, parameter names, response shape, cursor binding, and limits are incomplete. |
| Integration Robustness | ⚠️ | Stripe Checkout versus custom PaymentIntent UI remains ambiguous and conflicts with the CSP frame allowance. |
| Phasing | ✅ | Six dependency-ordered gates, entry criteria, exit criteria, and deferred capabilities are explicit. |
| Persistence Architecture | ⚠️ | Store selection and consistency are strong, but the normative 25-domain mapping is only referenced from a working file. |
| Error Architecture | ✅ | Propagation, containment, client fallback, boundary ownership, and safe unknown-error handling are explicit. |
| Attack Surface | ✅ | Secrets, dependencies, OWASP controls, headers, and explicit exclusions are covered. |
| Observability | ⚠️ | Numeric alerts and severity exist, but canonical runbooks are named without an existing linked index. |
| Cost Architecture | ✅ | Launch, production, and ceiling states plus provider controls are explicit. |
| Testability | ⚠️ | Ports and injected adapters are required, but manual DI versus a container is not locked. |

## Devil's Advocate

- A reference to an internal working artifact is not sufficient for a final-layer audit because downstream implementers are entitled to treat the final architecture as complete.
- “Object-valued details” permits arbitrary disclosure unless size, depth, and per-code field allowlists are normative.
- “PaymentIntents” can mean hosted Checkout internals or a custom card form; those choices have materially different PCI and CSP consequences.
- A directory path that will be populated later is not a linked operational contract and cannot be tested during setup.

## Specification Gaps

1. **SPEC GAP ARCH-01 — Product Design / CSS:** exact CSS architecture is deferred, allowing incompatible styling systems. **Resolution:** lock CSS custom properties, cascade layers, Astro scoped styles, and CSS Modules for React islands; prohibit Tailwind and runtime CSS-in-JS at launch.
2. **SPEC GAP ARCH-02 — System Architecture / Communication:** protocols and component fallback behavior are implicit. **Resolution:** add normative communication and failure/fallback matrices.
3. **SPEC GAP ARCH-03 — Persistence Map / Coverage:** the approved feature-to-query table is outside final scope. **Resolution:** embed the complete approved table in the final architecture and draft.
4. **SPEC GAP ARCH-04 — Data Strategy / PII:** protected data is grouped by prose class rather than canonical semantic field names. **Resolution:** add a canonical PII field-registry seed and extension rule.
5. **SPEC GAP ARCH-05 — API Design / Wire Contract:** error field types and cursor request/response contracts are incomplete. **Resolution:** define exact types, bounds, allowlists, cursor authentication, binding, and expiry.
6. **SPEC GAP ARCH-06 — Integration / Stripe:** hosted Checkout and custom PaymentIntent UI are both plausible while CSP permits Stripe frames. **Resolution:** lock hosted Checkout redirect plus hosted Connect; prohibit custom card fields/Elements at launch and remove payment frames.
7. **SPEC GAP ARCH-07 — Observability / Runbooks:** runbook names are not linked to an existing canonical index. **Resolution:** create and link a pre-setup runbook contract.
8. **SPEC GAP ARCH-08 — Testability / DI:** adapter injection does not select a dependency-wiring mechanism. **Resolution:** lock manual constructor/function injection with explicit composition roots and no reflection/decorator container.

## Verdict

The document is not advancement-safe before remediation. All eight findings are deterministic architecture choices and may be repaired without product-owner input under the granted autonomy.


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/2026-08-02-architecture-design|WeJammin — Architecture Design]]
