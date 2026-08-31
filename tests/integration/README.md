# Integration tests

## Contents

Cross-package tests exercise contracts, application policies, Worker adapters,
and web orchestration without calling hosted providers.

## Ownership

QA owns this directory; each test names the production boundary it integrates.

## Extension rules

Add a focused file for one cross-layer behavior. Use injected local fakes and
keep acceptance-criterion markers unique across the phase.

## Conventions and related material

Keep fixtures deterministic, validate wire contracts at boundaries, and never
place secrets or raw provider payloads in snapshots. Related component,
security, accessibility, and end-to-end suites live in sibling test folders.
