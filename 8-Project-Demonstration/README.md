# Application setup

Use Node.js 24.x. From this folder:

```powershell
npm ci
npm run dev
```

Open http://127.0.0.1:5173. Vite runs on port 5173; the optional local API adapter runs on 3001. Restart after API or environment changes. Use `npm.cmd` if PowerShell blocks `npm.ps1`.

The five main pages are Home, Explore Data, HDI Predictor, Scenarios and Methodology. The cyan website, custom logo, navbar, light/dark modes and creator attribution are preserved. Predictions use the committed model entirely in the browser.

AI Settings accepts a visitor's Groq key, held only in tab memory. Saving does not verify it. Only an explicit explanation request sends it through this site's backend to Groq. Refresh clears it. Core tools need no key. Keep optional owner fallback disabled for public use.

`.env` is private local configuration; `.env.example` is safe to copy. Never prefix credentials with `VITE_`. A credential previously shared in chat or in a populated ZIP must be revoked and replaced at Groq; ignoring a file does not revoke its key.

See [deployment and GitHub instructions](<DEPLOYMENT.md>), [demonstration](<DEMO.md>), [verification](<../6. Project Testing/Performance Testing.md>) and [model card](<../7. Project Documentation/MODEL_CARD.md>).
