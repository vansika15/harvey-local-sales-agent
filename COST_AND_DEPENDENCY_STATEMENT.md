# Cost & Dependency Statement

## 1. Zero-Cost Compliance Guarantee
**Harvey Local Sales Agent** was engineered to satisfy the non-negotiable requirement of **Zero LLM Cost** for the EDXSO AI Engineer Intern screening assessment.

### Prohibited Services Check:
| Prohibited Service | Status in Codebase | Verification Method |
|---|---|---|
| **OpenAI API** (`gpt-4o`, `gpt-3.5-turbo`) | **ZERO DEPENDENCY** | Codebase regex scan + automated test `test_no_cloud_leak.py` |
| **Anthropic API** (`claude-3-5-sonnet`) | **ZERO DEPENDENCY** | No imports, no endpoints, no SDKs present |
| **Google Gemini API** (`gemini-1.5-pro`) | **ZERO DEPENDENCY** | Prohibited in architecture, zero keys required |
| **Claude Code Subscription** | **ELIMINATED** | Upstream CLI dependency removed in favor of local Ollama |
| **Codex Subscription** | **ELIMINATED** | Replaced with open-weight Ollama inference |
| **Paid Enrichment APIs** (Apollo, ZoomInfo, Clay) | **ZERO DEPENDENCY** | Replaced with permitted public-web BeautifulSoup research |
| **Per-Token Billing Gateways** | **ZERO DEPENDENCY** | 100% self-hosted on local hardware |

---

## 2. Infrastructure Cost Breakdown

| Component | Cost | Host Mechanism |
|---|---|---|
| **AI Inference** | **$0.00** | Ollama local daemon (`127.0.0.1:11434`) running Qwen 2.5 3B |
| **Embedding Generation** | **$0.00** | Local Sentence Transformers (`all-MiniLM-L6-v2`) |
| **Database Storage** | **$0.00** | Local file-based SQLite database (`harvey_sales.db`) |
| **Web Research** | **$0.00** | Public HTML requests respecting `robots.txt` & local caching |
| **Dashboard UI** | **$0.00** | Single-page React application served directly by FastAPI |
| **Total Monthly Operating Cost** | **$0.00** | **Pure zero-cost local architecture** |

---

## 3. Disclosed Tool & Service Limitations
1. **Public Web Research Rate Limits:**
   - Public scraping is strictly limited to open homepage headers and publicly available text.
   - Any website returning HTTP 403, 429, or blocking web crawlers via `robots.txt` is respected; no evasion or proxy rotation is implemented.
   - When offline or when domains restrict automated access, the system uses previously cached observations and explicit "Unavailable Information" notes.

2. **Local Model Compute Constraints:**
   - Inference latency depends directly on the host machine's CPU/GPU capabilities.
   - On a standard modern laptop (e.g. AMD Ryzen 5 or Intel i5 with 16GB RAM), average inference latency for a 3B model is 1.5–3.5 seconds per prompt.
   - In environments where Ollama is not yet started, Harvey queues requests in SQLite and generates an explicit, deterministic preview so that users are never blocked.
