"""
Unit tests for Risk-Fusion Engine and Clinical Triage Logic.
"""
from backend.app.models.schemas import GrowthVisit, RiskTier
from backend.app.data_engine.risk_scorer import NutritionRiskEngine

def test_oedema_triggers_critical():
    """Bilateral pitting oedema must trigger Critical triage tier immediately regardless of other values."""
    visit = GrowthVisit(
        visit_month_index=0,
        visit_date="2026-08-15",
        weight_kg=10.0,
        height_cm=80.0,
        muac_mm=130.0,
        oedema=True,
        waz=0.0,
        haz=0.0,
        whz=0.0
    )
    risk = NutritionRiskEngine.evaluate_child(visit, [visit], health_record=None)
    assert risk.tier == RiskTier.CRITICAL
    assert any("Kwashiorkor" in t for t in risk.primary_triggers)

def test_early_warning_velocity_drop():
    """
    A child who dropped 0.9 SD over 60 days must be escalated to WATCH
    even if their current WHZ has not crossed the -2.0 SD wasting line!
    This verifies early warning rather than retrospective classification.
    """
    v2 = GrowthVisit(visit_month_index=-2, visit_date="2026-06-15", weight_kg=10.5, height_cm=79.0, muac_mm=135.0, oedema=False, waz=0.2, haz=0.0, whz=0.2)
    v1 = GrowthVisit(visit_month_index=-1, visit_date="2026-07-15", weight_kg=10.0, height_cm=79.5, muac_mm=130.0, oedema=False, waz=-0.4, haz=0.0, whz=-0.4)
    v0 = GrowthVisit(visit_month_index=0, visit_date="2026-08-15", weight_kg=9.5, height_cm=80.0, muac_mm=126.0, oedema=False, waz=-1.0, haz=0.0, whz=-1.1)

    risk = NutritionRiskEngine.evaluate_child(v0, [v2, v1, v0], health_record=None)
    # Even though WHZ is -1.1 (mild), velocity collapsed by -1.3 SD -> must trigger WATCH
    assert risk.tier in (RiskTier.WATCH, RiskTier.CRITICAL)
    assert any("EARLY WARNING" in t for t in risk.primary_triggers)

def test_asha_morbidity_escalation():
    """Presence of severe anemia (Hb < 7) and prolonged diarrhea in ASHA record escalates risk."""
    visit = GrowthVisit(
        visit_month_index=0,
        visit_date="2026-08-15",
        weight_kg=8.5,
        height_cm=80.0,
        muac_mm=122.0,  # MAM
        oedema=False,
        waz=-2.1,
        haz=-1.5,
        whz=-2.2
    )
    health_record = {
        "immunization_status": "ZERO_DOSE",
        "recent_diarrhea_days": 6,
        "recent_ari_pneumonia": True,
        "anemia_hb_level_g_dl": 6.4,  # Severe anemia
        "birth_weight_kg": 2.1,
        "prior_nrc_referral": True
    }
    risk = NutritionRiskEngine.evaluate_child(visit, [visit], health_record=health_record)
    assert risk.tier == RiskTier.CRITICAL
    assert risk.clinical_vulnerability_score >= 25.0
