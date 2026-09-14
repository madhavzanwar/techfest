"""
Unit tests for Dual-Registry Interoperability and ABDM ABHA matching.
"""
from backend.app.data_engine.identity_resolution import IdentityResolver, soundex

def test_soundex_indian_names():
    """Verifies that soundex properly clusters Indian name variations."""
    assert soundex("Ganesh") == soundex("Ganeshh")
    assert soundex("Aarav") == soundex("Arav")
    assert soundex("Pooja") == soundex("Puja")

def test_deterministic_abha_match():
    """ABDM ABHA match yields 1.0 confidence."""
    p_rec = {
        "child_id": "POSHAN-001",
        "abha_id": "91-4455-6677-8899",
        "block_name": "Dhadgaon",
        "gender": "M"
    }
    a_rec = {
        "rch_id": "RCH-001",
        "abha_id_stub": "91-4455-6677-8899",
        "block_name": "Dhadgaon",
        "gender": "M"
    }
    status, conf, _ = IdentityResolver.match_records(p_rec, a_rec)
    assert status == "DETERMINISTIC_ABHA"
    assert conf == 1.00

def test_probabilistic_linkage():
    """Matching across block, gender, age, and soundex alias yields high confidence."""
    p_rec = {
        "child_id": "POSHAN-002",
        "pseudonym_name": "Rohan Valvi",
        "gender": "M",
        "age_months": 18,
        "block_name": "Akkalkuwa",
        "village_name": "Molgi"
    }
    a_rec = {
        "rch_id": "RCH-002",
        "child_alias": "Rohaan Valvi",
        "gender": "M",
        "dob_approx": "2025-02-15",  # ~18 months ago
        "block_name": "Akkalkuwa",
        "village_name": "Molgi"
    }
    status, conf, _ = IdentityResolver.match_records(p_rec, a_rec)
    assert status in ("PROBABILISTIC_HIGH", "PROBABILISTIC_MEDIUM")
    assert conf >= 0.70

def test_cross_block_rejection():
    """Records residing in different administrative blocks must be rejected."""
    p_rec = {"child_id": "POSHAN-003", "block_name": "Dhadgaon", "gender": "F"}
    a_rec = {"rch_id": "RCH-003", "block_name": "Shahada", "gender": "F"}
    status, conf, _ = IdentityResolver.match_records(p_rec, a_rec)
    assert status == "UNLINKED"
    assert conf <= 0.20
