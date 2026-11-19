import sys, os
sys.path.insert(0, r"C:\Users\hp\.gemini\antigravity\scratch\harvey-local-sales-agent")
import asyncio
from backend.services.ollama_service import ollama_service

async def main():
    print("Calling generate...", flush=True)
    res = await ollama_service.generate(
        prompt="Hello",
        workflow_name="test",
        deterministic_fallback="Test fallback"
    )
    print(f"Result received: preview={res['is_deterministic_preview']}, model={res['model']}", flush=True)

if __name__ == "__main__":
    asyncio.run(main())
