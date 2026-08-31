# Contract source

## Contents

Zod schemas and inferred TypeScript types for identifiers, API errors, request context, operational endpoints, and closed registries.

## Ownership

The platform contract owner approves wire-shape changes. Feature packages consume these exports and may not redefine them.

## Extension rules

Add a focused schema module, export it from `index.ts`, and add boundary tests. Keep schemas strict, JSON-safe, and below the schema file-size limit.

## Conventions and related material

Runtime schemas are authoritative; inferred types follow schemas. See [`../README.md`](../README.md) and the backend infrastructure specification.
