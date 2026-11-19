# Model & Dependency Licences

## 1. Executive Summary & Zero-Cost Compliance
This document certifies that the **Harvey Local Sales Agent** operates strictly with permissive open-source software and open-weight model weights.
- **Zero Paid AI APIs:** No tokens are billed to OpenAI, Anthropic, Gemini, or any commercial cloud AI gateway.
- **Permissive Licences:** All core libraries and recommended models are governed by Apache-2.0, MIT, BSD, or equivalent community open-weight licences.

---

## 2. Local Open-Weight Models

| Model Name | Parameters | HuggingFace / Ollama Identifier | Licence | Permitted Use | Download Size |
|---|---|---|---|---|---|
| **Qwen 2.5 3B Instruct** (Recommended) | 3.09 Billion | `qwen2.5:3b` | **Apache-2.0** | Commercial & Academic | ~1.9 GB |
| **Qwen 2.5 1.5B Instruct** | 1.54 Billion | `qwen2.5:1.5b` | **Apache-2.0** | Commercial & Academic | ~0.98 GB |
| **Qwen 2.5 7B Instruct** | 7.61 Billion | `qwen2.5:7b` | **Apache-2.0** | Commercial & Academic | ~4.7 GB |
| **Llama 3.2 3B Instruct** | 3.21 Billion | `llama3.2:3b` | **Llama 3.2 Community Licence** | Free Commercial (<700M MAU) | ~2.0 GB |
| **all-MiniLM-L6-v2** (Embeddings) | 22.7 Million | `sentence-transformers/all-MiniLM-L6-v2` | **Apache-2.0** | Commercial & Academic | ~90 MB |

### Key Licence Notes:
- **Qwen 2.5 (Alibaba Cloud):** Released under standard Apache-2.0, permitting unrestricted modification, distribution, commercial deployment, and private local use.
- **Llama 3.2 (Meta Platforms):** Governed by the Llama 3.2 Community Licence Agreement, permitting free commercial use and modification for services with under 700 million monthly active users.
- **Sentence Transformers (UKPLab):** Released under Apache-2.0.

---

## 3. Core Software & Library Dependencies

### Backend Python Stack
| Library | Version Tested | Licence | Functionality |
|---|---|---|---|
| **FastAPI** | 0.141.1 | **MIT** | Asynchronous REST API framework |
| **Uvicorn** | 0.52.4 | **BSD-3-Clause** | ASGI web server |
| **SQLAlchemy** | 2.0.52 | **MIT** | ORM and SQLite database abstraction |
| **Pydantic** | 2.13.5 | **MIT** | Data validation & schema serialization |
| **httpx** | 0.28.1 | **BSD-3-Clause** | Asynchronous HTTP client for Ollama & web research |
| **BeautifulSoup4** | 4.15.0 | **MIT** | Public HTML parsing and metadata extraction |
| **Sentence-Transformers** | 6.0.0 | **Apache-2.0** | Local semantic embedding vectorization |
| **Pytest** | 9.0.2 | **MIT** | Test execution framework |
| **Pandas** | 3.0.5 | **BSD-3-Clause** | CSV prospect import processing |

### Frontend React & Node Stack
| Package | Version | Licence | Purpose |
|---|---|---|---|
| **React** | 18.3.1 | **MIT** | Declarative component UI |
| **React-DOM** | 18.3.1 | **MIT** | DOM rendering engine |
| **Vite** | 6.0.1 | **MIT** | Build tool and dev server |
| **Tailwind CSS** | 3.4.16 | **MIT** | Utility-first styling framework |
| **Lucide React** | 0.468.0 | **ISC** | Iconography |
| **TypeScript** | 5.6.2 | **Apache-2.0** | Static typing |

---

## 4. Upstream Fork Attribution
- **Original Project:** [Sellbird (formerly Harvey)](https://github.com/ethanplusai/harvey)
- **Original Copyright:** Copyright (C) 2026 Ethan Rogers and contributors
- **Licence:** AGPL-3.0-only / MIT (historical versions up to 0.3.x).
- **Compliance Action:** Full upstream AGPL-3.0 licence text preserved in `LICENSE`, and original copyright notices preserved in `NOTICE`. All modifications and extensions remain fully open source.
