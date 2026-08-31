# Domain modules

Pure invariants and state machines live under `packages/domain/<domain>`. They may depend on runtime contracts and pure value objects, but never on Cloudflare, Supabase, browser APIs, provider SDKs, or transport response models.
