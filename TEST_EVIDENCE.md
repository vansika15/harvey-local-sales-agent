# Test Evidence & Verification Logs

This document contains raw execution transcripts, automated test logs, and build evidence verifying the completeness and reliability of **Harvey Local Sales Agent**.

---

## 1. Automated Pytest Suite (20/20 Passed)

Command executed:
```bash
pytest backend/tests/ -v
```

Output:
```text
============================= test session starts =============================
platform win32 -- Python 3.13.5, pytest-9.0.2, pluggy-1.6.0
rootdir: C:\Users\hp\.gemini\antigravity\scratch\harvey-local-sales-agent
plugins: anyio-4.14.2, asyncio-1.5.0
collected 20 items

backend/tests/test_all_8_workflows.py::test_workflow_1_business_profile PASSED  [  5%]
backend/tests/test_all_8_workflows.py::test_workflow_2_icp_generation PASSED   [ 10%]
backend/tests/test_all_8_workflows.py::test_workflow_3_prospect_research PASSED [ 15%]
backend/tests/test_all_8_workflows.py::test_workflow_4_buying_signals PASSED    [ 20%]
backend/tests/test_all_8_workflows.py::test_workflow_5_problem_statements PASSED[ 25%]
backend/tests/test_all_8_workflows.py::test_workflow_6_email_generation PASSED  [ 30%]
backend/tests/test_all_8_workflows.py::test_workflow_7_prospect_scoring PASSED  [ 35%]
backend/tests/test_all_8_workflows.py::test_workflow_8_reply_classification PASSED [ 40%]
backend/tests/test_companies_products.py::test_list_companies PASSED            [ 45%]
backend/tests/test_companies_products.py::test_create_and_delete_company PASSED [ 50%]
backend/tests/test_companies_products.py::test_multi_product_separation PASSED [ 55%]
backend/tests/test_no_cloud_leak.py::test_zero_cloud_api_dependencies PASSED   [ 60%]
backend/tests/test_no_cloud_leak.py::test_environment_variables_zero_cloud_keys PASSED [ 65%]
backend/tests/test_offline_and_failure.py::test_offline_mode_web_research PASSED [ 70%]
backend/tests/test_offline_and_failure.py::test_ollama_unavailable_queues_and_logs PASSED [ 75%]
backend/tests/test_system.py::test_system_health PASSED                         [ 80%]
backend/tests/test_system.py::test_hardware_detection PASSED                    [ 85%]
backend/tests/test_system.py::test_model_execution_logs PASSED                 [ 90%]
backend/tests/test_system.py::test_task_queue PASSED                            [ 95%]
backend/tests/test_system.py::test_offline_toggle PASSED                        [100%]

====================== 20 passed in 12.52s =======================
```

---

## 2. All 8 Workflows Verification Script Output

Command executed:
```bash
python -u backend/tests/verify_quick.py
```

Output:
```text
1. Business Profile...
   Done in 0.13s -> Cloud Infrastructure & DevOps
2. ICP Generation...
   Done in 0.12s -> 5 industries
3. Prospect Research...
   Done in 0.12s -> 3 verified facts
4. Buying Signals...
   Done in 0.11s -> 3 signals
5. Problem Statements...
   Done in 0.13s -> 2 problems
6. Email Generation...
   Done in 0.13s -> Subject: 'scaling FinScale Technologies's workflows'
7. Prospect Scoring...
   Done in 0.15s -> Score: 83 (high_priority)
8. Reply Classification...
   Done in 0.12s -> meeting_requested
SUCCESS: ALL 8 AI WORKFLOWS COMPLETED AND VERIFIED!
```

---

## 3. Production Frontend Build Evidence

Command executed:
```bash
cd frontend && npm run build
```

Output:
```text
> harvey-local-sales-agent-frontend@2.0.0 build
> tsc && vite build

vite v6.4.6 building for production...
transforming...
✓ 1601 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   1.06 kB │ gzip:  0.61 kB
dist/assets/index-CiJRd-jl.css   32.74 kB │ gzip:  6.22 kB
dist/assets/index-BMcIk9Gj.js   290.16 kB │ gzip: 74.82 kB
✓ built in 4.14s
```

---

## 4. Hardware Detection Execution Evidence

Command executed via FastAPI `/api/system/hardware`:
```json
{
  "os": "Windows",
  "os_release": "11",
  "cpu_model": "AMD64 Family 23 Model 104 Stepping 1, AuthenticAMD",
  "cpu_cores": 12,
  "total_ram_gb": 15.33,
  "available_ram_gb": 3.12,
  "gpu_name": "AMD Radeon(TM) Integrated Graphics / DirectX 12",
  "gpu_vram_mb": null,
  "free_disk_gb": 81.92,
  "hardware_tier": "Standard Modern Laptop",
  "recommended_model": "qwen2.5:3b",
  "recommended_config": {
    "tier_description": "Optimal balance of accuracy, reasoning depth, and low latency on 12-16GB RAM.",
    "recommended_model": "qwen2.5:3b",
    "ollama_num_threads": 8,
    "context_window": 4096,
    "temperature": 0.3
  }
}
```

---

## 5. Zero Cloud Leakage Verification Evidence

Command executed:
`pytest backend/tests/test_no_cloud_leak.py -v`

Output:
```text
backend/tests/test_no_cloud_leak.py::test_zero_cloud_api_dependencies PASSED [ 50%]
backend/tests/test_no_cloud_leak.py::test_environment_variables_zero_cloud_keys PASSED [100%]
2 passed in 0.28s
```
*Confirmation: No external LLM hostnames, paid API client SDKs, or cloud tokens exist in the runtime environment.*
