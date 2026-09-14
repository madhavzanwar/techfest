"""
API integration tests for Poshan-Suraksha endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.data_engine.state import db_store

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def init_db():
    db_store.initialize(count=100)

def test_api_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "Nandurbar" in data["district"]

def test_api_overview():
    res = client.get("/api/overview")
    assert res.status_code == 200
    data = res.json()
    assert data["total_children_monitored"] > 0
    assert "critical_count" in data
    assert len(data["block_breakdown"]) > 0

def test_rbac_pii_masking():
    # As DISTRICT_OFFICER, PII must be masked
    res = client.get("/api/children?role=DISTRICT_OFFICER&limit=5")
    assert res.status_code == 200
    records = res.json()["data"]
    assert len(records) > 0
    for r in records:
        assert "***" in r["pseudonym_name"], "District Officer view must mask child name"
        assert r["anonymized_aadhaar_hash"] is None

def test_escalation_action_logging():
    # Fetch first escalation case
    esc_res = client.get("/api/escalations?limit=1")
    assert esc_res.status_code == 200
    cases = esc_res.json()["cases"]
    assert len(cases) > 0
    test_case = cases[0]

    # Perform an intervention
    act_payload = {
        "action_type": "NRC_ADMISSION_INITIATED",
        "notes": "Child referred to Sub-District Hospital NRC with urgent SAM protocol.",
        "officer_name": "Dr. Ramesh Patil (PHC MO)"
    }
    post_res = client.post(f"/api/escalations/{test_case['case_id']}/action", json=act_payload)
    assert post_res.status_code == 200
    res_data = post_res.json()
    assert res_data["status"] == "success"
    assert res_data["updated_case"]["case_status"] == "ACTIONED"

    # Verify action history
    hist_res = client.get(f"/api/escalations/{test_case['case_id']}/history")
    assert hist_res.status_code == 200
    actions = hist_res.json()["actions"]
    assert len(actions) >= 1
    assert actions[0]["action_type"] == "NRC_ADMISSION_INITIATED"
