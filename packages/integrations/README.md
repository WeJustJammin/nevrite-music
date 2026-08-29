# Integration adapters

Provider adapters live under `packages/integrations/<provider>` and implement application ports using versioned provider contracts. Provider payloads never become canonical domain models, and secrets never cross an adapter boundary.
