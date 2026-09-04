import type { ProfilePortfolioError } from '../components/profile-portfolio/profile-portfolio-workbench-types';
import { profilePortfolioProgressiveResponseError } from './profile-portfolio-progressive-transport';

type ProgressiveMutationState = {
  busy: boolean;
  conflict: boolean;
  lastSubmittedAt: number;
};

const FORM_SELECTOR = 'form[data-operation="PRF-PROF-03"]';
const WORKBENCH_SELECTOR = '[data-workbench="profile-portfolio-epk"]';
const CHANNEL_NAME = 'profile-portfolio';

const states = new WeakMap<HTMLFormElement, ProgressiveMutationState>();
const drafts = new Map<string, string>();

const workbenchFor = (form: HTMLFormElement): HTMLElement | null =>
  form.closest<HTMLElement>(WORKBENCH_SELECTOR);

const stateFor = (form: HTMLFormElement): ProgressiveMutationState => {
  const current = states.get(form);
  if (current !== undefined) return current;
  const next = { busy: false, conflict: false, lastSubmittedAt: 0 };
  states.set(form, next);
  return next;
};

const setStatus = (root: HTMLElement, message: string): void => {
  const status = root.querySelector<HTMLElement>('[role="status"]');
  if (status !== null) status.textContent = message;
};

const setError = (
  root: HTMLElement,
  error: ProfilePortfolioError,
  conflict = false,
): void => {
  root.dataset.progressiveState = conflict ? 'conflict' : 'error';
  setStatus(root, `${error.message} Request ID: ${error.requestId}`);
  let alert = root.querySelector<HTMLElement>('[data-form-error]');
  if (alert === null) {
    alert = document.createElement('div');
    alert.setAttribute('role', 'alert');
    alert.setAttribute('data-form-error', 'true');
    const status = root.querySelector<HTMLElement>('[role="status"]');
    if (status === null) root.insertBefore(alert, root.firstChild);
    else status.insertAdjacentElement('afterend', alert);
  }
  if (conflict) root.dataset.state = 'conflict';
  let summary = alert.querySelector<HTMLElement>(
    '#profile-portfolio-error-summary',
  );
  if (summary === null) {
    summary = document.createElement('p');
    summary.id = 'profile-portfolio-error-summary';
    alert.appendChild(summary);
  }
  summary.textContent = `${error.code}: ${error.message}`;
  let request = alert.querySelector<HTMLElement>('[data-request-id]');
  if (request === null) {
    request = document.createElement('p');
    request.dataset.requestId = 'true';
    alert.appendChild(request);
  }
  request.textContent = `Request ID: ${error.requestId}`;
  const retryAfter = error.details?.retryAfterSeconds;
  const status = root.querySelector<HTMLElement>('[role="status"]');
  if (status !== null && retryAfter !== undefined) {
    status.dataset.rateWait = String(retryAfter);
    status.textContent = `${error.message} Try again in ${retryAfter} seconds. Request ID: ${error.requestId}`;
  }
};

const invalidHeadline = (form: HTMLFormElement): boolean => {
  const field = form.elements.namedItem('headline');
  if (!(
    field instanceof HTMLTextAreaElement || field instanceof HTMLInputElement
  ))
    return false;
  if (typeof field.value !== 'string' || !/[<>]/u.test(field.value))
    return false;
  const root = workbenchFor(form);
  if (root === null) return true;
  field.setAttribute('aria-invalid', 'true');
  field.setAttribute('aria-describedby', 'profile-portfolio-error-summary');
  field.focus({ preventScroll: true });
  setError(root, {
    code: 'VALIDATION_FAILED',
    message: 'Check the highlighted fields.',
    requestId: 'client-validation',
  });
  return true;
};

const restoreDraft = (form: HTMLFormElement): void => {
  const value = drafts.get(form.action);
  const field = form.elements.namedItem('headline');
  if (
    value !== undefined &&
    (field instanceof HTMLTextAreaElement || field instanceof HTMLInputElement)
  )
    field.value = value;
};

const submitProgressively = async (form: HTMLFormElement): Promise<void> => {
  const root = workbenchFor(form);
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const state = stateFor(form);
  if (root === null || button === null) return;
  const now = Date.now();
  if (state.busy || now - state.lastSubmittedAt < 1000) {
    state.busy = true;
    state.conflict = true;
    button.setAttribute('aria-busy', 'true');
    button.dataset.duplicateActive = 'true';
    setError(
      root,
      {
        code: 'VERSION_CONFLICT',
        message: 'The current profile version changed. Review changes.',
        requestId: 'duplicate-mutation',
      },
      true,
    );
    return;
  }
  state.busy = true;
  state.lastSubmittedAt = now;
  button.setAttribute('aria-busy', 'true');
  button.dataset.duplicateActive = 'true';
  root.dataset.progressiveState = 'optimistic-pending';
  setStatus(root, 'Saving profile changes.');
  const endpoint = form.getAttribute('action');
  if (endpoint === null || endpoint.length === 0) return;
  const data = new FormData(form);
  try {
    const response = await fetch(endpoint, {
      method: 'PUT',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'If-Match': String(data.get('expected-version') ?? ''),
        'Idempotency-Key': String(data.get('idempotency-key') ?? ''),
        'X-CSRF-Token': String(data.get('csrf') ?? ''),
      },
      body: JSON.stringify({
        sectionCode: 'now',
        headline: data.get('headline'),
      }),
    });
    if (!response.ok) {
      setError(
        root,
        await profilePortfolioProgressiveResponseError(response),
        response.status === 409,
      );
      return;
    }
    if (!state.conflict) {
      state.busy = false;
      button.removeAttribute('aria-busy');
      delete button.dataset.duplicateActive;
      root.dataset.progressiveState = 'success';
      setStatus(root, 'Profile portfolio ready.');
    }
  } catch {
    if (!state.conflict)
      setError(root, {
        code: 'DEPENDENCY_UNAVAILABLE',
        message: 'The profile service is temporarily unavailable.',
        requestId: 'unknown',
      });
  }
};

const installInvalidationChannel = (): void => {
  if (typeof BroadcastChannel !== 'function') return;
  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.addEventListener('message', (event: MessageEvent<unknown>) => {
    if (
      typeof event.data !== 'object' ||
      event.data === null ||
      !('type' in event.data) ||
      event.data.type !== 'profile.projection.invalidated.v1' ||
      !('partyId' in event.data)
    )
      return;
    const root = document.querySelector<HTMLElement>(WORKBENCH_SELECTOR);
    const form = root?.querySelector<HTMLFormElement>(FORM_SELECTOR);
    if (
      root === null ||
      root === undefined ||
      form === null ||
      form === undefined ||
      typeof event.data.partyId !== 'string' ||
      !form.action.includes(encodeURIComponent(event.data.partyId))
    )
      return;
    root.dataset.progressiveState = 'conflict';
    root.dataset.state = 'conflict';
    form.dataset.draft = 'preserved';
    setError(
      root,
      {
        code: 'VERSION_CONFLICT',
        message: 'The current profile version changed. Review changes.',
        requestId: 'sync-conflict',
      },
      true,
    );
  });
};

const install = (): void => {
  document.addEventListener(
    'submit',
    (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || !form.matches(FORM_SELECTOR))
        return;
      event.preventDefault();
      restoreDraft(form);
      if (!invalidHeadline(form)) void submitProgressively(form);
    },
    true,
  );
  document.addEventListener(
    'input',
    (event) => {
      const field = event.target;
      if (
        !(field instanceof HTMLTextAreaElement) &&
        !(field instanceof HTMLInputElement)
      )
        return;
      const form = field.form;
      if (
        field.name === 'headline' &&
        form !== null &&
        form.matches(FORM_SELECTOR)
      )
        drafts.set(form.action, field.value);
    },
    true,
  );
};

const installCanonicalRead = async (): Promise<void> => {
  const root = document.querySelector<HTMLElement>(WORKBENCH_SELECTOR);
  const form = root?.querySelector<HTMLFormElement>(FORM_SELECTOR);
  if (
    root === null ||
    root === undefined ||
    form === null ||
    form === undefined
  )
    return;
  const endpoint = new URL(form.action).pathname.replace(
    /\/sections\/.*$/u,
    '',
  );
  const response = await fetch(endpoint, {
    method: 'GET',
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  });
  if (response.ok) return;
  const error = await profilePortfolioProgressiveResponseError(response);
  root.dataset.state =
    error.code === 'DEPENDENCY_UNAVAILABLE' ? 'degraded' : 'error';
  setError(root, error);
  const status = root.querySelector<HTMLElement>('[role="status"]');
  if (status !== null && status.querySelector('button') === null) {
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.textContent = 'Retry';
    retry.addEventListener('click', () => window.location.reload());
    status.insertAdjacentElement('beforeend', retry);
  }
};

const moveOwnershipIsland = (): void => {
  const slot = document.querySelector('#profile-ownership-slot');
  const island = document.querySelector('#profile-ownership-island');
  if (slot !== null && island !== null) slot.replaceWith(island);
};

if (typeof document !== 'undefined') {
  moveOwnershipIsland();
  install();
  installInvalidationChannel();
  void installCanonicalRead();
}
