# Verification record - final cleanup

Checked on 28 October 2026. The cleanup preserves the finished cyan website and existing model; no retraining, push or deployment was performed. Machine-readable results are in [verification.json](<verification.json>).

| Check | Final cleanup result |
| --- | --- |
| Dependency installation | `npm ci` passed; package and lockfile both pin Node 24.x |
| TypeScript | Passed |
| ESLint | Passed, including a final check of modified report helpers and deployment test |
| Numerical and API tests | 22 passed; 1,407 parity cases, maximum error 2.220446049250313e-16 |
| Production build | Standard `npm run build` passed: Vite 7.3.7, 2,182 modules |
| Chrome functional suite | 11 passed: charts, mobile/desktop, themes, accessibility, exports and personal-key state |
| Production Chrome check | 1 passed: built assets, hash-route refresh and offline predictions/scenarios |
| Protected scientific artifacts | All 11 retained data, training and inference files match the earlier protected hashes |
| Static assets | All five built JSON assets match their committed public sources |
| API dependency isolation | Endpoint imports and reads its model with only the API, shared inference module and model JSON present |
| Academic report | 32 PDF pages rendered with installed Firefox PDF.js and reviewed; linked images and HTML overflow checks passed |

The initial standard build was blocked by Windows sandbox permissions while Vite loaded its config. A native-loader build passed within the sandbox; the standard build subsequently passed after automatic approval became available. This was an environment limitation, not an application fix. Production browser verification used the native config loader for the preview server and the same production assets.

## Preserved evidence

[report-evidence.json](<report-evidence.json>) consolidates the earlier Phase 4 verification and capture states. Eight useful screenshots remain directly in this folder. Earlier detailed logs, original screenshots and historical reports are preserved in the private, Git-ignored backup ZIP in folder 7; no new screenshots are presented as earlier evidence.

## Deployment and security limits

Vercel config explicitly includes the server model. The shared inference module is a static relative import. The isolation test checks these dependencies locally, but does not establish actual Vercel bundle contents. Vercel CLI was unavailable and no linked project existed, so authentic Vercel packaging and hosted execution remain to be checked.

Groq request validation and personal-key behavior are tested with explicit fixtures. No live Groq request was made during cleanup. Rotate any credential previously shared in chat or a populated ZIP. `.env` is preserved privately and ignored; `.env.example` has no real credential. The repository audit examines an isolated Git index of files that would be staged, without printing secret values.

Final Git-candidate audit passed: exactly eight root folders, flat folders 1-7, no broken links, no credential-like values or forbidden staged files. All 262 backup entries match their stored hashes. Generated build/test outputs were removed after recording results.

Current setup and exact history-preserving Git/Vercel instructions are in [DEPLOYMENT.md](<../8-Project-Demonstration/DEPLOYMENT.md>). Chrome tests are not universal device or human accessibility certification. The instance-local AI throttle does not provide distributed quotas.
