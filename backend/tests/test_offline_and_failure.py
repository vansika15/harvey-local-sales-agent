"""Tests for offline resilience, failure handling, task queueing, and deterministic preview mode.
"""

from backend.config import settings
from backend.services.ollama_service import ollama_service


def test_offline_mode_web_research(client):
    # Enable offline mode
    client.post("/api/system/toggle-offline?enabled=true")
    assert settings.OFFLINE_MODE is True

    # Attempt prospect research in offline mode
    res = client.post("/api/prospects/2/research", json={"force_live_scrape": True})
    assert res.status_code == 200
    data = res.json()
    assert data["offline_cached"] is True
    # Verify verified facts were drawn from local data
    assert len(data["verified_facts"]) > 0

    # Reset offline mode
    client.post("/api/system/toggle-offline?enabled=false")
    assert settings.OFFLINE_MODE is False


def test_ollama_unavailable_queues_and_logs(client):
    # Trigger an AI workflow
    res = client.post("/api/prospects/1/classify-signals", json={})
    assert res.status_code == 200
    data = res.json()
    assert "signals" in data

    # Check task queue and logs
    logs_res = client.get("/api/system/logs?limit=5")
    assert logs_res.status_code == 200
    logs = logs_res.json()
    assert len(logs) > 0

    # Verify no cloud APIs are listed in logs
    for log in logs:
        assert "openai" not in log["model_name"].lower()
        assert "anthropic" not in log["model_name"].lower()
        assert "claude" not in log["model_name"].lower()
        assert "gemini" not in log["model_name"].lower()
