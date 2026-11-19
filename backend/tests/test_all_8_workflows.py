"""End-to-end API tests for all 8 mandatory AI sales workflows.
Verifies data flow, output schema, and local execution.
"""

def get_sample_fixtures(client):
    comps = client.get("/api/companies").json()
    c = next(comp for comp in comps if comp["name"] == "CloudOps Dynamics")
    prods = client.get(f"/api/products?company_id={c['id']}").json()
    p = prods[0]
    prospects = client.get(f"/api/prospects?company_id={c['id']}").json()
    pr = prospects[0] if prospects else client.get("/api/prospects").json()[0]
    return c["id"], p["id"], pr["id"]


def test_workflow_1_business_profile(client):
    c_id, _, _ = get_sample_fixtures(client)
    res = client.post(f"/api/companies/{c_id}/generate-profile", json={})
    assert res.status_code == 200
    data = res.json()
    assert "profile" in data
    assert "industry_vertical" in data["profile"]
    assert "core_value_proposition" in data["profile"]
    assert data["company_name"] == "CloudOps Dynamics"


def test_workflow_2_icp_generation(client):
    _, p_id, _ = get_sample_fixtures(client)
    res = client.post(f"/api/products/{p_id}/generate-icp", json={})
    assert res.status_code == 200
    data = res.json()
    assert "icp" in data
    assert len(data["icp"]["target_industries"]) > 0
    assert len(data["icp"]["decision_maker_roles"]) > 0
    assert len(data["icp"]["core_pain_points"]) > 0


def test_workflow_3_prospect_research(client):
    _, _, pr_id = get_sample_fixtures(client)
    res = client.post(f"/api/prospects/{pr_id}/research", json={"force_live_scrape": False})
    assert res.status_code == 200
    data = res.json()
    assert data["prospect_id"] == pr_id
    assert "verified_facts" in data
    assert "unavailable_facts" in data
    assert isinstance(data["verified_facts"], list)
    assert isinstance(data["unavailable_facts"], list)


def test_workflow_4_buying_signals(client):
    _, _, pr_id = get_sample_fixtures(client)
    res = client.post(f"/api/prospects/{pr_id}/classify-signals", json={})
    assert res.status_code == 200
    data = res.json()
    assert data["signals_count"] >= 1
    assert "signals" in data
    assert "sales_implication" in data["signals"][0]


def test_workflow_5_problem_statements(client):
    _, p_id, pr_id = get_sample_fixtures(client)
    res = client.post(f"/api/prospects/{pr_id}/generate-problems", json={"product_id": p_id})
    assert res.status_code == 200
    data = res.json()
    assert data["problems_count"] >= 1
    assert "problems" in data
    assert "connection_to_product" in data["problems"][0]


def test_workflow_6_email_generation(client):
    _, p_id, pr_id = get_sample_fixtures(client)
    res = client.post(f"/api/prospects/{pr_id}/generate-email", json={"product_id": p_id, "sequence_step": 1})
    assert res.status_code == 200
    data = res.json()
    assert "subject_line" in data
    assert "email_body" in data
    assert "hook_opening" in data
    assert "value_proposition" in data
    assert "call_to_action" in data


def test_workflow_7_prospect_scoring(client):
    _, p_id, pr_id = get_sample_fixtures(client)
    res = client.post(f"/api/prospects/{pr_id}/score", json={"product_id": p_id})
    assert res.status_code == 200
    data = res.json()
    assert 0 <= data["overall_score"] <= 100
    assert data["score_category"] in ["high_priority", "medium_priority", "low_priority", "unqualified"]
    assert "breakdown" in data
    assert "reasoning" in data


def test_workflow_8_reply_classification(client):
    _, p_id, pr_id = get_sample_fixtures(client)
    # Test positive meeting request
    res1 = client.post("/api/replies/classify", json={
        "inbound_message": "Hi, looks great. Can we book a Zoom call on Thursday at 2 PM?",
        "prospect_id": pr_id,
        "product_id": p_id
    })
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["classification"] == "meeting_requested"
    assert "suggested_response" in data1

    # Test objection or not interested
    res2 = client.post("/api/replies/classify", json={
        "inbound_message": "We already have an annual contract with Datadog and have zero budget right now.",
        "prospect_id": pr_id,
        "product_id": p_id
    })
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["classification"] in ["objection", "not_interested"]
