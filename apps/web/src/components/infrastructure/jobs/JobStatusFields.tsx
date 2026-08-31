import type { JobStatus } from '@wejammin/contracts';

import { mapJobStatusFields } from './job-state';

export interface JobStatusFieldsProps {
  readonly job: JobStatus;
}

export function JobStatusFields({ job }: JobStatusFieldsProps) {
  const fields = mapJobStatusFields(job).filter(
    ({ field }) => field !== 'progress',
  );
  return (
    <dl className="infra-job-fields">
      {fields.map(({ field, label, value, kind }) => (
        <div className="infra-job-field" key={field} data-field={field}>
          <dt>{label}</dt>
          <dd>
            {kind === 'time' ? (
              <time dateTime={value}>{value}</time>
            ) : kind === 'code' ? (
              <code>{value}</code>
            ) : (
              value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default JobStatusFields;
