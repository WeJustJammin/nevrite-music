import {
  CONTENT_SCHEMA_REGISTRY_LOADING_DELAY_MS,
  executeContentSchemaRegistryMutation,
} from './content-schema-registry-runtime';
import { completeContentSchemaRegistryMutation } from './content-schema-registry-runtime-dom-mutation-complete';
import {
  announce,
  setFormBusy,
} from './content-schema-registry-runtime-dom-feedback';

/** Progressive enhancement for native forms; no-JS remains fully usable. */
export const installContentSchemaRegistryCommandEnhancement = (
  document: Document,
  options: {
    readonly navigate?: (target: string) => void;
  } = {},
): (() => void) => {
  const windowObject = document.defaultView;
  if (windowObject === null) return () => undefined;
  const forms = [
    ...document.querySelectorAll<HTMLFormElement>('[data-cms-command-form]'),
  ];
  const timers = new Set<number>();
  const listeners = forms.map((form) => {
    const listener = (event: SubmitEvent): void => {
      event.preventDefault();
      if (form.getAttribute('aria-busy') === 'true') return;
      const operationId = form.dataset.operationId ?? 'unknown';
      const formData = new FormData(form);
      setFormBusy(form, true);
      const loadingTimer = windowObject.setTimeout(
        () => announce(form, 'Checking the current schema…'),
        CONTENT_SCHEMA_REGISTRY_LOADING_DELAY_MS,
      );
      timers.add(loadingTimer);
      void executeContentSchemaRegistryMutation({
        action: form.action,
        operationId,
        formData,
      }).then((result) => {
        windowObject.clearTimeout(loadingTimer);
        timers.delete(loadingTimer);
        completeContentSchemaRegistryMutation(
          form,
          result,
          windowObject,
          timers,
          options.navigate,
        );
      });
    };
    form.addEventListener('submit', listener);
    return { form, listener };
  });
  return () => {
    for (const timer of timers) {
      windowObject.clearTimeout(timer);
      windowObject.clearInterval(timer);
    }
    for (const { form, listener } of listeners)
      form.removeEventListener('submit', listener);
  };
};
