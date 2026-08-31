# Shared packages

Packages follow the locked dependency direction: contracts, domain, application, adapters, then composition. A package may import only upstream contracts or declared ports; provider, browser, and persistence types never enter domain invariants.

Add a package only when its owning specification names the boundary. Every package declares an explicit workspace name, exact external dependencies, a narrow export map, strict TypeScript configuration when it contains TypeScript, tests beside behavior, and a README once the directory contains more than two files.
