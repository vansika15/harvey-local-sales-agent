# EDXSO Assignment 2: Harvey AI Sales Agent — Project Progress

## 1. Project Overview
- **Project Name:** `harvey-local-sales-agent`
- **Starting Repository:** [ethanplusai/harvey](https://github.com/ethanplusai/harvey) (Forked & Extended)
- **Base License:** AGPL-3.0 / MIT (Preserved with attribution in LICENSE and NOTICE)
- **Target Architecture:** Zero-Cost Local AI Sales Agent (FastAPI + React/TypeScript/Tailwind + Ollama + SQLite)
- **Date:** 2026-11-19

---

## 2. Requirements Checklist & Status

| Category | Requirement | Status | Notes |
|---|---|---|---|
| **Core Setup** | Project folder created | COMPLETED | `harvey-local-sales-agent` |
| **Core Setup** | Original repo inspected & attribution preserved | COMPLETED | AGPL-3.0 & NOTICE preserved |
| **Zero-Cost Local AI** | No paid LLM APIs (OpenAI, Claude, Gemini, etc.) | COMPLETED | Pure local architecture, verified zero-cloud tests |
| **Zero-Cost Local AI** | Ollama local model service & error handling | COMPLETED | Central Ollama client with queue & sub-second failover |
| **Hardware Awareness** | OS, CPU, RAM, GPU detection & recommendations | COMPLETED | Native Windows API memory + tier recommendations |
| **Multi-Product/Company** | Multi-company & multi-product support | COMPLETED | Relational SQLite schemas & tenant isolation verified |
| **Workflow 1** | Business Profile Generation | COMPLETED | Local AI inference |
| **Workflow 2** | Product-Specific ICP Generation | COMPLETED | Separate ICPs per product |
| **Workflow 3** | Prospect Research (CSV + permitted public web) | COMPLETED | BeautifulSoup/Scrapy + local storage cache |
| **Workflow 4** | Buying-Signal Classification | COMPLETED | Local AI signal extraction & reasoning |
| **Workflow 5** | Problem Statement Generation | COMPLETED | Prospect-product problem mapping |
| **Workflow 6** | Personalised Outreach Generation | COMPLETED | Cold email sequences without hallucinations |
| **Workflow 7** | Prospect Scoring & Ranking | COMPLETED | Transparent breakdown & prioritization (0-100) |
| **Workflow 8** | Conversation / Reply Classification | COMPLETED | Intent detection (interested, objection, meeting) |
| **Offline Functionality** | Disconnected mode operation for all 8 workflows | COMPLETED | Local storage & local inference verification |
| **Failure Handling** | Offline/unavailable Ollama handling & task queue | COMPLETED | Clear UI error, audit log, & task queue |
| **Frontend Dashboard** | Modern SaaS UI (15 core views/panels) | IN PROGRESS | React + Vite + Tailwind + Lucide icons |
| **Backend & DB** | FastAPI endpoints & SQLite SQLAlchemy models | COMPLETED | Complete schema with persistence & seed data |
| **Testing** | Unit & integration tests for all workflows | COMPLETED | 20/20 Pytest suite passing |
| **Documentation** | 9 Deliverable documents & demo script | IN PROGRESS | Preparing comprehensive documentation |
| **Git & Clean Repo** | Clean Git repo with .gitignore, no secrets | COMPLETED | Repository initialized |

---

## 3. Implementation Log
- [x] Read and analyzed all 5 pages of EDXSO AI Engineer Intern Assignment 2 PDF.
- [x] Cloned and analyzed original repository (`ethanplusai/harvey`).
- [x] Identified architecture differences: Harvey was single-tenant CLI using Claude Code/Codex subscriptions; Assignment requires full local multi-tenant SaaS with Ollama, SQLite, FastAPI, React/Tailwind, offline support, hardware awareness, and 8 AI workflows.
- [x] Detected machine hardware specifications: AMD Ryzen 5 5500U (6 Cores, 12 Threads), 15.33 GB RAM, AMD Radeon Graphics, 81.9 GB free disk space.
- [x] Created target directory `harvey-local-sales-agent` and preserved original LICENSE and NOTICE.
