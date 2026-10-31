<div align="center">

<h1>🌍 HDI Intelligence 🌍</h1>
<h3>AI-Powered Human Development Index Prediction &amp; Analytics</h3>

<img src="https://readme-typing-svg.demolab.com?font=Outfit&amp;weight=600&amp;size=23&amp;duration=2700&amp;pause=1100&amp;color=0891B2&amp;center=true&amp;vCenter=true&amp;width=790&amp;height=55&amp;lines=Explore+Global+Development;Predict+HDI+with+Machine+Learning;Compare+Socioeconomic+Scenarios;Understand+Results+with+Groq+AI" alt="Animated typing: Explore global development, predict HDI, compare scenarios, and understand AI insights" />

<p><strong>⚛️ React 19</strong> · <strong>🔷 TypeScript</strong> · <strong>⚡ Vite 7</strong> · <strong>🐍 Python</strong> · <strong>🧠 Machine Learning</strong> · <strong>✨ Groq AI</strong> · <strong>☁️ Vercel-ready</strong></p>

<p><em>A cyan-themed platform that makes human development data easier to explore and understand.</em></p>

</div>

---

## 📖 About the Project

**HDI Intelligence** is an interactive web application for exploring the **Human Development Index (HDI)**, comparing published country-level indicators, and estimating HDI using a trained machine learning model.

HDI summarizes three dimensions of human development:

- ❤️ **Health** — measured using life expectancy.
- 🎓 **Education** — measured using expected and mean years of schooling.
- 💠 **Standard of living** — measured using gross national income (GNI) per capita.

The platform brings together historical data, interactive visualizations, ML-based estimation, hypothetical scenario comparisons, and optional explanations generated through Groq.

> **Important:** The model estimates HDI using same-year indicators. It does **not** forecast future HDI or establish the causal effects of public policy. HDI can also be computed directly using its official formula, which is displayed separately in the application.

## 🧮 How Is HDI Calculated? (Official Formula)

The **Human Development Index (HDI)** combines **health, education, and standard of living** into a single score between **0 and 1**. A higher value indicates higher average achievement across these three dimensions.

The official UNDP method has **two steps**: first convert indicators into comparable dimension indices, then take their **geometric mean**.

### Step 1 — Normalize the indicators

The UNDP Human Development Report 2025 uses these reference minimums and maximums (*goalposts*):

| Dimension | Indicator | Minimum | Maximum |
| --- | --- | ---: | ---: |
| ❤️ Health | Life expectancy at birth (years) | 20 | 85 |
| 🎓 Education | Expected years of schooling | 0 | 18 |
| 🎓 Education | Mean years of schooling | 0 | 15 |
| 💠 Standard of living | GNI per capita (2021 PPP $) | 100 | 75,000 |

**❤️ Health index** — normalize life expectancy (LE):

$$
I_{\text{Health}} = \frac{LE - 20}{85 - 20}
$$

**🎓 Education index** — normalize expected years of schooling (EYS) and mean years of schooling (MYS), then average them:

$$
I_{\text{Education}} = \frac{1}{2}\left(\frac{EYS}{18} + \frac{MYS}{15}\right)
$$

**💠 Income index** — normalize GNI per capita using a natural logarithm:

$$
I_{\text{Income}} = \frac{\ln(GNI_{pc}) - \ln(100)}{\ln(75000) - \ln(100)}
$$

The logarithm reflects **diminishing returns**: an extra dollar of income has a smaller effect on the index at higher income levels. UNDP applies the defined goalposts when constructing indices.

### Step 2 — Combine the three dimensions

The final HDI is the **geometric mean**, not the arithmetic average:

$$
\boxed{HDI = \left(I_{\text{Health}} \times I_{\text{Education}} \times I_{\text{Income}}\right)^{1/3}}
$$

### 🔍 Worked example — Benin (2023)

The UNDP 2025 technical note gives this **published example**, using rounded input values:

| Indicator | Value |
| --- | ---: |
| Life expectancy | 60.8 years |
| Expected years of schooling | 10.4 years |
| Mean years of schooling | 3.2 years |
| GNI per capita | 3,806 (2021 PPP $) |

1. **Health index:** `(60.8 − 20) / 65` ≈ **0.628**
2. **Education index:** `[(10.4 / 18) + (3.2 / 15)] / 2` ≈ **0.396**
3. **Income index:** `[ln(3806) − ln(100)] / [ln(75000) − ln(100)]` ≈ **0.550**
4. **Final HDI:** `(0.628 × 0.396 × 0.550)^(1/3)` ≈ **0.515**

**What does 0.515 mean?** Under the standard HDI classification thresholds, it falls in the *low human development* range.

| HDI range | Classification |
| --- | --- |
| 0.800–1.000 | Very high human development |
| 0.700–0.799 | High human development |
| 0.550–0.699 | Medium human development |
| Below 0.550 | Low human development |

> **Official formula vs. machine learning:** The formula above **calculates HDI directly** from its defined components. This project's **Linear Regression model estimates HDI** from data. The website shows the two approaches separately so visitors can understand and compare them. Neither method, by itself, predicts future economic or policy outcomes.

**Methodology:** [UNDP Human Development Report 2025 — Technical Note 1](https://hdr.undp.org/sites/default/files/2025_HDR/hdr2025_technical_notes.pdf).

## ✨ Key Features

| Feature | Description |
| --- | --- |
| 🏠 **Home** | Clear introduction to HDI, its three dimensions, and the project. |
| 🌐 **Explore Data** | Browse published country data, compare HDI trends, filter observations, and export selected results. |
| 🧠 **HDI Predictor** | Estimate HDI using trained Linear Regression and validated socioeconomic inputs. |
| 🔄 **Scenario Analysis** | Compare baseline and modified indicators to explore hypothetical changes in estimated HDI. |
| 📊 **Model & Methodology** | Explore the data pipeline, evaluation metrics, official formula, and limitations. |
| ✨ **AI Insights** | Get optional explanations using Groq with your own API key. |
| 📱 **Responsive Design** | Cyan-themed interface with mobile-friendly navigation and light/dark modes. |

## 📊 Dataset & Machine Learning

The current model uses a prepared snapshot of **UNDP Human Development Report 2025** data, containing complete observations covering **1990–2023**.

| 🌍 Countries | 📅 Country-year records | 🧠 Selected model |
| :---: | :---: | :---: |
| **193** | **5,940** | **Linear Regression** |

The project compares regression algorithms with **country-separated validation** and evaluates the selected model on held-out countries.

### 📈 Reported held-out results

| Metric | Value |
| --- | ---: |
| Mean Absolute Error (MAE) | **0.0044** |
| Root Mean Squared Error (RMSE) | **0.0067** |
| R² | **0.9982** |

These are results from the project evaluation artifacts, not a promise of performance on every future input. **R² is not a percentage accuracy measure.** The official formula is a more direct method of calculating HDI from the defined components.

### ⚙️ How it works

1. **Prepare data** — process the country-year observations and required indicators with Python.
2. **Train and compare** — evaluate regression methods with country-separated splits.
3. **Export the model** — provide the selected model parameters for JavaScript inference.
4. **Predict locally** — calculate HDI estimates in the web application without a continuously running Python server.
5. **Explore and explain** — compare hypothetical scenarios and optionally request an AI explanation.

## 🛠️ Technology Stack

| Area | Technologies |
| --- | --- |
| **Frontend** | React 19, TypeScript, Vite 7 |
| **UI & visualization** | Tailwind CSS, Recharts, Lucide icons |
| **Data and model development** | Python, Pandas, NumPy, scikit-learn |
| **Inference** | JavaScript-based model inference in the website |
| **Optional AI explanations** | Groq API via a Vercel serverless function |
| **Testing** | TypeScript checks, ESLint, Node tests, Playwright |
| **Hosting target** | Vercel |

The active application **does not require Flask, MySQL, Render, or a permanently running backend** for HDI predictions.

## 📁 Project Structure

The repository preserves eight numbered folders for the internship project lifecycle:

```text
HDI-Prediction-Analytics-System/
├── 1. Brainstorming & Ideation/
├── 2. Requirement Analysis/
├── 3. Project Design Phase/
├── 4. Project Planning Phase/
├── 5. Project Development Phase/
├── 6. Project Testing/
├── 7. Project Documentation/
├── 8-Project-Demonstration/
│   ├── api/           # Optional Groq API function
│   ├── ml/            # Python ML training workflow
│   ├── public/        # Required app assets and data
│   ├── shared/        # Shared inference logic
│   ├── src/           # React application
│   ├── tests/         # Project tests
│   └── package.json
└── README.md
```

## 🚀 Run Locally

**Requirements:** Node.js 24.x and npm. Python is optional for running the website; it is needed for retraining.

```powershell
git clone https://github.com/meenamahanth/HDI-Prediction-Analytics-System.git
cd HDI-Prediction-Analytics-System
cd "8-Project-Demonstration"
npm ci
npm run dev
```

Open **http://127.0.0.1:5173** in your browser.

### Useful commands

Run from the `8-Project-Demonstration` folder:

```powershell
npm run dev           # Start the local application
npm run typecheck     # Validate TypeScript
npm run lint          # Lint source files
npm test              # Run Node inference and API tests
npm run test:browser  # Run browser tests
npm run build         # Generate production output in dist/
```

## 🔑 Groq AI — Use Your Own API Key

Groq is **optional**. The dashboard, data explorer, predictions, and scenario analysis work without a key.

1. Obtain a Groq API key from your Groq account.
2. Click the **🔑 key icon** in the website's top navigation.
3. Enter the key in **AI Settings** and enable it for the current tab.
4. Request an explanation from a prediction or scenario result.
5. Change or remove the key whenever needed.

**Privacy:** The key is held in the current browser tab's memory and is sent to the site's serverless endpoint only for an AI request. The serverless endpoint receives it to contact Groq. Enter keys only on websites you trust; do not put keys in GitHub commits, screenshots, or public environment variables.

AI responses may be unavailable if a key is invalid, rate-limited, or the provider is unavailable. Core ML inference continues to work independently.

## ☁️ Vercel Deployment

Connect the GitHub repository to a new Vercel project with these settings:

| Setting | Value |
| --- | --- |
| **Framework** | Vite |
| **Root Directory** | `8-Project-Demonstration` |
| **Install Command** | `npm ci` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

The optional Groq function uses server-side configuration. In production, set `APP_ORIGIN` to your actual HTTPS website origin and keep `ALLOW_OWNER_AI=false` if visitors must supply their own keys. A shared `GROQ_API_KEY` is **not required** for bring-your-own-key access.

> **Deployment status:** The repository is configured for Vercel. A public deployment should be tested separately after it goes live.

## ⚠️ Project Limitations

- The dataset is a fixed historical snapshot, not a continuously updated live feed.
- Same-year HDI reconstruction is not the same as forecasting future national development.
- Scenario results show how the model responds to changed inputs; they do not demonstrate causation.
- Missing observations must not be replaced with invented values.
- AI explanations may be incorrect and must not replace the verified numerical results.

---

<div align="center">

<h3>💠 Making human development data easier to understand</h3>
<p><em>Developed during an Artificial Intelligence &amp; Machine Learning virtual internship organized by SmartBridge Educational Services Pvt. Ltd. in collaboration with APSCHE.</em></p>

</div>
