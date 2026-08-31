# Environment contracts

This directory owns the runtime environment schemas and the parsing boundary
used by server and browser entrypoints. `environment.schema.ts` contains the
closed Zod contracts; `environment.ts` contains safe parsing and browser
projection. Add a new variable to the appropriate schema and its key list,
then add rejection, projection, and secret-safety tests beside the parser.

Server entrypoints must call `parseServerEnvironment` before serving requests.
Browser entrypoints must call `projectBrowserEnvironment` or
`parseBrowserEnvironment`; only the three `PUBLIC_*` keys in the browser
contract may cross that boundary. Provider credentials and setup credentials
remain outside this package's browser projection.

## Contents

`environment.schema.ts` defines Zod input contracts, `environment.ts` exposes
the parsing and projection functions, and `environment.test.ts` locks the
runtime behavior.

## Ownership

This directory owns environment validation and safe browser projection. It does
not own provider clients, deployment orchestration, or application policy.

## Extension

Add a variable to the schema and the correct key list, then add valid, invalid,
and secret-boundary assertions to the colocated tests. Keep server-only values
out of all browser projections.

## Conventions

Use strict inferred types, explicit startup errors, bounded values, and
allowlisted public keys. Keep schemas focused and avoid ambient environment
reads outside this boundary.

## Related links

- [Configuration package](../README.md)
- [Runtime contracts](../../contracts/README.md)
- [Local bootstrap](../../../docs/local-bootstrap.md)
