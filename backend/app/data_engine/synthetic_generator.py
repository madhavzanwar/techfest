"""
Synthetic Data Generation Engine for Maternal & Child Nutrition.
Calibrated to NFHS-5 (2019-21) and WHO Child Growth Standards.
Simulates 3,500 children across 5 blocks in Nandurbar District, Maharashtra.
"""
import random
import hashlib
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Any
from backend.app.core.config import settings
from backend.app.models.schemas import GrowthVisit
from backend.app.data_engine.who_standards import (
    compute_waz, compute_haz, compute_whz,
    WFA_BOYS_LMS, WFA_GIRLS_LMS,
    HFA_BOYS_LMS, HFA_GIRLS_LMS,
    _interpolate_lms
)
from backend.app.data_engine.risk_scorer import NutritionRiskEngine
from backend.app.data_engine.identity_resolution import IdentityResolver

# Frontline locality seeds
FIRST_NAMES_M = ["Aarav", "Rohan", "Sachin", "Ganesh", "Suraj", "Vishal", "Akash", "Rahul", "Dinesh", "Kunal", "Mahesh", "Nikhil", "Pravin", "Swapnil", "Ajay"]
FIRST_NAMES_F = ["Ananya", "Pooja", "Aarti", "Sunita", "Meena", "Kavita", "Roshni", "Payal", "Shital", "Jyoti", "Sakshi", "Pallavi", "Usha", "Dipali", "Neha"]
LAST_NAMES = ["Pawra", "Valvi", "Gavit", "Naik", "Bhil", "Vasave", "Patil", "Padvi", "Thakre", "Shinde", "More", "Borse"]

VILLAGES_BY_BLOCK = {
    "Dhadgaon": ["Chandsaili", "Bijari", "Roshamal", "Toranmal", "Khuntamodi", "Telkhedi"],
    "Akkalkuwa": ["Molgi", "Kathi", "Khadki", "Dab", "Gora", "Surgas"],
    "Shahada": ["Kheddigar", "Prakasha", "Sarangkheda", "Balsane", "Mhasawad"],
    "Taloda": ["Borad", "Somaval", "Modh", "Ranjani", "Pratappur"],
    "Nandurbar Rural": ["Kopare", "Waghale", "Chaupale", "Dhanora", "Hol"]
}

def generate_synthetic_ecosystem(count: int = 3500, random_seed: int = 42) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Generates:
    1. Poshan Tracker Anganwadi records (MWCD)
    2. ASHA / Health records (MoHFW)
    3. Fused child profiles with risk triage scores
    """
    random.seed(random_seed)
    base_date = datetime(2026, 8, 15)

    poshan_records: List[Dict[str, Any]] = []
    asha_records: List[Dict[str, Any]] = []
    unified_profiles: List[Dict[str, Any]] = []

    # Distribution calibration targets (NFHS-5 Nandurbar tribal benchmark):
    # Stunting target: ~42%, Wasting target: ~22.5%, SAM target: ~9%

    for i in range(1, count + 1):
        child_seq = 10000 + i
        poshan_id = f"POSHAN-MH-NDB-{child_seq}"
        gender = "M" if random.random() < 0.51 else "F"
        age_months = random.randint(6, 59)
        block = random.choice(settings.BLOCKS)
        village = random.choice(VILLAGES_BY_BLOCK[block])
        awc_id = f"AWC-{block[:3].upper()}-{village[:3].upper()}-{random.randint(1, 4):02d}"

        # Child identity names
        first_name = random.choice(FIRST_NAMES_M if gender == "M" else FIRST_NAMES_F)
        last_name = random.choice(LAST_NAMES)
        pseudonym_name = f"{first_name} {last_name}"
        masked_name = f"{first_name[0]}*** {last_name[0]}***"

        # Salted hash token for Aadhaar linkage simulation
        aadhaar_salt = f"UIDAI-SALT-{child_seq}-{last_name}"
        anonymized_aadhaar_hash = hashlib.sha256(aadhaar_salt.encode()).hexdigest()[:16]

        # ABDM ABHA assignment (Coverage ~55%)
        has_abha = random.random() < 0.55
        abha_id = f"91-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}" if has_abha else None

        # Consent status under DPDP Act 2023
        consent_rnd = random.random()
        if consent_rnd < 0.94:
            consent_status = "EXPLICIT_CONSENT_GRANTED"
        elif consent_rnd < 0.98:
            consent_status = "PENDING_GUARDIAN_REVIEW"
        else:
            consent_status = "WITHDRAWN"
        consent_timestamp = (base_date - timedelta(days=random.randint(15, 200))).strftime("%Y-%m-%dT%H:%M:%SZ")

        # Determine if this child is part of the vulnerable cluster (calibrated to NFHS-5)
        is_sam_candidate = random.random() < 0.092
        is_mam_candidate = (not is_sam_candidate) and (random.random() < 0.14)
        is_stunted_candidate = random.random() < 0.420
        has_rapid_velocity_drop = (not is_sam_candidate) and (random.random() < 0.11)

        # Baseline Median WHO values for this age/gender
        h_table = HFA_BOYS_LMS if gender == "M" else HFA_GIRLS_LMS
        w_table = WFA_BOYS_LMS if gender == "M" else WFA_GIRLS_LMS
        _, m_height, s_height = _interpolate_lms(h_table, age_months)
        _, m_weight, s_weight = _interpolate_lms(w_table, age_months)

        # -------------------------------------------------------------
        # Generate 3 longitudinal visits (Months: T-2, T-1, T_0)
        # -------------------------------------------------------------
        growth_history = []
        
        # Determine current anthropometrics based on clinical profile
        if is_sam_candidate:
            # SAM profile: WHZ < -3.0 or MUAC < 115 mm
            current_height = round(m_height * (0.91 if is_stunted_candidate else 0.96) + random.uniform(-1.0, 1.0), 1)
            current_weight = round(m_weight * random.uniform(0.60, 0.72), 2)
            current_muac = round(random.uniform(102, 114), 0)
            oedema = random.random() < 0.08  # Clinical Kwashiorkor in 8% of severe cases
        elif is_mam_candidate:
            # MAM profile: -3.0 <= WHZ < -2.0, MUAC 115-124
            current_height = round(m_height * (0.92 if is_stunted_candidate else 0.98) + random.uniform(-1.0, 1.0), 1)
            current_weight = round(m_weight * random.uniform(0.73, 0.82), 2)
            current_muac = round(random.uniform(115, 124), 0)
            oedema = False
        elif has_rapid_velocity_drop:
            # Velocity Faltering Profile (EARLY WARNING: not yet SAM, but falling fast!)
            current_height = round(m_height * 0.97 + random.uniform(-1.0, 1.0), 1)
            current_weight = round(m_weight * 0.83, 2)  # around -1.6 to -1.9 SD
            current_muac = round(random.uniform(124, 129), 0)
            oedema = False
        else:
            # Normal / Mild healthy profile
            current_height = round(m_height * (0.93 if is_stunted_candidate else 1.01) + random.uniform(-1.5, 1.5), 1)
            current_weight = round(m_weight * random.uniform(0.88, 1.15), 2)
            current_muac = round(random.uniform(130, 155), 0)
            oedema = False

        # Current Z-scores
        current_waz = compute_waz(current_weight, age_months, gender)
        current_haz = compute_haz(current_height, age_months, gender)
        current_whz = compute_whz(current_weight, current_height, gender)

        # Visit 0 (Current)
        visit_0 = {
            "visit_month_index": 0,
            "visit_date": base_date.strftime("%Y-%m-%d"),
            "weight_kg": current_weight,
            "height_cm": current_height,
            "muac_mm": current_muac,
            "oedema": oedema,
            "waz": current_waz,
            "haz": current_haz,
            "whz": current_whz
        }

        # Visit -1 (30 days ago) & Visit -2 (60 days ago)
        if has_rapid_velocity_drop:
            # Steep negative trajectory: was healthy 60 days ago, dropping sharply
            v1_weight = round(current_weight + random.uniform(0.3, 0.6), 2)
            v2_weight = round(current_weight + random.uniform(0.7, 1.1), 2)
            v1_height = round(current_height - 0.4, 1)
            v2_height = round(current_height - 0.9, 1)
        elif is_sam_candidate or is_mam_candidate:
            # Chronic poor growth
            v1_weight = round(current_weight + random.uniform(-0.1, 0.15), 2)
            v2_weight = round(current_weight + random.uniform(0.0, 0.3), 2)
            v1_height = round(current_height - 0.5, 1)
            v2_height = round(current_height - 1.0, 1)
        else:
            # Normal steady upward growth
            v1_weight = round(current_weight - random.uniform(0.15, 0.35), 2)
            v2_weight = round(current_weight - random.uniform(0.40, 0.70), 2)
            v1_height = round(current_height - 0.6, 1)
            v2_height = round(current_height - 1.2, 1)

        visit_minus1 = {
            "visit_month_index": -1,
            "visit_date": (base_date - timedelta(days=30)).strftime("%Y-%m-%d"),
            "weight_kg": v1_weight,
            "height_cm": v1_height,
            "muac_mm": current_muac + (random.uniform(2, 5) if has_rapid_velocity_drop else 0),
            "oedema": False,
            "waz": compute_waz(v1_weight, age_months - 1, gender),
            "haz": compute_haz(v1_height, age_months - 1, gender),
            "whz": compute_whz(v1_weight, v1_height, gender)
        }

        visit_minus2 = {
            "visit_month_index": -2,
            "visit_date": (base_date - timedelta(days=60)).strftime("%Y-%m-%d"),
            "weight_kg": v2_weight,
            "height_cm": v2_height,
            "muac_mm": current_muac + (random.uniform(4, 8) if has_rapid_velocity_drop else 1),
            "oedema": False,
            "waz": compute_waz(v2_weight, age_months - 2, gender),
            "haz": compute_haz(v2_height, age_months - 2, gender),
            "whz": compute_whz(v2_weight, v2_height, gender)
        }

        growth_history = [visit_minus2, visit_minus1, visit_0]

        # Poshan Tracker Master Record
        poshan_record = {
            "child_id": poshan_id,
            "pseudonym_name": pseudonym_name,
            "gender": gender,
            "age_months": age_months,
            "awc_id": awc_id,
            "block_name": block,
            "village_name": village,
            "district_name": settings.DISTRICT_NAME,
            "guardian_consent_status": consent_status,
            "consent_timestamp": consent_timestamp,
            "growth_history": growth_history,
            "anonymized_aadhaar_hash": anonymized_aadhaar_hash,
            "abha_id": abha_id
        }
        poshan_records.append(poshan_record)

        # -------------------------------------------------------------
        # Generate Parallel ASHA / Health System Record (MoHFW)
        # -------------------------------------------------------------
        # In real life, ~88% of children exist in both systems
        has_health_record = random.random() < 0.88
        health_record = None

        if has_health_record:
            rch_id = f"RCH-MH-2023-{child_seq + 30000}"
            dob_approx = (base_date - timedelta(days=int(age_months * 30.4375))).strftime("%Y-%m-%d")
            
            # Immunization distribution: Full 68%, Partial 22%, Zero-dose 10%
            imm_val = random.random()
            if is_sam_candidate and random.random() < 0.40:
                imm_status = "ZERO_DOSE"
            elif imm_val < 0.10:
                imm_status = "ZERO_DOSE"
            elif imm_val < 0.32:
                imm_status = "PARTIAL"
            else:
                imm_status = "FULL"

            # Diarrhea episodes (NFHS-5: elevated in malnourished children)
            if is_sam_candidate or has_rapid_velocity_drop:
                diarrhea_days = random.randint(3, 10) if random.random() < 0.65 else 0
                recent_ari = random.random() < 0.28
                hb_level = round(random.gauss(8.2, 1.2), 1)  # Moderate to severe anemia
                birth_weight = round(random.uniform(1.8, 2.4), 2)  # Low birth weight
            else:
                diarrhea_days = random.randint(1, 4) if random.random() < 0.12 else 0
                recent_ari = random.random() < 0.05
                hb_level = round(random.gauss(11.2, 1.4), 1)
                birth_weight = round(random.uniform(2.5, 3.4), 2)

            prior_nrc = True if (is_sam_candidate and random.random() < 0.22) else False

            # Soundex/Alias variation to test fuzzy name matching
            alias_name = pseudonym_name
            if random.random() < 0.25:
                # Transliteration phonetic spelling variation (e.g. Vikas vs Vikash, Ganesh vs Ganeshh)
                alias_name = pseudonym_name.replace("sh", "s").replace("v", "w")

            health_record = {
                "rch_id": rch_id,
                "child_alias": alias_name,
                "gender": gender,
                "dob_approx": dob_approx,
                "mother_rch_id": f"MOTH-MH-{child_seq + 10000}",
                "phc_name": f"PHC-{block[:3].upper()}-01",
                "village_name": village,
                "block_name": block,
                "immunization_status": imm_status,
                "recent_diarrhea_days": diarrhea_days,
                "recent_ari_pneumonia": recent_ari,
                "anemia_hb_level_g_dl": max(4.5, min(15.0, hb_level)),
                "birth_weight_kg": birth_weight,
                "prior_nrc_referral": prior_nrc,
                "anonymized_aadhaar_hash": anonymized_aadhaar_hash if (random.random() < 0.85) else None,
                "abha_id_stub": abha_id if (has_abha and random.random() < 0.90) else None
            }
            asha_records.append(health_record)

        # -------------------------------------------------------------
        # Reconcile via Identity Resolution Layer & Compute Risk Score
        # -------------------------------------------------------------
        if health_record:
            link_status, link_conf, _ = IdentityResolver.match_records(poshan_record, health_record)
        else:
            link_status, link_conf = "UNLINKED", 0.0

        # Formulate GrowthVisit models
        growth_models = [GrowthVisit(**v) for v in growth_history]
        current_v = growth_models[-1]

        # Clinical Triage Risk Assessment
        risk = NutritionRiskEngine.evaluate_child(
            current_visit=current_v,
            growth_history=growth_models,
            health_record=health_record
        )

        unified_child = {
            "child_id": poshan_id,
            "pseudonym_name": pseudonym_name,
            "masked_name": masked_name,
            "gender": gender,
            "age_months": age_months,
            "block_name": block,
            "awc_id": awc_id,
            "village_name": village,
            "phc_name": health_record.get("phc_name") if health_record else f"PHC-{block[:3].upper()}-01",
            "rch_id": health_record.get("rch_id") if health_record else None,
            "abha_id": abha_id,
            "linkage_status": link_status,
            "linkage_confidence": link_conf,
            "consent_status": consent_status,
            "current_weight": current_weight,
            "current_height": current_height,
            "current_muac": current_muac,
            "current_waz": current_waz,
            "current_haz": current_haz,
            "current_whz": current_whz,
            "oedema": oedema,
            "hb_level": health_record.get("anemia_hb_level_g_dl") if health_record else None,
            "immunization_status": health_record.get("immunization_status") if health_record else "UNKNOWN",
            "recent_diarrhea_days": health_record.get("recent_diarrhea_days", 0) if health_record else 0,
            "recent_ari": health_record.get("recent_ari_pneumonia", False) if health_record else False,
            "prior_nrc": health_record.get("prior_nrc_referral", False) if health_record else False,
            "growth_history": growth_history,
            "risk": risk.model_dump()
        }
        unified_profiles.append(unified_child)

    return poshan_records, asha_records, unified_profiles
