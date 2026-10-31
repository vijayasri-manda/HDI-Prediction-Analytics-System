# GitHub and Vercel handoff

The active application is only in `8-Project-Demonstration`. No push or deployment is authorized by this cleanup. Node.js 24.x is pinned in package.json and the lockfile. The site needs no Flask, Render, database, Python runtime or server-owner Groq key.

## Preserve the existing GitHub history

Run the following from the cleaned repository root in Windows PowerShell. It creates a **new sibling clone and branch**; it does not initialize or replace this archive's history. Keep the local historical ZIP separately. The mirror operation is restricted to the eight numbered folders in the new clone and removes obsolete files there. Other root repository configuration remains for review.

```powershell
$clean = (Get-Location).Path
$publish = Join-Path (Split-Path $clean -Parent) "HDI-Prediction-Analytics-System-publish"
if (Test-Path -LiteralPath $publish) { throw "Choose an unused clone directory." }
$folders = @(Get-ChildItem -LiteralPath $clean -Directory | Where-Object Name -Match '^[1-8]\. ')
if ($folders.Count -ne 8) { throw "Run from the cleaned project root." }
git clone https://github.com/meenamahanth/HDI-Prediction-Analytics-System.git "$publish"
if ($LASTEXITCODE -ne 0) { throw "Clone failed." }
Set-Location -LiteralPath $publish
git switch -c cleanup-vercel-ready
if ($LASTEXITCODE -ne 0) { throw "Branch creation failed." }
foreach ($folder in $folders) {
    $target = [IO.Path]::GetFullPath((Join-Path $publish $folder.Name))
    if (-not $target.StartsWith($publish + '\')) { throw "Unsafe mirror destination." }
    robocopy $folder.FullName $target /MIR /R:1 /W:1 /NFL /NDL /NJH /NJS /XD node_modules dist test-results playwright-report .vercel __pycache__ .venv /XF .env .env.* *.tsbuildinfo *.log "Historical project backup.zip"
    if ($LASTEXITCODE -ge 8) { throw "Copy failed: $($folder.Name)" }
}
Copy-Item -LiteralPath (Join-Path $clean 'README.md') -Destination .
Copy-Item -LiteralPath (Join-Path $clean '.gitignore') -Destination .
Copy-Item -LiteralPath (Join-Path $clean '8-Project-Demonstration/.env.example') -Destination '8-Project-Demonstration/.env.example'
git rm -r --ignore-unmatch -- docs tools
git ls-files | Where-Object { $_ -match '(^|/)\.env($|\.)' -and $_ -notmatch '(^|/)\.env\.example$' } | ForEach-Object { git rm -f -- $_ }
git add --all
git status --short
git diff --cached --stat
python '8-Project-Demonstration/scripts/audit-repository.py' --staged
if ($LASTEXITCODE -ne 0) { throw "Resolve the audit findings before committing." }
```

Inspect staged changes locally with `git diff --cached` after the sanitized credential audit passes. Do not paste secret-bearing diffs into chat. Confirm that `.env`, generated output and the local ZIP are absent. If a credential was previously tracked, rotation is still required; this normal commit preserves old history rather than rewriting it.

After review, publish the new branch and open a pull request into the repository's existing default branch:

```powershell
git commit -m "Clean project structure and prepare Vercel deployment"
git push -u origin cleanup-vercel-ready
```

Merge the pull request through GitHub when satisfied. Do not force-push. If the repository is already connected to Vercel, pushing a branch can trigger an automatic preview deployment; disable automatic deployments first if you want to defer that.

## Import into Vercel

In Vercel choose **Add New > Project**, connect GitHub and import `meenamahanth/HDI-Prediction-Analytics-System` after the reviewed branch has been merged (or explicitly select the intended branch).

| Setting | Exact value |
| --- | --- |
| Root Directory | `8-Project-Demonstration` |
| Framework Preset | Vite |
| Node.js Version | 24.x |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

The `api/insights.mjs` function is deployed separately from `dist`. `vercel.json` includes `public/data/model.json`; its relative shared-module import supplies `shared/inference.mjs`. Required frontend JSON and logo live under public and are copied by Vite. Hash routes need no catch-all rewrite over `/api`.

## Production environment variables

| Variable | Value |
| --- | --- |
| `APP_ORIGIN` | Exact final site origin, e.g. `https://your-project.vercel.app`, with no trailing slash or path |
| `ALLOW_OWNER_AI` | `false` |
| `GROQ_MODEL` | `openai/gpt-oss-20b` (optional; default in code) |

Leave `GROQ_API_KEY` and `AI_ACCESS_TOKEN` unset for the public BYOK site. Do not upload `.env` or add `VITE_` credentials. Visitors supply their own keys in AI Settings. They must have Groq access to the configured model.

If the final domain is not known before the first deployment, deploy the static website first, then set APP_ORIGIN to its actual HTTPS origin and redeploy. Until the exact origin is configured, the AI endpoint intentionally returns a configuration/origin error; numerical tools still work. A custom domain requires that origin instead. Preview URLs need separate matching Preview environment settings; a production origin does not authorize arbitrary previews. Environment changes apply to subsequent deployments, so redeploy after edits.

Click **Deploy** yourself after reviewing settings. Then check `/`, `/#explore`, `/#predict`, `/#scenarios`, `/#evaluation`, JSON assets and a genuine personal-key explanation. Verify missing/invalid-key states and that removing/refreshing clears the browser key. Do not capture credentials in screenshots or logs.

## Local verification and limits

From folder 8: `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run test:browser`, `npm run test:production`. Use installed Google Chrome for Playwright. Current results are in [folder 6](<../6. Project Testing/Performance Testing.md>). Generated dist and test-results may be removed after checking.

Vercel CLI was not installed and no linked project configuration was present during cleanup, so no authentic `vercel build` or hosted execution is claimed. After linking your actual project, the optional non-deploying CLI check is `vercel pull --yes --environment=production` followed by `vercel build --prod`. Keep pulled secrets in ignored `.vercel` files. Do not confuse `vercel build` with `vercel` or `vercel deploy`, which publish.

Official references: [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite), [Node versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions), [Node function runtime](https://vercel.com/docs/functions/runtimes/node-js), [local Vercel build](https://vercel.com/docs/cli/build), [environment variables](https://vercel.com/docs/environment-variables).
