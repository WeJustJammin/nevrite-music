import * as React from 'react';

export type ActionBarState =
  'idle' | 'pending' | 'success' | 'error' | 'disabled';

export interface ActionBarProps {
  readonly primary?: React.ReactNode;
  readonly secondary?: React.ReactNode;
  readonly destructive?: React.ReactNode;
  readonly state: ActionBarState;
  readonly expectedVersion: string | null;
  readonly operationId: string | null;
  readonly onPrimary?: () => void;
  readonly onSecondary?: () => void;
  readonly onDestructive?: () => void;
  /** Associate the primary action with its owning form when the bar is outside it. */
  readonly primaryFormId?: string;
  /** Associate the secondary action with its owning form when applicable. */
  readonly secondaryFormId?: string;
  /** Associate the destructive action with its owning form when applicable. */
  readonly destructiveFormId?: string;
  readonly disabled?: boolean;
}

/** Native form-owned actions with stable pending labels and version context. */
export function ActionBar({
  primary = 'Save draft',
  secondary = 'Cancel',
  destructive,
  state,
  expectedVersion,
  operationId,
  onPrimary,
  onSecondary,
  onDestructive,
  primaryFormId,
  secondaryFormId,
  destructiveFormId,
  disabled = false,
}: ActionBarProps): React.ReactElement {
  const pending = state === 'pending';
  const unavailable = disabled || state === 'disabled';
  const primaryAvailable =
    primaryFormId !== undefined || onPrimary !== undefined;
  const secondaryAvailable =
    secondaryFormId !== undefined || onSecondary !== undefined;
  const destructiveAvailable =
    destructiveFormId !== undefined || onDestructive !== undefined;
  return (
    <div
      className="platform-configuration-action-bar"
      aria-label="Configuration actions"
    >
      <p className="platform-configuration-help">
        Expected version: <code>{expectedVersion ?? 'not available'}</code>
        {operationId === null ? null : (
          <>
            . Operation <code>{operationId}</code>.
          </>
        )}
      </p>
      <div className="platform-configuration-actions">
        <button
          type={primaryFormId === undefined ? 'button' : 'submit'}
          form={primaryFormId}
          onClick={onPrimary}
          disabled={unavailable || pending || !primaryAvailable}
          aria-busy={pending ? 'true' : undefined}
        >
          {pending ? 'Saving draft…' : primary}
        </button>
        <button
          type={secondaryFormId === undefined ? 'button' : 'submit'}
          className="secondary-action"
          form={secondaryFormId}
          onClick={onSecondary}
          disabled={unavailable || pending || !secondaryAvailable}
        >
          {secondary}
        </button>
        {destructive === undefined ? null : (
          <button
            type={destructiveFormId === undefined ? 'button' : 'submit'}
            className="destructive-action"
            form={destructiveFormId}
            onClick={onDestructive}
            disabled={unavailable || pending || !destructiveAvailable}
            aria-describedby="platform-configuration-destructive-consequence"
          >
            {destructive}
          </button>
        )}
      </div>
      {destructive === undefined ? null : (
        <p
          id="platform-configuration-destructive-consequence"
          className="platform-configuration-help"
        >
          Destructive changes affect the named scope and require a fresh step-up
          before commit.
        </p>
      )}
    </div>
  );
}

export default ActionBar;
