# Demonstration

From the repository root, run:

```powershell
cd "8-Project-Demonstration"
npm ci
npm run dev
```

Use Node.js 24.x and open http://127.0.0.1:5173. On Windows, `npm.cmd` avoids PowerShell script-policy issues.

1. Home: explain the published India summary and the three HDI dimensions.
2. Explore Data: select Cyprus and China, then change the year. Show real curves, the exact-value table, region/search filters and exported observations. Missing data remains unavailable.
3. HDI Predictor: load a country, change an indicator, calculate, compare the model with the direct formula and export the result.
4. Scenarios: change life expectancy or schooling, compare baseline/result and reset. This is hypothetical comparison, not a causal forecast.
5. Methodology: show the committed evaluation metrics, country-separated validation and source limitations.
6. AI Settings: demonstrate the empty masked field. Use a newly issued personal key only when intentionally requesting a live explanation; never capture the key. Saving means configured, not connected. Remove it or refresh to clear it.
7. Check the mobile navbar and light/dark themes.

Actual report captures and current check results are directly in [folder 6](<../6. Project Testing>). The [academic report](<../7. Project Documentation/HDI_Project_Documentation.pdf>) is the current 22-page project document. No new live Groq request or Vercel deployment is implied by this local demonstration.
