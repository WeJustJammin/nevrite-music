# Blockers

## Summary

- **Total blockers**: 4
- **Unique blocker titles**: 4

## BLOCKER-001: `gh` authenticated as personal account, not business account (2026-07-16)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-16T12:00:00.000Z
- **Agents**: claude
- **Sources**: ideate
- **Index**: [[index]]

- **Status**: **resolved** (2026-07-16)
- **Impact**: Blocked (a) the initial `git push` of the WeJammin repo, and (b) self-hosted runner registration, which requires minting a repo registration token from an authorized account.
- **Detail**: `gh` was authed as `NEVRITERob` (personal). The repo transferred to `WeJustJammin`. Git commit identity was set repo-local to `WeJustJammin <305953066+WeJustJammin@users.noreply.github.com>`, so commits attributed correctly; only the transport was affected.
- **Resolution**: User ran `gh auth login` interactively. `WeJustJammin` is now the active account with `admin: true` on the repo; `NEVRITERob` retained as a non-active second account. Initial push completed — repo is no longer empty.

## BLOCKER-002: `wejamm.in` DNS not pointed at Cloudflare (2026-07-16)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-16T12:00:00.000Z
- **Agents**: claude
- **Sources**: ideate
- **Index**: [[index]]

- **Status**: active
- **Impact**: Blocks `/setup-workspace-hosting`. Not urgent — deploy is ~8 pipeline stages away — but DNS propagation takes hours, so early action has real value.
- **Resolution**: Point nameservers at Cloudflare. May require action at the registrar rather than in the Cloudflare dashboard. Nameserver changes are account settings — require explicit per-action user confirmation.

## BLOCKER-003: Self-hosted GitHub runners not installed (2026-07-16)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-16T12:00:00.000Z
- **Agents**: claude
- **Sources**: ideate
- **Index**: [[index]]

- **Status**: **resolved** (2026-07-16)
- **Impact**: Blocked the owner's stated CI/CD preference (GitHub → Cloudflare deploy without consuming Actions minutes).
- **Detail**: Owner wanted 2–3 local runners as systemd services, autostarting on boot. Motivation sound — `nevrite-music` is **private**, so Actions minutes are metered (unlimited only on public repos).
- **Resolution**: **3 runners installed and verified online.** See `.memory/wiki/specs/ideation/meta/constraints.md` § Self-Hosted Runner Fleet for the full build. Key deviation from the official path: `sudo` requires a password on this host, so GitHub's `svc.sh install` (which writes to `/etc/systemd/system`) was unusable. Used **`systemd --user`** units instead — `Linger=yes` was already enabled for `rob`, so user services autostart at boot without login. Same runtime user, same autostart guarantee, no root required.
- **Verified**: smoke-test workflow fanned 3 matrix jobs across all 3 runners (one each), Cloudflare egress confirmed from the runner host, **0 minutes billed**.
- **⚠️ SECURITY GATE — STILL LIVE**: Self-hosted runners are safe here **only because the repo is private**. If `nevrite-music` is ever made public, the runners **must be removed or reconfigured first** — a fork's pull request would otherwise execute untrusted code on Rob's machine with his user privileges. This gate does not expire with this blocker.

## BLOCKER-004: Ideation remediation decisions await owner selection (2026-07-19)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-22T15:30:00.000Z
- **Agents**: claude
- **Sources**: ideate-validate
- **Index**: [[index]]

- **Status**: active
- **Impact**: Blocks the required fresh full `/audit-ambiguity ideation` gate and therefore `/create-prd`.
- **Detail**: **All decision work is complete.** Canonical remediation-state reconciles 107 manifest findings as **107 `verified-fixed`** — 0 product, 0 architecture, 0 deferred-with-interim-rule. All 26 blocking findings are resolved, all 43 canonical decision-queue entries are ratified, and every interim rule has been replaced with a full contract. P-01 / `r-44[0]` closed on its policy on 2026-07-22: the validation gate is decided and in force, and collecting its practitioner evidence (two beatmakers, two session players, per `specs/audits/p01-production-stage-vocabulary-validation.md`) is tracked implementation work — the same disposition applied to A-03 and A-04. No candidate stage label is enforceable until that packet passes. The final disposition ledger is `.memory/wiki/specs/audits/remediation-state.md`; the decision queue is `.memory/wiki/specs/audits/ideation-remediation-decision-queue.md`.
- **Resolution**: **Decision work is complete.** Two steps remain before `/create-prd`: (1) the graph refresh — **done 2026-07-22**, spec graph rebuilt to 1,218 nodes / 7,474 edges; (2) a fresh full `/audit-ambiguity ideation`. The recovery ledger cannot substitute for that run, and the gate does not expire with this blocker. Separately tracked, not blocking the audit: P-01's practitioner traces and enum approval.

## Full Log

### BLOCKER-001: `gh` authenticated as personal account, not business account (2026-07-16)

- **Timestamp**: 2026-07-16T12:00:00.000Z
- **Agent**: claude
- **Source**: ideate
- **Tags**: blocker, ideation, recovered

- **Status**: **resolved** (2026-07-16)
- **Impact**: Blocked (a) the initial `git push` of the WeJammin repo, and (b) self-hosted runner registration, which requires minting a repo registration token from an authorized account.
- **Detail**: `gh` was authed as `NEVRITERob` (personal). The repo transferred to `WeJustJammin`. Git commit identity was set repo-local to `WeJustJammin <305953066+WeJustJammin@users.noreply.github.com>`, so commits attributed correctly; only the transport was affected.
- **Resolution**: User ran `gh auth login` interactively. `WeJustJammin` is now the active account with `admin: true` on the repo; `NEVRITERob` retained as a non-active second account. Initial push completed — repo is no longer empty.

### BLOCKER-002: `wejamm.in` DNS not pointed at Cloudflare (2026-07-16)

- **Timestamp**: 2026-07-16T12:00:00.000Z
- **Agent**: claude
- **Source**: ideate
- **Tags**: blocker, ideation, recovered

- **Status**: active
- **Impact**: Blocks `/setup-workspace-hosting`. Not urgent — deploy is ~8 pipeline stages away — but DNS propagation takes hours, so early action has real value.
- **Resolution**: Point nameservers at Cloudflare. May require action at the registrar rather than in the Cloudflare dashboard. Nameserver changes are account settings — require explicit per-action user confirmation.

### BLOCKER-003: Self-hosted GitHub runners not installed (2026-07-16)

- **Timestamp**: 2026-07-16T12:00:00.000Z
- **Agent**: claude
- **Source**: ideate
- **Tags**: blocker, ideation, recovered

- **Status**: **resolved** (2026-07-16)
- **Impact**: Blocked the owner's stated CI/CD preference (GitHub → Cloudflare deploy without consuming Actions minutes).
- **Detail**: Owner wanted 2–3 local runners as systemd services, autostarting on boot. Motivation sound — `nevrite-music` is **private**, so Actions minutes are metered (unlimited only on public repos).
- **Resolution**: **3 runners installed and verified online.** See `.memory/wiki/specs/ideation/meta/constraints.md` § Self-Hosted Runner Fleet for the full build. Key deviation from the official path: `sudo` requires a password on this host, so GitHub's `svc.sh install` (which writes to `/etc/systemd/system`) was unusable. Used **`systemd --user`** units instead — `Linger=yes` was already enabled for `rob`, so user services autostart at boot without login. Same runtime user, same autostart guarantee, no root required.
- **Verified**: smoke-test workflow fanned 3 matrix jobs across all 3 runners (one each), Cloudflare egress confirmed from the runner host, **0 minutes billed**.
- **⚠️ SECURITY GATE — STILL LIVE**: Self-hosted runners are safe here **only because the repo is private**. If `nevrite-music` is ever made public, the runners **must be removed or reconfigured first** — a fork's pull request would otherwise execute untrusted code on Rob's machine with his user privileges. This gate does not expire with this blocker.

### BLOCKER-004: Ideation remediation decisions await owner selection (2026-07-19)

- **Timestamp**: 2026-07-22T15:30:00.000Z
- **Agent**: claude
- **Source**: ideate-validate
- **Tags**: blocker, ideation, remediation, recovered

- **Status**: active
- **Impact**: Blocks the required fresh full `/audit-ambiguity ideation` gate and therefore `/create-prd`.
- **Detail**: **All decision work is complete.** Canonical remediation-state reconciles 107 manifest findings as **107 `verified-fixed`** — 0 product, 0 architecture, 0 deferred-with-interim-rule. All 26 blocking findings are resolved, all 43 canonical decision-queue entries are ratified, and every interim rule has been replaced with a full contract. P-01 / `r-44[0]` closed on its policy on 2026-07-22: the validation gate is decided and in force, and collecting its practitioner evidence (two beatmakers, two session players, per `specs/audits/p01-production-stage-vocabulary-validation.md`) is tracked implementation work — the same disposition applied to A-03 and A-04. No candidate stage label is enforceable until that packet passes. The final disposition ledger is `.memory/wiki/specs/audits/remediation-state.md`; the decision queue is `.memory/wiki/specs/audits/ideation-remediation-decision-queue.md`.
- **Resolution**: **Decision work is complete.** Two steps remain before `/create-prd`: (1) the graph refresh — **done 2026-07-22**, spec graph rebuilt to 1,218 nodes / 7,474 edges; (2) a fresh full `/audit-ambiguity ideation`. The recovery ledger cannot substitute for that run, and the gate does not expire with this blocker. Separately tracked, not blocking the audit: P-01's practitioner traces and enum approval.
