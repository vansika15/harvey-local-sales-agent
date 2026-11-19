# Harvey Local Sales Agent

> **Autonomous, zero-cost, multi-product AI sales agent running 100% on open-weight models via Ollama. Built for EDXSO AI Engineer Intern Assignment 2.**

[![Zero LLM Cost](https://img.shields.io/badge/Cost-$0.00-emerald.svg)](COST_AND_DEPENDENCY_STATEMENT.md)
[![Local Inference](https://img.shields.io/badge/Inference-100%25%20Local%20(Ollama)-blue.svg)](TECHNICAL_DOCUMENTATION.md)
[![Model License](https://img.shields.io/badge/Model-Qwen%202.5%20(Apache--2.0)-purple.svg)](MODEL_LICENCES.md)
[![Tests](https://img.shields.io/badge/Tests-20%2F20%20Passed-brightgreen.svg)](TEST_EVIDENCE.md)
[![Offline Verified](https://img.shields.io/badge/Offline-100%25%20Verified-success.svg)](OFFLINE_TEST_REPORT.md)
[![Base License](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)

---

## 1. Project Overview & Zero-Cost Architecture

Harvey Local Sales Agent is a complete multi-tenant, multi-product outbound intelligence platform re-engineered from the ground up to operate with **Zero Cloud LLM Cost**.

### Strict Constraint Compliance:
- **No OpenAI, Anthropic, Claude, or Gemini APIs.**
- **No paid enrichment services (Apollo, ZoomInfo, Clay).**
- **No per-token billing or cloud-hosted fallback mechanisms.**
- **All AI inference runs locally on the user's host hardware via Ollama and Qwen 2.5.**
- **Full offline resilience:** After model download, disconnect the internet and all eight sales intelligence workflows continue to execute seamlessly.

---

## 2. All Eight Mandatory AI Workflows

1. **Business Profile Generation:** Synthesizes structured business profiles (vertical, business model, differentiators, sales context) from locally stored notes.
2. **Product-Specific ICP Generation:** Generates tailored Ideal Customer Profiles for multiple products under each organization (target industries, sizes, decision makers, buying triggers, disqualifiers, pitch angle).
3. **Account Research & Site Facts:** Combines local database facts with permitted public-web scraping. Explicitly isolates confirmed observations from unavailable/withheld information.
4. **Buying-Signal Classification:** Identifies commercial hiring, expansion, funding, and technology events with confidence ratings and strategic sales implications.
5. **Problem Statement Generation:** Maps prospect bottlenecks directly to product features with causal reasoning and rep talk-tracks.
6. **Personalised Outreach Generation:** Crafts cold sales emails (subject line, hook, value prop, CTA) grounded strictly in verified observations. Zero hallucinations.
7. **Transparent Prospect Scoring:** Multidimensional scoring matrix evaluating ICP Fit (0-40), Signals (0-40), and Reachability (0-20) with executive AI reasoning.
8. **Conversation Reply Classification:** Inbound email triage classifying responses into 5 intent categories (`meeting_requested`, `interested`, `objection`, `follow_up_required`, `not_interested`) with sentiment analysis and auto-drafted replies.

---

## 3. Professional SaaS Dashboard (15 Core Views)

1. **Overview Dashboard:** Executive command center with KPI summary cards, pipeline funnel, prioritized accounts table, and real-time model telemetry.
2. **Company Profiles:** Organization management, business context editor, and AI profile synthesis.
3. **Product Portfolio:** Multi-product CRUD, pricing models, value propositions, and pain points solved.
4. **Hardware & Models:** Automated host profiling (CPU cores, RAM, GPU, free disk), hardware tier classification, and open-weight model catalog with download sizes and licences.
5. **Product ICP Engine:** Interactive ICP matrix generator per product.
6. **Prospects & Directory:** Searchable account table with custom CSV import and deduplication.
7. **Account Research:** Research dossiers with verified vs. unavailable data disclosures and audited source URLs.
8. **Buying Signals:** Signal timeline with confidence ratings and actionable sales implications.
9. **Problem Statements:** Causal pain-point mapping with severity indicators.
10. **Prospect Scoring:** Transparent 0–100 score matrix with factor breakdowns.
11. **Personalised Emails:** Step-by-step cold outreach generator with copy-to-clipboard functionality.
12. **Reply Classifier:** Interactive reply triage bench with preset simulation tests.
13. **Conversation History:** Threaded log of outbound messages and inbound prospect responses.
14. **Model Execution Logs:** Live audit trail recording inference latency (ms), token estimates, and offline flags.
15. **Settings & System Health:** Ollama endpoint configuration, offline mode switch, and task queue viewer.

---

## 4. Quickstart Guide (Windows)

### Prerequisites:
- **Python 3.11+** (Python 3.13 tested)
- **Node.js v18+** (Node v24 tested) & npm
- **Ollama** installed on host machine

### Step 1: Install Ollama & Pull Recommended Model
In PowerShell:
```powershell
# Install Ollama via Windows Package Manager
winget install Ollama.Ollama

# Pull the recommended local open-weight model (Apache-2.0, ~1.9 GB download)
ollama pull qwen2.5:3b

# Start the Ollama local daemon (if not already running)
ollama serve
```

### Step 2: Set Up Backend Environment
```powershell
cd harvey-local-sales-agent

# Install Python dependencies
pip install -r requirements.txt
```

### Step 3: Run the Application
Start the FastAPI application (which automatically serves the pre-built React dashboard at `http://127.0.0.1:8000/`):
```powershell
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
Open your browser to:
👉 **[http://127.0.0.1:8000/](http://127.0.0.1:8000/)**

*(Optional) For active frontend development, launch Vite in a separate terminal:*
```powershell
cd frontend
npm run dev
# Dashboard opens on http://127.0.0.1:5173/ with live hot-reloading
```

---

## 5. Verification & Testing

### Run Full Pytest Suite (20 Tests):
```powershell
pytest backend/tests/ -v
```
Verifies:
- All 8 AI sales workflows
- Multi-company and multi-product data separation
- Zero cloud API leakage (`test_no_cloud_leak.py`)
- Offline operation & failover queueing
- Hardware awareness & health diagnostics

### Run Fast Offline Workflow Verification:
```powershell
python backend/tests/verify_quick.py
```

---

## 6. Deliverables Index

- [END_TO_END_TEST_REPORT.md](END_TO_END_TEST_REPORT.md) — Comprehensive functional test report across all 8 workflows with 15 live UI screenshots.
- [TECHNICAL_DOCUMENTATION.md](TECHNICAL_DOCUMENTATION.md) — Architecture, database models, failure handling, and workflow specs.
- [MODEL_LICENCES.md](MODEL_LICENCES.md) — Exact licenses of Qwen 2.5, Llama 3.2, and dependencies.
- [COST_AND_DEPENDENCY_STATEMENT.md](COST_AND_DEPENDENCY_STATEMENT.md) — Zero-cost guarantee and cloud API prohibition proof.
- [HARDWARE_REQUIREMENTS.md](HARDWARE_REQUIREMENTS.md) — Hardware tiers, RAM profiling, and model download sizes.
- [OFFLINE_TEST_REPORT.md](OFFLINE_TEST_REPORT.md) — Formal offline acceptance test results across all 8 workflows.
- [TEST_EVIDENCE.md](TEST_EVIDENCE.md) — Raw test outputs and build transcripts.
- [DEMO_SCRIPT.md](DEMO_SCRIPT.md) — Step-by-step 5–10 minute screen recording guide.
- [PROJECT_PROGRESS.md](PROJECT_PROGRESS.md) — Complete milestone tracking log.

---

## 7. License & Attribution
Harvey Local Sales Agent is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)** in accordance with the upstream repository [Sellbird (formerly Harvey)](https://github.com/ethanplusai/harvey), Copyright (C) 2026 Ethan Rogers and contributors. See [LICENSE](LICENSE) and [NOTICE](NOTICE) for complete attribution.
