# CMS Evolution Ambiguity Audit — Initial Run

- **Date:** 2026-08-02
- **Processed:** 75/75
- **Scope:** D-85 / DEC-061 delta only
- **Verdict:** gaps found and remediated; fresh rerun required

## Findings

| ID | Layer | Severity | Two-implementer failure | Remediation |
|---|---|---|---|---|
| A-01 | Vision | Blocking | Pages/posts/custom types did not name the minimum built-in type set, so two teams could ship incompatible baselines. | Added stable page, post, announcement, policy, help, and landing types with workflows and exclusions. |
| A-02 | Vision/Architecture | Blocking | Anything variable is a setting lacked a deterministic classifier for setting vs rule pack vs runtime config vs secret vs invariant. | Added the 11-class configuration matrix plus zero-unclassified-literals release gate. |
| A-03 | Vision/Architecture | Blocking | Missing/invalid setting behavior and inheritance deletion could diverge across implementations. | Added default/no-default, provenance, last-known-good/fail-closed, override deletion, and version-pinning semantics. |
| A-04 | Vision | Warning | Mission-critical CMS had no numeric success measures. | Added definition coverage, leak, convergence, rollback, and admin-attribution targets. |
| A-05 | Cross-layer | Warning | Vision said 100% availability while architecture locked 99.9% monthly excluding scheduled outages. | Clarified 100% as operating aspiration and 99.9% as measured SLO. |

## Devil's Advocate

The largest failure would be treating every domain entity as a custom post or every constant as an admin setting. The anti-EAV boundary and classification matrix now make both errors explicit, testable release blockers.


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-85|D-85]]
