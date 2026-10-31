# Implementation

## Phase 3 public website and personal-key AI

The current interface uses a compact top navbar, an original SVG logo/favicon and centralized cyan design tokens. Home, Explore Data, HDI Predictor, Scenarios and Methodology replace the workspace-style presentation. Mobile navigation opens as a dropdown. CSS transitions and the reduced-motion hook keep motion optional.

`AIContext.tsx` keeps each visitor's key in tab memory. `AISettings.tsx` provides a masked native dialog with show/hide, use/change/remove controls and status feedback. Saving a key makes no provider request. `Insights.tsx` sends `X-Groq-API-Key` only when the visitor explicitly generates an explanation. Replacement/removal cancels pending browser work and clears the answer; an already transmitted request cannot be recalled. Refresh clears the key. Theme preference is stored separately.

The hosting server receives the visitor's key, validates the request and uses that credential only for that Groq operation. Production requires an explicit HTTPS `APP_ORIGIN`. Public BYOK needs no owner code; optional owner fallback requires `ALLOW_OWNER_AI=true`, a server key and a valid strong `X-AI-Access-Token`, including locally. The public UI has no owner-code field. The default model is `openai/gpt-oss-20b`. The application does not persist or log credentials and redacts credential-like strings from responses.

Phase 3 changed presentation and the optional AI credential flow. Model training, inference and numerical artifacts remain unchanged. Subsequent functional verification is recorded in folder 6; the final cleanup does not change the interface or numerical implementation.

Training reads the pinned UNDP CSV, selects complete country-years, transforms income with the natural logarithm and compares four regressors using country-disjoint validation. The selected model is refit on development countries and evaluated on unseen countries. Artifacts include source hash, split ISO lists, real metrics and Python parity predictions.

The shared JavaScript evaluator preserves feature order and preprocessing. For linear regression it evaluates coefficients/intercept and clips to [0,1]. A tree evaluator is also available for future validation-selected tree artifacts and uses float32 inputs at split boundaries, matching scikit-learn. The current estimator is linear regression.

React holds draft inputs, a committed prediction baseline and scenario values separately. Numeric errors prevent inference; dirty drafts keep a visible stale-result notice. Data exploration uses observed records only; metrics and explanations have their own semantics. Text is escaped by React, including AI output.

The Groq endpoint validates method, content type, origin, per-request credentials, size, numeric schema and question length. It ignores submitted prediction values, recomputes scores, sets no-store, bounds output and fails gracefully. Existing timeout and instance-local throttling remain; no distributed rate-limit guarantee is claimed. No personal or owner key is bundled into Vite.

Local development uses Node; production is Vercel static hosting plus the function. No Render or running Python service is required. Exact commands are in the root README.


## Phase 4 functional repair - 28 October 2026

The blank chart had valid SVG paths but a zero-width drawing surface. Removing `.recharts-wrapper { max-width: 100%; }` lets Recharts use its measured pixel width. Trend.tsx also handles throughYear, missing calendar years, finite [0,1] observations, single-year point markers, same-country comparisons, unique gradients and empty states. The API rejects whitespace-only questions. The model, inference and training pipeline are unchanged.

See the current verification record in `6. Project Testing` and the updated academic report in folder 7.
