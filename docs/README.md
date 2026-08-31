# WeJammin project documentation

This directory contains durable project records and generated API-documentation
output. Source specifications and pipeline state remain under `.memory/wiki/`.

## Contents

- `local-bootstrap.md` is the exact, local-only setup and troubleshooting guide.
- `kit-architecture.md` documents the CFSA runtime and artifact architecture.
- `progress-state-catalog.md` defines canonical pipeline-progress locations.
- `wejammin-domain-map-proposal.md` is retained historical domain-map evidence.
- `adr/` and `openapi/` are reserved for architecture decisions and generated
  API documentation.

## Ownership

The documentation owner maintains runbooks, architecture records, and links to
authoritative specifications. Generated API output is derived from contracts;
do not edit generated files by hand. Provider accounts, secrets, and production
mutations are outside this directory.

## Extension

Add a focused Markdown record with a descriptive kebab-case name. Put durable
specification changes in `.memory/wiki/` first, link the authority here, and
add generated OpenAPI output only through the contract generation command.

## Conventions

Use clear headings, dated status where history matters, relative links, exact
commands, and explicit scope. Do not use unresolved template markers,
credential examples, or instructions that silently create paid services.

## Related links

- [Local bootstrap](local-bootstrap.md)
- [Architecture design](../.memory/wiki/specs/2026-08-02-architecture-design.md)
- [Pipeline progress](progress-state-catalog.md)
- [Infrastructure scripts](../infra/README.md)
