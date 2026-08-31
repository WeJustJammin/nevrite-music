import type { RefObject } from 'react';
import type {
  AccessVariant,
  DomainVariant,
  InfrastructureRecord,
} from '@wejammin/ui/infrastructure/presentation';
import ActionBar from './ActionBar';
import { formatFact } from './infrastructure-workbench-state';

export interface InfrastructureRecordDetailProps {
  readonly record: InfrastructureRecord | null;
  readonly access: AccessVariant;
  readonly variant: DomainVariant;
  readonly expectedVersion: string | null;
  readonly actingPartyId?: string;
  readonly isPending: boolean;
  readonly commandAvailable?: boolean;
  readonly selectedFileName: string | null;
  readonly archiveTrigger: RefObject<HTMLButtonElement | null>;
  readonly onReviewArchive: () => void;
  readonly onRetry: () => void;
  readonly onFileChange: (file: File | undefined) => void;
}

export function InfrastructureRecordDetail({
  record,
  access,
  variant,
  expectedVersion,
  actingPartyId,
  isPending,
  commandAvailable = false,
  selectedFileName,
  archiveTrigger,
  onReviewArchive,
  onRetry,
  onFileChange,
}: InfrastructureRecordDetailProps) {
  return (
    <section
      className="infra-record-detail"
      aria-labelledby="record-details-heading"
    >
      <div className="infra-region-heading">
        <h3 id="record-details-heading">Infrastructure record details</h3>
        <p>Selection stays stable while canonical state is refetched.</p>
      </div>
      {record === null ? (
        <p className="infra-empty-state">
          Select a record to review its facts and provenance.
        </p>
      ) : (
        <>
          <header className="infra-record-header">
            <p className="infra-eyebrow">Record</p>
            <h4>{record.label}</h4>
            <p>{record.summary}</p>
            <dl className="infra-record-meta">
              <div>
                <dt>Version</dt>
                <dd>
                  <code>{record.version}</code>
                </dd>
              </div>
              <div>
                <dt>Last modified</dt>
                <dd>
                  <time dateTime={record.modifiedAt}>{record.modifiedAt}</time>
                </dd>
              </div>
            </dl>
          </header>

          <section
            className="infra-facts"
            aria-labelledby="record-facts-heading"
          >
            <h4 id="record-facts-heading">Facts</h4>
            <dl>
              {Object.entries(record.facts).map(([key, value]) => (
                <div key={key}>
                  <dt>{key}</dt>
                  <dd>
                    {access === 'partial-hidden' &&
                    key.toLocaleLowerCase().includes('private')
                      ? 'Hidden by policy'
                      : formatFact(value)}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section
            className="infra-provenance"
            aria-labelledby="record-provenance-heading"
          >
            <h4 id="record-provenance-heading">Provenance</h4>
            {record.provenance.length === 0 ? (
              <p>No provenance entries are available in this projection.</p>
            ) : (
              <ol>
                {record.provenance.map((item) => (
                  <li key={`${item.label}-${item.recordedAt}`}>
                    <span>{item.label}</span> <span>{item.sourceType}</span>{' '}
                    <time dateTime={item.recordedAt}>{item.recordedAt}</time>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <ActionBar
            access={access}
            expectedVersion={expectedVersion ?? record.version}
            onReviewArchive={onReviewArchive}
            onRetry={onRetry}
            isPending={isPending}
            commandAvailable={commandAvailable}
            triggerRef={archiveTrigger}
            prerequisite="A named server capability and the current version are required."
          />

          {access !== 'not-rendered' && access !== 'read-only' && (
            <section
              className="infra-command-form"
              aria-labelledby="command-heading"
            >
              <h4 id="command-heading">Protected command inputs</h4>
              <p className="infra-help">
                Inputs remain local until the server validates capability,
                origin, idempotency, and expected version.
              </p>
              <div className="infra-field">
                <label htmlFor="record-title">Record title</label>
                <input
                  id="record-title"
                  name="title"
                  defaultValue={record.label}
                  aria-describedby="record-title-help"
                  disabled={!commandAvailable}
                />
                <p id="record-title-help" className="infra-help">
                  Use the canonical record title; unknown fields are rejected.
                </p>
              </div>
              <div className="infra-field">
                <label htmlFor="record-upload">
                  Attach an object for verification
                </label>
                <input
                  id="record-upload"
                  name="object"
                  type="file"
                  accept="audio/*,video/*,application/pdf"
                  disabled={!commandAvailable}
                  onChange={(event) => onFileChange(event.target.files?.[0])}
                  aria-describedby="record-upload-help"
                />
                <p id="record-upload-help" className="infra-help">
                  The server must issue an upload intent. Unverified or
                  quarantined bytes never render as ready.
                </p>
                {selectedFileName !== null && (
                  <p role="status">
                    Selected file: {selectedFileName}. Awaiting server upload
                    intent.
                  </p>
                )}
              </div>
              <p className="infra-help">
                {variant === 'adminStepUp' && actingPartyId !== undefined
                  ? 'Admin actions use the server-selected acting party and recent step-up verification.'
                  : 'The acting party is selected by the server; URL state cannot change authority.'}
              </p>
            </section>
          )}
        </>
      )}
    </section>
  );
}

export default InfrastructureRecordDetail;
