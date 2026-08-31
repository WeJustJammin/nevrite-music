# Provider operation contracts

## Contents

Provider operation identity, payload, adapter response, reconciliation
evidence, and state-transition schemas.

## Ownership

The platform contract owner controls intent immutability, provider-neutral
payloads, unknown outcomes, evidence binding, and transition rules.

## Extension rules

Keep primitive, record, effect, and transition concerns focused. Use strict
Zod 4 schemas and add contract tests for every adapter-facing change.

## Conventions and related material

The root barrel preserves `@wejammin/contracts` imports. See the backend
infrastructure specification and the parent contracts README.
