# Active code layout

```text
8-Project-Demonstration/
  src/                  Public React website, page modules, controls, CSS, types
    Navbar.tsx          Desktop top navigation and mobile dropdown
    AIContext.tsx       Active-tab personal key and request cancellation
    AISettings.tsx      Personal-key dialog, privacy notice and status
    useReducedMotion.ts Motion preference for charts and interactions
  shared/inference.mjs  Schema, validation, transformations, estimator, formula
  api/insights.mjs      Personal-key Groq gateway with recomputed model evidence
  scripts/dev.mjs      Local Vite and API adapter
  ml/                  Existing trainer, pinned requirements, verified download
  public/data/         Model, observations, evaluation and parity fixtures
  public/hdi-logo.svg   Original three-dimension brand mark and favicon
  data/                Required training datasets and official processed panel
  tests/               Preserved Node and browser test files
  vercel.json          Static build and Node function configuration
```

Current technical documentation and historical records live in phase 7; preserved test evidence and screenshots live in phase 6. Phase 8 contains setup and deployment instructions. The eight numbered folders remain the visible root layout; no root `docs` or `tools` directory is recreated. Historical source does not participate in the frontend build or Vercel upload. The obsolete Flask application is preserved only in the private historical backup in folder 7.


## Phase 4 functional repair - 28 October 2026

New maintenance helpers in phase 8: scripts/capture-report.mjs captures the real, credential-free application states used by the report; scripts/build-academic-report.mjs generates the revised PDF and editable HTML from verified artifacts and evidence. Tests include tests/browser/visualizations.spec.ts and current BYOK fixtures. These helpers do not retrain models or deploy the site.

See the current verification record in `6. Project Testing` and the updated academic report in folder 7.
