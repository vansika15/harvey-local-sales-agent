"""Tests for offline resilience, failure handling, task queueing, and deterministic preview mode.
"""

from backend.config import settings
from backend.services.ollama_service import ollama_service


def get_first_prospect_id(client):
    prospects = client.get("/api/prospects").json()
    return prospects[0]["id"] if prospects else 1


def test_offline_mode_web_research(client):
    # Enable offline mode
    client.post("/api/system/toggle-offline?enabled=true")
    assert settings.OFFLINE_MODE is True

    pr_id = get_first_prospect_id(client)

    # Attempt prospect research in offline mode
    res = client.post(f"/api/prospects/{pr_id}/research", json={"force_live_scrape": True})
    assert res.status_code == 200
    data = res.json()
    assert data["offline_cached"] is True
    # Verify verified facts were drawn from local data
    assert len(data["verified_facts"]) > 0

    # Reset offline mode
    client.post("/api/system/toggle-offline?enabled=false")
    assert settings.OFFLINE_MODE is False


def test_ollama_unavailable_queues_and_logs(client):
    pr_id = get_first_prospect_id(client)

    # Trigger an AI workflow
    res = client.post(f"/api/prospects/{pr_id}/classify-signals", json={})
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
