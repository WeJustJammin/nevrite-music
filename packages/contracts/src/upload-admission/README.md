# Upload admission contracts

## Contents

Primitive upload fields, target policy registries, admission requests, and
server-generated upload intent resources.

## Ownership

The platform contract owner controls policy membership, immutable-target
semantics, checksums, object keys, and signed URL response shapes.

## Extension rules

Keep field, policy, request, and resource schemas in their focused modules.
Use strict Zod 4 schemas and add boundary tests for every wire-shape change.

## Conventions and related material

The root barrel preserves `@wejammin/contracts` imports. See the backend
infrastructure specification and the parent contracts README.
