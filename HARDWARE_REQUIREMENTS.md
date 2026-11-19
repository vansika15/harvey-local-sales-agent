# Hardware Requirements & Model Selection Guide

## 1. Automated Hardware Detection Architecture
The **Harvey Local Sales Agent** includes built-in hardware awareness via `backend/services/hardware_service.py`. It inspects:
- **Operating System:** Windows 10/11, macOS, Linux
- **Processor:** Physical cores, logical threads, processor architecture
- **System Memory:** Total physical RAM and currently available uncommitted RAM (via Windows `GlobalMemoryStatusEx` API)
- **Graphics Acceleration:** Dedicated GPU detection, VRAM allocation, or DirectX/iGPU fallback
- **Disk Storage:** Root storage drive free capacity

---

## 2. Hardware Tiers & Model Recommendations

### Tier 1: Entry / Memory-Constrained Machine (<8 GB RAM)
- **Profile:** Older laptops, low-spec virtual machines, or budget devices.
- **Recommended Model:** `qwen2.5:1.5b` (or `qwen2.5:0.5b`)
- **Download Size:** ~0.98 GB
- **RAM Footprint:** ~1.8 GB during inference
- **Inference Speed:** Near-instant on CPU (sub-second responses)
- **Characteristics:** Fast response times, lower context window, ideal for quick signal categorization and email drafting.

### Tier 2: Standard Modern Laptop (8 GB – 16 GB RAM) — *Recommended Default*
- **Profile:** Standard development laptops (e.g. AMD Ryzen 5 / Intel Core i5/i7 with 16 GB RAM).
- **Recommended Model:** `qwen2.5:3b`
- **Download Size:** ~1.9 GB
- **RAM Footprint:** ~3.2 GB during inference
- **Inference Speed:** 1.5 – 3.0 seconds per workflow on multi-core CPU
- **Characteristics:** The sweet spot for local reasoning, accurate JSON extraction, and high-quality sales email generation.

### Tier 3: High-Performance Workstation (>16 GB RAM or Dedicated GPU)
- **Profile:** Engineering desktops, gaming laptops with Nvidia RTX/AMD Radeon GPUs, or machines with 24 GB+ RAM.
- **Recommended Model:** `qwen2.5:7b` (or `qwen2.5:14b`)
- **Download Size:** ~4.7 GB (for 7B)
- **RAM Footprint:** ~6.5 GB during inference
- **Inference Speed:** Under 1.0 second on GPU; ~4.0 seconds on CPU
- **Characteristics:** Deepest reasoning, nuanced problem statement articulation, and multi-turn objection handling.

---

## 3. Storage & Disk Space Requirements
- **Core Codebase & Frontend Bundle:** ~30 MB
- **Dependencies (Node & Python):** ~350 MB
- **Model Weights (Qwen 2.5 3B):** ~1.9 GB
- **Local Embeddings (all-MiniLM-L6-v2):** ~90 MB
- **SQLite Database:** ~2 MB (expands with lead count)
- **Total Recommended Free Disk Space:** **Minimum 5.0 GB**

---

## 4. Host Machine Verified Telemetry
During internal testing on the host evaluation environment, the system automatically detected:
```json
{
  "os": "Windows",
  "os_release": "11",
  "cpu_model": "AMD64 Family 23 Model 104 Stepping 1, AuthenticAMD",
  "cpu_cores": 12,
  "total_ram_gb": 15.33,
  "available_ram_gb": 3.12,
  "gpu_name": "AMD Radeon(TM) Integrated Graphics / DirectX 12",
  "free_disk_gb": 81.92,
  "hardware_tier": "Standard Modern Laptop",
  "recommended_model": "qwen2.5:3b"
}
```
The application automatically configured 8 execution threads and 4,096 context tokens based on these specifications.
