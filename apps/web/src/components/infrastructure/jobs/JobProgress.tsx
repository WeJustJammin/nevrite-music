import type { JobStatus } from '@wejammin/contracts';

export type JobProgressValue = NonNullable<JobStatus['progress']>;

export interface JobProgressProps {
  readonly progress: JobStatus['progress'];
}

export function JobProgress({ progress }: JobProgressProps) {
  if (progress === null) {
    return (
      <p className="infra-job-progress" data-progress="unknown">
        Progress not reported.
      </p>
    );
  }

  const percentage = Math.round((progress.completed / progress.total) * 100);
  return (
    <div className="infra-job-progress" data-progress="determinate">
      <span>Progress</span>
      <progress
        value={progress.completed}
        max={progress.total}
        aria-label="Job progress"
        aria-valuetext={`${progress.completed} of ${progress.total} (${percentage}%)`}
      >
        {percentage}%
      </progress>
      <span>
        {progress.completed} of {progress.total} ({percentage}%)
      </span>
    </div>
  );
}

export default JobProgress;
