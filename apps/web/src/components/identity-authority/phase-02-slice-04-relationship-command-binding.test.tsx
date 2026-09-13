// @vitest-environment jsdom

import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { CLIENT_BINDING_ID_HEADER } from '../../lib/client-binding';
import {
  act,
  cleanupMounted,
  installBrowserState,
  mountNode,
  restoreReactActEnvironment,
} from './acting-context-test-support';
import RelationshipCommandForms from './RelationshipCommandForms';

let browserState: ReturnType<typeof installBrowserState>;

beforeEach(() => {
  browserState = installBrowserState();
  document.cookie = 'wj_csrf=csrf-token; Path=/';
});

afterEach(() => {
  cleanupMounted(browserState.locks);
  document.cookie = 'wj_csrf=; Path=/; Max-Age=0';
  vi.restoreAllMocks();
});

afterAll(restoreReactActEnvironment);

const renderCommands = (onCanonicalRefetch = vi.fn(async () => undefined)) =>
  mountNode(
    <RelationshipCommandForms
      disabled={false}
      errorId={undefined}
      invalid={false}
      expectedVersion={'"7"'}
      organizationId="organization-s04"
      readDisabled={false}
      onCanonicalRefetch={onCanonicalRefetch}
    />,
  );

const submit = async (
  form: HTMLFormElement,
  fields: Readonly<Record<string, string>>,
): Promise<void> => {
  for (const [name, value] of Object.entries(fields)) {
    const field = form.elements.namedItem(name);
    if (!(
      field instanceof HTMLInputElement || field instanceof HTMLSelectElement
    ))
      throw new Error(`missing relationship field ${name}`);
    field.value = value;
  }
  await act(async () => {
    form.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
  });
};

describe('relationship command client binding', () => {
  it('binds same-origin POST and DELETE commands to the active tab without Authorization', async () => {
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        void input;
        void init;
        return new Response('{}', { status: 201 });
      },
    );
    vi.stubGlobal('fetch', fetchMock);
    const onCanonicalRefetch = vi.fn(async () => undefined);
    const { container } = renderCommands(onCanonicalRefetch);

    const createType = container.querySelector<HTMLFormElement>(
      'form[data-operation="TYPE-01"]',
    );
    const removeType = container.querySelector<HTMLFormElement>(
      'form[data-operation="TYPE-02"]',
    );
    if (createType === null || removeType === null)
      throw new Error('relationship mutation forms were not rendered');

    await submit(createType, { typeCode: 'band' });
    await submit(removeType, { assignmentId: 'assignment-s04' });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const postInit = fetchMock.mock.calls[0]?.[1];
    const deleteInit = fetchMock.mock.calls[1]?.[1];
    const postHeaders = new Headers(postInit?.headers);
    const deleteHeaders = new Headers(deleteInit?.headers);
    const bindingId = postHeaders.get(CLIENT_BINDING_ID_HEADER);

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      '/api/v1/organizations/organization-s04/type-assignments',
      '/api/v1/organizations/organization-s04/type-assignments/assignment-s04',
    ]);
    expect(bindingId).toMatch(/^[A-Za-z0-9._:-]{1,128}$/u);
    expect(deleteHeaders.get(CLIENT_BINDING_ID_HEADER)).toBe(bindingId);
    expect(postHeaders.get('authorization')).toBeNull();
    expect(deleteHeaders.get('authorization')).toBeNull();
    expect(postHeaders.get('x-csrf-token')).toBe('csrf-token');
    expect(deleteHeaders.get('x-csrf-token')).toBe('csrf-token');
    expect(postHeaders.get('if-match')).toBe('"7"');
    expect(deleteHeaders.get('if-match')).toBe('"7"');
    expect(onCanonicalRefetch).toHaveBeenCalledTimes(2);
  });

  it('fails closed without sending a mutation when the tab binding is unavailable', async () => {
    Object.defineProperty(navigator, 'locks', {
      configurable: true,
      value: undefined,
    });
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        void input;
        void init;
        return new Response('{}', { status: 204 });
      },
    );
    vi.stubGlobal('fetch', fetchMock);
    const onCanonicalRefetch = vi.fn(async () => undefined);
    const { container } = renderCommands(onCanonicalRefetch);
    const removeType = container.querySelector<HTMLFormElement>(
      'form[data-operation="TYPE-02"]',
    );
    if (removeType === null)
      throw new Error('relationship delete form was not rendered');

    await submit(removeType, { assignmentId: 'assignment-s04' });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(onCanonicalRefetch).not.toHaveBeenCalled();
    expect(container.textContent).toContain(
      'This tab cannot safely submit a relationship command.',
    );
  });
});
