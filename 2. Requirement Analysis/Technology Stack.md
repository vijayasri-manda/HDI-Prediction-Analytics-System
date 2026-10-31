# Current technology stack

| Layer | Technology | Role |
| --- | --- | --- |
| Interface | React 19, TypeScript, Vite 7 | Public website, hash routes and shared prediction state |
| Design | Tailwind 4 and centralized custom CSS | Cyan light/deep-teal dark themes, responsive layouts and focus styles |
| Branding / motion | Original SVG logo, CSS transitions, reduced-motion hook | Shared favicon/brand and lightweight interaction effects |
| Charts / icons | Recharts and Lucide | Interactive analytical charts, controls and tabular alternatives |
| Training | Python, NumPy, Pandas, scikit-learn | Existing reproducible regression experiment; unchanged in Phase 3 |
| Inference | Exported estimator JSON and shared JavaScript | Genuine browser/API calculations without a persistent ML server |
| AI | Groq via Vercel Node function | Explicit request-scoped personal key; default openai/gpt-oss-20b |
| Credential state | Browser-tab memory | Key replacement/removal and refresh clearing; no storage persistence |
| Existing validation tools | TypeScript, ESLint, Node test, Playwright, axe | Preserved tooling and prior evidence; not run for Phase 3 |
| Hosting | Vercel static output and Node API | Root 8-Project-Demonstration, output dist |

Exact package versions remain in package-lock.json and ml/requirements.txt. No additional animation library or package installation is needed for this redesign. Linear regression remains the selected model; Flask, SQLAlchemy, MySQL, Docker and Render belong to the preserved archive.
