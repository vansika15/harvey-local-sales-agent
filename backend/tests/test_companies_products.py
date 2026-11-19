"""Tests for multi-company and multi-product management, ensuring clean separation.
"""

def test_list_companies(client):
    res = client.get("/api/companies")
    assert res.status_code == 200
    companies = res.json()
    assert len(companies) >= 2
    names = [c["name"] for c in companies]
    assert "CloudOps Dynamics" in names
    assert "Bookwell Systems" in names


def test_create_and_delete_company(client):
    payload = {
        "name": "Apex Quantum Dynamics",
        "domain": "apexquantum.test",
        "industry": "Quantum Computing",
        "size": "20-50 employees",
        "description": "Simulation platform for quantum algorithms.",
    }
    create_res = client.post("/api/companies", json=payload)
    assert create_res.status_code == 201
    c_id = create_res.json()["id"]

    # Verify retrieval
    get_res = client.get(f"/api/companies/{c_id}")
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Apex Quantum Dynamics"

    # Delete company
    del_res = client.delete(f"/api/companies/{c_id}")
    assert del_res.status_code == 204

    # Verify 404 after deletion
    assert client.get(f"/api/companies/{c_id}").status_code == 404


def test_multi_product_separation(client):
    # Retrieve CloudOps Dynamics (ID 1)
    res1 = client.get("/api/products?company_id=1")
    assert res1.status_code == 200
    p1 = res1.json()
    assert len(p1) == 2
    p1_names = [p["name"] for p in p1]
    assert "KubeGuard AI" in p1_names
    assert "LogStream Pro" in p1_names

    # Retrieve Bookwell Systems (ID 2)
    res2 = client.get("/api/products?company_id=2")
    assert res2.status_code == 200
    p2 = res2.json()
    assert len(p2) == 2
    p2_names = [p["name"] for p in p2]
    assert "PracticePilot" in p2_names
    assert "FieldSync Mobile" in p2_names

    # Verify no overlap between company products
    assert set(p1_names).isdisjoint(set(p2_names))
