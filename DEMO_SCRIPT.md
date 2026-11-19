# Screen-Recorded Demonstration Script (5–10 Minutes)

This script outlines the exact chronological flow for recording the 5–10 minute submission video for **EDXSO AI Engineer Intern Assignment 2: Harvey AI Sales Agent**.

---

## Part 1: Architecture, Hardware Awareness & Zero Cost Setup (1.5 Minutes)
- **Time:** 0:00 – 1:30
- **Action:**
  1. Open the browser to `http://127.0.0.1:8000/`.
  2. Show the **Harvey AI Local** dashboard header: note the local Ollama connectivity indicator and the Zero-Cost compliance badge in the sidebar.
  3. Navigate to **Hardware & Models** (`/hardware`):
     - Point out the automatically detected system specifications: AMD Ryzen 5 (12 threads), 15.33 GB RAM, integrated graphics, and 81+ GB free disk space.
     - Highlight the **Standard Modern Laptop** tier classification and the recommended model: `qwen2.5:3b`.
     - Review the supported models table showing exact Apache-2.0 licences, download sizes, and parameter counts.
     - **Voiceover key point:** *"Notice that this entire architecture runs with zero cloud API keys. There are no dependencies on OpenAI, Anthropic, or Gemini, making operating costs literally $0.00."*

---

## Part 2: Multi-Company & Multi-Product Configuration (1.5 Minutes)
- **Time:** 1:30 – 3:00
- **Action:**
  1. Navigate to **Company Profiles** (`/companies`):
     - Show the active organization: *CloudOps Dynamics* (DevOps SaaS).
     - Switch to the second company: *Bookwell Systems* (Contractor / Clinic software) using the top header dropdown to demonstrate complete tenant data separation.
     - Switch back to *CloudOps Dynamics*.
     - Click **"Generate AI Business Profile (Workflow 1)"**: show the live local synthesis of vertical, target market, differentiators, and executive overview.
  2. Navigate to **Product Portfolio** (`/products`):
     - Show multiple products under CloudOps: *KubeGuard AI* and *LogStream Pro*.
     - Point out separate pricing models, target customer profiles, and pain points solved.

---

## Part 3: Product-Specific ICP Generation & Prospect Discovery (1.5 Minutes)
- **Time:** 3:00 – 4:30
- **Action:**
  1. Navigate to **Product ICP Engine** (`/icp`):
     - With *KubeGuard AI* selected, click **"Generate ICP Profile (Workflow 2)"**.
     - Review the generated matrix: 5 target industries, decision maker titles (`VP Engineering`, `Head of Infrastructure`), acute pain points, buying triggers, disqualifiers, and the recommended pitch angle.
  2. Navigate to **Prospects & Import** (`/discovery`):
     - Show the directory of target accounts.
     - Open the **"Import CSV"** modal to demonstrate automated CSV parsing with deduplication and validation.

---

## Part 4: Prospect Intelligence: Research, Signals & Problems (2.0 Minutes)
- **Time:** 4:30 – 6:30
- **Action:**
  1. Navigate to **Account Research** (`/research`):
     - Select *FinScale Technologies*.
     - Click **"Run Account Research (Workflow 3)"**.
     - Point out the clean two-column split: **Verified Observations** (confirmed web facts) versus **Explicitly Unavailable Data** (withheld budget figures). Emphasize compliance with `robots.txt`.
  2. Navigate to **Buying Signals** (`/signals`):
     - Click **"Classify Buying Signals (Workflow 4)"**.
     - Show detected signals: *Aggressive Infrastructure Hiring* and *Multi-Region API Expansion*.
     - Read the **"Why It Matters (Sales Rationale)"** box explaining tactical implications.
  3. Navigate to **Problem Statements** (`/problems`):
     - Click **"Generate Problem Statements (Workflow 5)"**.
     - Show the high-severity bottleneck: *FinScale's Multi-Region EKS Clusters Burning Idle Compute* and how *KubeGuard AI* directly resolves it.

---

## Part 5: Prospect Scoring & Personalised Outreach (1.5 Minutes)
- **Time:** 6:30 – 8:00
- **Action:**
  1. Navigate to **Prospect Scoring** (`/scoring`):
     - Click **"Calculate Score & Priority (Workflow 7)"**.
     - Review the transparent scoring breakdown: Fit (38/40) + Signals (35/40) + Reachability (18/20) = **91/100 (High Priority)**.
     - Show the AI executive rationale.
  2. Navigate to **Personalised Emails** (`/emails`):
     - Select Step 1 outreach and click **"Generate Email Sequence (Workflow 6)"**.
     - Review the generated email: subject line, hook, value prop, and low-friction CTA.
     - Note the complete absence of fabricated facts or hallucinations.
     - Click **"Copy Email"** to show one-click rep workflow.

---

## Part 6: Conversation Reply Triage & Model Audit Logs (1.0 Minute)
- **Time:** 8:00 – 9:00
- **Action:**
  1. Navigate to **Reply Classifier** (`/replies`):
     - Select the preset: *Demo Booking Request*.
     - Click **"Classify Reply (Workflow 8)"**.
     - Show detected classification (`meeting_requested`, 96% confidence), sentiment (positive), and the auto-drafted rep reply.
     - Test an objection preset (*Tech Stack & Budget Objection*) to show objection extraction.
  2. Navigate to **Model Audit Logs** (`/logs`):
     - Inspect the audit trail showing all local executions with latency in milliseconds and token counts.

---

## Part 7: Final Offline Acceptance Demonstration (1.0 Minute)
- **Time:** 9:00 – 10:00
- **Action:**
  1. In the header bar, click **"Online Mode"** to toggle **"Offline Enforced"**.
  2. Demonstrate that external web requests are blocked.
  3. Re-run an AI workflow (e.g. Email Generation or Reply Classification).
  4. Show that the workflow completes locally in milliseconds using stored business intelligence with zero network calls.
  5. Conclude: *"Harvey Local Sales Agent is 100% self-hosted, operates offline, supports multi-product workflows, and delivers enterprise-grade sales intelligence at zero LLM cost."*
