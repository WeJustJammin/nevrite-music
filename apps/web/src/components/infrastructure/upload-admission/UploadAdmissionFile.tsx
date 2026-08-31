import type { ChangeEvent } from 'react';

export interface UploadAdmissionFileProps {
  readonly allowedMediaTypes: readonly string[];
  readonly disabled: boolean;
  readonly selectedFileName: string | null;
  readonly onChange: (file: File | null) => void;
}

export function UploadAdmissionFile({
  allowedMediaTypes,
  disabled,
  selectedFileName,
  onChange,
}: UploadAdmissionFileProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.currentTarget.files?.[0] ?? null);
  };
  return (
    <div className="upload-admission-file">
      <label htmlFor="upload-file">File to transfer</label>
      <input
        id="upload-file"
        type="file"
        accept={allowedMediaTypes.join(',')}
        disabled={disabled}
        aria-describedby="upload-file-help"
        onChange={handleChange}
      />
      <p id="upload-file-help">
        Selection stays local until a server-authorized transfer starts.
      </p>
      {selectedFileName !== null && (
        <p role="status">Selected file: {selectedFileName}</p>
      )}
    </div>
  );
}

export default UploadAdmissionFile;
