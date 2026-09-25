import { createHash } from 'node:crypto';

import { AC209_EMAIL_PRESENCE_UNAVAILABLE_CODES } from './ac209-email-presence-contract.ts';

/**
 * Public-log safety rules shared by the bounded AC209 email diagnostics.
 *
 * Why provider labels are reduced to a digest. A Cloudflare diagnostics row
 * carries provider-owned label strings - the per-event `status` and `action`, and
 * the aggregated `status` dimension - and the provider publishes no closed value
 * list for any of them: the documented dimension tables type all three as plain
 * `string`, and the only wire values Cloudflare ever prints are single examples
 * in a tutorial response, not a permitted-value set. A provider label is
 * therefore unconstrained text that this repository did not write.
 *
 * Two consequences make that text unsafe to publish verbatim. A workflow log and
 * a retained artifact are both public CI surfaces, and a GitHub Actions log is
 * scanned for workflow commands. The runner's legacy parser locates its `##[`
 * token with an unanchored substring search, so a label containing that token
 * anywhere - not only at the start of a line - is read as an instruction rather
 * than as data. Independently, a label may carry personal data, and nothing in
 * the provider contract guarantees it cannot.
 *
 * The label is therefore shape-checked and then reduced, in memory, to a one-way
 * SHA-256 digest. The digest is the only form that reaches a log line or an
 * artifact; the raw string exists only inside the reader frame that hashed it.
 * Digests are retained so the tally stays useful - counts survive, distinct labels
 * stay distinct, and two reports remain comparable through their digests.
 *
 * What a digest does and does not hide. It suppresses the raw text, so no
 * unvetted string can reach a public surface. It does not make a label secret:
 * the digest is unsalted by design, precisely so a candidate can be tested for
 * membership, which means an operator - or anyone reading the artifact - can
 * confirm a guessed label by hashing it. The vocabulary is small and largely
 * guessable, so treat the digest as a disclosure of candidate membership rather
 * than of the label text. That is the intended trade: the diagnostic needs to
 * distinguish and compare labels, not to withhold the provider's vocabulary.
 */

/** One provider label reduced to a one-way digest. */
export const PROVIDER_LABEL_SHA256 = /^[0-9a-f]{64}$/u;

/**
 * Reduces one checked provider label to its SHA-256 digest.
 *
 * The digest is of the label alone, with no salt or field prefix, so an operator
 * can hash a candidate label independently and compare. A distinct label cannot
 * collide with a message-identifier digest in practice. Neither preimage is
 * recoverable from a digest, but a guessable label - which most of this vocabulary
 * is - can be confirmed by hashing it, so the digest hides the text while
 * revealing candidate membership by design.
 */
export const digestProviderLabel = (label: string): string =>
  createHash('sha256').update(label).digest('hex');

/**
 * Closes any thrown value into the shared provider-failure vocabulary.
 *
 * A failure line is a public log line, so it carries a code from a closed list
 * rather than whatever a caught value happens to expose. Narrowing on an
 * unconstrained `code` property would let a provider-shaped object, or any other
 * thrown value, place arbitrary text on a log line; an unrecognised code is
 * reported as `unexpected_failure` instead of being echoed.
 */
export const boundedFailureCode = (error: unknown): string => {
  if (typeof error !== 'object' || error === null) return 'unexpected_failure';
  if (!('code' in error)) return 'unexpected_failure';
  const { code } = error as Readonly<{ code: unknown }>;
  if (typeof code !== 'string') return 'unexpected_failure';
  return (
    AC209_EMAIL_PRESENCE_UNAVAILABLE_CODES.find((known) => known === code) ??
    'unexpected_failure'
  );
};
