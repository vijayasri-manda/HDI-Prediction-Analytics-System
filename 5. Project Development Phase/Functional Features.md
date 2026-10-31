# Implemented functional features

- Explore Data: country/year/region selectors, source-backed summaries, historical comparison, category/search filters, exact indicator/trend tables and filtered JSON export.
- Predictor: country presets, editable numeric inputs/sliders, validation, real estimate/category, formula reference, dimensions, input summary, feature sensitivity, range warning and result export.
- Scenarios: current baseline, independent edited indicators, baseline/scenario predictions, HDI point difference, dimension chart/table and reset.
- AI explanations: contextual questions, optional comparison context, a personal Groq key configured in AI Settings, server-recomputed evidence and explicit loading/error states. Core results remain available when AI fails.
- Methodology: validation candidates, selected-model country holdout metrics, scatter evidence, permutation importance, preprocessing, temporal diagnostic and synthetic audit.
- Shared interface: cyan public website, custom SVG logo/favicon, top navbar, mobile dropdown, hash refresh, light/dark preference, keyboard focus and chart alternatives.

Accounts, database history, admin dashboards, PDF/Excel report exports, policy prescriptions and deployed status are not current features. Their original implementations or claims remain historical. The current export format is JSON.

## Current Phase 3 interface

Home introduces HDI with a cyan hero, three dimensions, source-backed statistics and historical data. Guided predictor fieldsets, comparison panels, contextual AI, metric definitions and reduced-motion transitions share the same design system. The permanent sidebar and profile-style presentation are removed.

AI Settings supports masked entry, show/hide, use/change/remove and connection feedback. The key stays in active-tab memory and is sent to this site's endpoint only for an explicit AI operation. Refresh clears it. The hosting server receives the key; visitors should use only websites they trust. Public visitors do not need an owner access code. Completed functional checks and historical browser evidence are summarized in [verification](<../6. Project Testing/Performance Testing.md>). See the [current demonstration](<../8-Project-Demonstration/DEMO.md>).


## Phase 4 functional repair - 28 October 2026

Year selection now changes both the historical plot and observed indicator summaries. Missing values never become fabricated zero points or interpolated lines. The exact-value table and source link accompany the plot. Current verification covers numerical exports, invalid inputs, baseline/scenario reset, visible chart surfaces, keyboard/mobile controls, theme switching and personal-key states.

See the current verification record in `6. Project Testing` and the updated academic report in folder 7.
