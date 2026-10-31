# Model card: HDI reconstruction

## Intended use

Educational demonstration of regression, data validation, model export, grouped evaluation and explainability. Not a forecast, causal policy model, official UNDP estimate or replacement for the official formula.

## Data provenance

- Source: UNDP Human Development Report 2025; [official CSV](https://hdr.undp.org/sites/default/files/2025_HDR/HDR25_Composite_indices_complete_time_series.csv). Downloaded during modernization on 27 October 2026 (Asia/Kolkata).
- Encoding: Windows-1252 in the official snapshot; exported app data is UTF-8.
- SHA-256: `61ed82e5b66c88dfca8ff9fac775c63981ecab6a254862af97acacc41c143117`.
- 5,940 complete rows, 193 countries, 1990–2023; 622 excluded incomplete country-years.
- The country rank field plus three-letter ISO codes excludes regional/development aggregates. Complete-case coverage may favor better measured countries/years. This release contains reported estimates and historical revisions; it is not unrevised real-time data.
- Source history and current model predictions have different meanings. UNDP is credited in the UI; source reuse terms remain those of the publisher.

## Inputs and preprocessing

| Feature | Unit | Accepted input range | Transform |
| --- | --- | --- | --- |
| Life expectancy | Years at birth | 20–95 | Identity |
| Expected schooling | Years for a school-entry child | 0–25 | Identity |
| Mean schooling | Years, adults 25+ | 0–20 | Identity |
| GNI per capita | Constant 2021 PPP dollars | 100–200,000 | Natural logarithm |

Raw training features are not rounded. UI presets are rounded to two decimals and explicitly labeled. Inference requires all inputs; no imputation or scaling is used. Mean schooling may exceed expected schooling because these refer to different cohorts. Training min/max ranges are recorded in `model.json`; the UI warns on inputs outside them. Broad valid ranges do not establish model reliability for unusual combinations. Predictions are clipped to [0,1] in both evaluation and JavaScript.

## Model selection and evaluation

Compared linear regression, decision tree, random forest and Extra Trees. Outer `GroupShuffleSplit` (seed 42) holds out 20% of countries. Inner grouped split (seed 43, 25% of the remaining groups) supplies validation. This yields 3611 training, 1178 validation and 1151 test rows. Group counts and ISO memberships are committed in `evaluation.json`.

**Selected: Linear regression**, by minimum validation MAE. The winner is refit on train + validation, then tested once on held-out countries. No selection uses test scores. Linear regression with log income was more effective than the evaluated tree candidates on validation; retaining Extra Trees by assumption would be scientifically inappropriate.

| Evaluation | MAE | RMSE | R² |
| --- | ---: | ---: | ---: |
| Country-disjoint test | 0.004404 | 0.006670 | 0.998183 |
| Direct formula on same test rows | 0.000247 | 0.000286 | 0.999997 |
| 2019–2023 temporal diagnostic | 0.004257 | 0.006712 | 0.998006 |


Temporal diagnostic trains through 2018 and evaluates 2019–2023 with contemporaneous indicator inputs. The chosen architecture is fixed, but it was selected using the full-period development countries; this diagnostic is not a pristine model-selection temporal holdout or an ex-ante forecast.

HDI is mathematically defined from the same predictors, so high R² largely measures recovery of an index. Direct formula error is mostly compatible with the source HDI being reported to three decimals. Country grouping reduces repeated-country leakage but does not remove cross-country dependence. No confidence intervals or calibrated forecast uncertainty are claimed.

## Export, explanations and reproduction

The selected estimator is exported as a coefficient/intercept JSON artifact. Both JavaScript and Python use natural log of GNI. 1407 parity cases include held-out rows and seeded random combinations; split-adjacent cases are also generated if a tree is selected. The active linear model has no split thresholds. Browser/Node comparisons use a 1e-12 tolerance. JSON inference avoids an ONNX/WASM dependency for a very small estimator.

Local feature sensitivity replaces one feature at a time with its development-training median and measures the resulting prediction difference. These values do not sum to the prediction and are not SHAP or causal effects. Global permutation importance is mean increase in held-out MAE over eight repeats, with standard deviation. Correlated features complicate interpretation.

Training versions: python 3.13.16, numpy 2.5.4, pandas 3.1.0, sklearn 1.9.1. Run `ml/train.py` using `ml/requirements.txt`, then the Node test suite. The original pickle is archived in the local historical backup and is never loaded by the current application.

## Original synthetic experiment

The original generator uses 30 country baselines, four invented peers for each, ten years and noisy formula targets. Regional clones share their original country family. Its education cap clips the combined education index rather than each component separately; that differs from the current reference implementation for above-goalpost inputs. Its random row split and test-score model selection inflate apparent generalization; old XAI weights are scaled heuristic deviations.

The new audit retrains a four-component Extra Trees comparator (96 trees, seed 42). It is explicitly **not** exact reproduction of the original seven-numeric-plus-region pipeline. Random-row MAE is 0.004405; country-family grouped MAE is 0.010036. The original claimed score is retained only as historical metadata, not displayed as current performance.
