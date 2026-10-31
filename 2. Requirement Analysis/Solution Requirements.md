# Current solution requirements

These requirements describe the finished public website. Original internship records are preserved in the private historical backup in folder 7. Current verification and its limits are recorded in folder 6.

| ID | Requirement | Implemented behavior / acceptance target |
| --- | --- | --- |
| FR1 | Explore traceable published data | Country/year/region selection, exact records, comparisons, trends and JSON export; missing years are explicit |
| FR2 | Genuine model inference | Existing exported estimator and four validated inputs; no retraining or hardcoded scores |
| FR3 | Explain calculated results | Category, dimensions, formula reference, sensitivity and range warnings |
| FR4 | Compare scenarios | Separate baseline and edited indicators, hypothetical differences and reset |
| FR5 | Optional personal-key AI | AI Settings, masked key, explicit generate request and server-recomputed evidence |
| FR6 | Evaluation transparency | Existing model selection, holdout metrics, formula and temporal context |
| UX1 | Public website identity | Cyan design system, original SVG logo, top navbar and no permanent sidebar/profile block |
| UX2 | Clear navigation | Home, Explore Data, HDI Predictor, Scenarios and Methodology; compact mobile dropdown |
| UX3 | Responsive and accessible controls | Fluid layouts, touch targets, keyboard focus, dialog dismissal, chart alternatives and reduced motion |
| SEC1 | Per-visitor key isolation | Active-tab memory only; no credential storage, URL parameters, analytics or console output |
| SEC2 | Transparent proxy use | Explicit AI request sends X-Groq-API-Key to this site's endpoint; hosting server receives it and calls Groq |
| SEC3 | Protected API boundary | Exact origin, HTTPS deployment, bounded JSON/input/question, timeout, throttling, response redaction and no-store |
| SEC4 | No silent owner usage | Owner fallback disabled unless explicitly enabled and protected by a strong access token; no public owner-code UI |
| NFR1 | Independent core features | Exploration, prediction and scenarios do not depend on Groq or a personal key |
| NFR2 | Deployment compatibility | Active app in phase 8; Vercel Vite build to dist and optional Node function |
| NFR3 | Preserve reproducibility | Existing source data, model, split records, metrics and parity fixtures remain unchanged |

Saving a key configures local state; it does not verify Groq access. Refreshing clears the key. Replacing/removing it cancels pending browser work and clears the answer, but cannot retract a request already sent upstream. The visitor must be told to enter credentials only on a trusted site. No accounts, database history, future forecasts or causal policy outcomes are promised.


## Phase 4 functional repair - 28 October 2026

Historical plots must have a nonzero drawing viewport, readable axes and real points. Observation year limits the trend through that year; missing calendar years remain null gaps. One-year ranges show points, duplicate country selections show one series, and unavailable ranges show an explicit empty state. Exports match visible table filters. Personal-key behavior must be verified with clearly identified fixtures; live-provider success is a separate claim.

See the current verification record in `6. Project Testing` and the updated academic report in folder 7.
