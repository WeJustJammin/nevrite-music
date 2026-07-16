# Blockers

## Summary

- **Total blockers**: 3
- **Unique blocker titles**: 3
- **Active**: 3 | **Resolved**: 0

## Full Log

### BLOCKER-001: `gh` authenticated as personal account, not business account (2026-07-16)
- **Status**: active
- **Impact**: Blocks (a) the initial `git push` of the WeJammin repo, and (b) self-hosted runner registration, which requires minting a repo registration token from an authorized account.
- **Detail**: `gh` is authed as `NEVRITERob` (personal). The repo transferred to `WeJustJammin`. The personal account *can* currently reach the repo, so a push would technically succeed — but it makes the business repo's automation depend on a personal token. Git commit identity has been set repo-local to `WeJustJammin <305953066+WeJustJammin@users.noreply.github.com>`, so commits are already attributed correctly; only the transport is affected.
- **Resolution**: User must run `gh auth login` interactively (HTTPS, authenticate git operations). Agent cannot perform this — credential handling is prohibited. `gh` supports multiple accounts; this adds rather than replaces.

### BLOCKER-002: `wejamm.in` DNS not pointed at Cloudflare (2026-07-16)
- **Status**: active
- **Impact**: Blocks `/setup-workspace-hosting`. Not urgent — deploy is ~8 pipeline stages away — but DNS propagation takes hours, so early action has real value.
- **Resolution**: Point nameservers at Cloudflare. May require action at the registrar rather than in the Cloudflare dashboard. Nameserver changes are account settings — require explicit per-action user confirmation.

### BLOCKER-003: Self-hosted GitHub runners not installed (2026-07-16)
- **Status**: active
- **Impact**: Blocks the owner's stated CI/CD preference (GitHub → Cloudflare deploy without consuming Actions minutes).
- **Detail**: Owner wants 2–3 local runners as systemd services, autostarting on boot. Motivation is sound — `nevrite-music` is **private**, so Actions minutes are metered (they would be unlimited if public).
- **Depends on**: BLOCKER-001 (registration token requires an authorized account).
- **Security gate**: Self-hosted runners are safe here **only because the repo is private**. If visibility ever changes to public, runners must be reconfigured or removed first — a fork's pull request would otherwise execute untrusted code on the host.
- **Resolution**: Deferred to `/setup-workspace-cicd`. Recorded in `.memory/wiki/specs/ideation/meta/constraints.md`.
