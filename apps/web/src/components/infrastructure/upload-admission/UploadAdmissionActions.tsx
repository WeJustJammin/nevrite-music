import type { UploadAdmissionState } from './upload-admission-state';

export interface UploadAdmissionActionsProps {
  readonly status: UploadAdmissionState['status'];
  readonly selectedFile: File | null;
  readonly submitDisabled: boolean;
  readonly onTransfer: () => void | Promise<void>;
}

export function UploadAdmissionActions({
  status,
  selectedFile,
  submitDisabled,
  onTransfer,
}: UploadAdmissionActionsProps) {
  return (
    <div className="upload-admission-actions">
      <button
        type="submit"
        className="upload-admission-action"
        disabled={submitDisabled}
        data-target-size="min-inline-size: 44px"
      >
        {status === 'pending'
          ? 'Requesting upload admission…'
          : 'Request upload intent'}
      </button>
      {status === 'success' && (
        <button
          type="button"
          className="upload-admission-action"
          onClick={() => void onTransfer()}
          disabled={selectedFile === null}
          data-target-size="min-inline-size: 44px"
        >
          Transfer selected file
        </button>
      )}
    </div>
  );
}

export default UploadAdmissionActions;
