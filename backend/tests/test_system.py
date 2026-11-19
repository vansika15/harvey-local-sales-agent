"""Tests for system endpoints, hardware awareness, model logs, and queue.
"""

def test_system_health(client):
    res = client.get("/api/system/health")
    assert res.status_code == 200
    data = res.json()
    assert "status" in data
    assert "ollama_connected" in data
    assert "active_model" in data
    assert "available_models" in data
    assert "offline_mode" in data


def test_hardware_detection(client):
    res = client.get("/api/system/hardware")
    assert res.status_code == 200
    data = res.json()
    assert data["os"] in ["Windows", "Linux", "Darwin"]
    assert data["cpu_cores"] > 0
    assert data["total_ram_gb"] > 0
    assert "hardware_tier" in data
    assert "recommended_model" in data
    assert len(data["supported_models"]) >= 3


def test_model_execution_logs(client):
    res = client.get("/api/system/logs")
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_task_queue(client):
    res = client.get("/api/system/queue")
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_offline_toggle(client):
    res = client.post("/api/system/toggle-offline?enabled=true")
    assert res.status_code == 200
    assert res.json()["offline_mode"] is True

    # Toggle back to false
    res2 = client.post("/api/system/toggle-offline?enabled=false")
    assert res2.status_code == 200
    assert res2.json()["offline_mode"] is False
