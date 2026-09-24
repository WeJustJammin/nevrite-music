// AC265 session broker service-role client.
//
// Split into focused modules by concern: transport hardening (bounded
// response, redirect rejection, deadline), result parsing/rebinding, and the
// three public entry points. This barrel preserves the original import path.
export * from './ac265-session-broker-rpc-transport.ts';
export * from './ac265-session-broker-rpc-parsers.ts';
export * from './ac265-session-broker-rpc-entrypoints.ts';
