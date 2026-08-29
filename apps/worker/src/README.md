# Worker composition

`index.ts` composes versioned routes, middleware, Queue consumers, and scheduled handlers. Transport modules validate contracts and call application use cases; they do not own SQL, business invariants, or provider-shaped canonical data.

Middleware order is correlation, security headers, body and size limits, authentication, acting context, authorization, validation, idempotency, and observability. Public readiness responses remain sanitized.
