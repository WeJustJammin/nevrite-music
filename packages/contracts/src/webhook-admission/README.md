# Webhook admission contracts

## Contents

Provider identity, raw-byte request, registry, receipt, resolution, and
manual-review schemas for signed webhook admission.

## Ownership

The platform contract owner controls provider registration, signature inputs,
receipt state, and conflict-review wire shapes.

## Extension rules

Keep each schema concern in its focused module. Use strict Zod 4 schemas,
preserve raw-byte verification boundaries, and add contract tests for changes.

## Conventions and related material

The root barrel preserves `@wejammin/contracts` exports. See the backend
infrastructure specification and the parent contracts README.
