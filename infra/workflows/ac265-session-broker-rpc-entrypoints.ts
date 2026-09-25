import {
  Ac265SessionBrokerAuthorizeRequestSchema,
  Ac265SessionBrokerResolveRequestSchema,
  Ac265SessionBrokerTeardownRequestSchema,
  type Ac265SessionBrokerAuthorizeResult,
  type Ac265SessionBrokerResolveResult,
  type Ac265SessionBrokerTeardownResult,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-session-broker-control.ts';
import {
  parseAuthorizeResult,
  parseResolveResult,
  parseTeardownResult,
} from './ac265-session-broker-rpc-parsers.ts';
import {
  callAc265SessionBrokerRpc,
  fail,
  sha256Hex,
  type Ac265SessionBrokerTransportOptions,
} from './ac265-session-broker-rpc-transport.ts';

const AUTHORIZE_RPC_NAME = 'ac265_session_broker_authorize';
const RESOLVE_RPC_NAME = 'ac265_session_broker_resolve';
const TEARDOWN_RPC_NAME = 'ac265_session_broker_teardown';

export async function authorizeAc265SessionBroker(
  options: Ac265SessionBrokerTransportOptions,
  untrustedRequest: unknown,
): Promise<Ac265SessionBrokerAuthorizeResult> {
  const parsed =
    Ac265SessionBrokerAuthorizeRequestSchema.safeParse(untrustedRequest);
  if (!parsed.success) return fail();
  for (const handle of parsed.data.handles)
    if (handle.handleSha256 !== (await sha256Hex(handle.handleRef)))
      return fail();
  const source = await callAc265SessionBrokerRpc(
    options,
    'authorize',
    AUTHORIZE_RPC_NAME,
    parsed.data,
  );
  return parseAuthorizeResult(source, parsed.data);
}

export async function resolveAc265SessionBroker(
  options: Ac265SessionBrokerTransportOptions,
  untrustedRequest: unknown,
): Promise<Ac265SessionBrokerResolveResult> {
  const parsed =
    Ac265SessionBrokerResolveRequestSchema.safeParse(untrustedRequest);
  if (!parsed.success) return fail();
  // The handle digest must be derived from the exact reference bytes locally;
  // a caller cannot assert a digest for a reference it does not hold.
  if (parsed.data.handleSha256 !== (await sha256Hex(parsed.data.handleRef)))
    return fail();
  const source = await callAc265SessionBrokerRpc(
    options,
    'resolve',
    RESOLVE_RPC_NAME,
    parsed.data,
  );
  return parseResolveResult(source, parsed.data);
}

export async function teardownAc265SessionBroker(
  options: Ac265SessionBrokerTransportOptions,
  untrustedRequest: unknown,
): Promise<Ac265SessionBrokerTeardownResult> {
  const parsed =
    Ac265SessionBrokerTeardownRequestSchema.safeParse(untrustedRequest);
  if (!parsed.success) return fail();
  if (parsed.data.handleSha256 !== (await sha256Hex(parsed.data.handleRef)))
    return fail();
  const source = await callAc265SessionBrokerRpc(
    options,
    'teardown',
    TEARDOWN_RPC_NAME,
    parsed.data,
  );
  return parseTeardownResult(source, parsed.data);
}
