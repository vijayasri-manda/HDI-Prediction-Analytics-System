# Readability and reusability

Reusable semantic controls and result cards live in `src/components.tsx`; shared domain types live in `src/types.ts`. Prediction, validation, formula and sensitivity logic are centralized in `shared/inference.mjs` so browser and API cannot silently diverge. The API exposes a handler factory with injected environment, fetch, clock and limiter state for meaningful failure-path tests.

Training is path-independent and seeded. Source and evaluation hashes identify the release. Numeric fixtures compare independent Python predictions against JavaScript. CSS uses consistent tokens, responsive breakpoints and reduced-motion support. Prettier formats the active JavaScript/TypeScript/CSS; ESLint and TypeScript check it. The archived code is excluded from active lint/build/deployment.

When modifying features, update the source schema, training feature order, types, parity fixtures, endpoint tests and model card together. When changing source data, review the checksum and coverage; never silently replace official observations with synthetic records.
