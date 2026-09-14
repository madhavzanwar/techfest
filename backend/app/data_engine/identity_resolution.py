"""
Identity-Resolution & Interoperability Layer.
Reconciles Poshan Tracker records (MWCD) with ASHA/RCH records (MoHFW) and aligns with ABDM (Ayushman Bharat Digital Mission) FHIR standards.
"""
import re
from typing import Dict, Any, Tuple, Optional
from datetime import datetime

def soundex(name: str) -> str:
    """Calculates phonetic Soundex code for Indian name aliases to handle transliteration variance."""
    if not name:
        return "0000"
    name = name.upper()
    name = re.sub(r'[^A-Z]', '', name)
    if not name:
        return "0000"
    
    first_letter = name[0]
    mapping = {
        'B': '1', 'F': '1', 'P': '1', 'V': '1',
        'C': '2', 'G': '2', 'J': '2', 'K': '2', 'Q': '2', 'S': '2', 'X': '2', 'Z': '2',
        'D': '3', 'T': '3',
        'L': '4',
        'M': '5', 'N': '5',
        'R': '6'
    }
    
    encoded = [first_letter]
    prev = mapping.get(first_letter, '')
    
    for char in name[1:]:
        code = mapping.get(char, '')
        if code != '' and code != prev:
            encoded.append(code)
            prev = code
        elif code == '':
            prev = ''
        if len(encoded) == 4:
            break
            
    while len(encoded) < 4:
        encoded.append('0')
        
    return ''.join(encoded)

class IdentityResolver:
    """
    Dual-Registry Matching Service reconciling:
    - Poshan Tracker Child ID (MWCD)
    - RCH Child ID (MoHFW)
    - Ayushman Bharat ABHA Health ID (NHA)
    """

    @classmethod
    def match_records(
        cls,
        poshan_record: Dict[str, Any],
        asha_record: Dict[str, Any]
    ) -> Tuple[str, float, Dict[str, Any]]:
        """
        Executes hybrid deterministic + probabilistic record linkage.
        Returns: (link_status, confidence_score, explanation)
        """
        # Tier 1: Deterministic ABHA Match (Gold Standard under ABDM)
        poshan_abha = poshan_record.get("abha_id")
        asha_abha = asha_record.get("abha_id_stub")
        if poshan_abha and asha_abha and poshan_abha == asha_abha:
            return (
                "DETERMINISTIC_ABHA",
                1.00,
                {"method": "ABHA Direct Link", "details": f"Verified match on ABDM ABHA ID: {poshan_abha}"}
            )

        # Tier 2: Deterministic Anonymized Aadhaar Salted Hash Match
        p_hash = poshan_record.get("anonymized_aadhaar_hash")
        a_hash = asha_record.get("anonymized_aadhaar_hash")
        if p_hash and a_hash and p_hash == a_hash:
            return (
                "DETERMINISTIC_AADHAAR_HASH",
                0.98,
                {"method": "Salted Aadhaar Token Match", "details": "Matches cryptographically blinded unique biometric hash"}
            )

        # Tier 3: Probabilistic Multi-Attribute Record Linkage (Fellegi-Sunter Framework)
        score = 0.0
        weights = {}

        # 3a. Block & Geography check (Hard requirement)
        p_block = str(poshan_record.get("block_name", "")).strip().lower()
        a_block = str(asha_record.get("block_name", "")).strip().lower()
        if p_block and a_block and p_block == a_block:
            score += 0.25
            weights["block_match"] = 0.25
        else:
            return ("UNLINKED", 0.10, {"reason": "Cross-block mismatch"})

        # 3b. Exact Gender Match
        p_gender = poshan_record.get("gender", "").upper()
        a_gender = asha_record.get("gender", "").upper()
        if p_gender == a_gender:
            score += 0.15
            weights["gender_match"] = 0.15
        else:
            # Gender mismatch heavily penalizes
            return ("UNLINKED", 0.05, {"reason": "Gender conflict"})

        # 3c. Age / DOB Concordance (+/- 2 months window)
        p_age = poshan_record.get("age_months", 0)
        a_dob = asha_record.get("dob_approx", "")
        if a_dob:
            try:
                # Estimate age in months from dob
                dob_dt = datetime.strptime(a_dob, "%Y-%m-%d")
                est_age_months = max(0, int((datetime.now() - dob_dt).days / 30.4))
                diff_months = abs(p_age - est_age_months)
                if diff_months == 0:
                    score += 0.30
                    weights["age_concordance"] = 0.30
                elif diff_months <= 2:
                    score += 0.20
                    weights["age_concordance"] = 0.20
                elif diff_months <= 4:
                    score += 0.10
                    weights["age_concordance"] = 0.10
            except Exception:
                score += 0.10

        # 3d. Phonetic Soundex Match on Alias / Mother Token
        p_alias = poshan_record.get("pseudonym_name", "")
        a_alias = asha_record.get("child_alias", "")
        if p_alias and a_alias:
            if soundex(p_alias) == soundex(a_alias):
                score += 0.20
                weights["phonetic_soundex_match"] = 0.20
            elif p_alias.split()[0][:3].lower() == a_alias.split()[0][:3].lower():
                score += 0.12
                weights["prefix_match"] = 0.12

        # 3e. Village / AWC locality proximity
        if poshan_record.get("village_name") and asha_record.get("village_name"):
            if poshan_record.get("village_name").lower() == asha_record.get("village_name").lower():
                score += 0.10
                weights["village_locality_match"] = 0.10

        confidence = min(round(score, 2), 0.95)

        if confidence >= 0.80:
            status = "PROBABILISTIC_HIGH"
            details = "High-confidence multi-parameter linkage across geography, age, and phonetic tokens."
        elif confidence >= 0.60:
            status = "PROBABILISTIC_MEDIUM"
            details = "Moderate-confidence match; recommended for frontline ASHA/AWW confirmation during home visit."
        else:
            status = "UNLINKED"
            details = "Insufficient similarity across records; retained as separate unlinked registries."

        return (status, confidence, {"weights": weights, "details": details})

    @classmethod
    def export_abdm_fhir_bundle(cls, unified_profile: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transforms unified child record into an ABDM-compliant FHIR R4 JSON Bundle.
        Demonstrates adherence to National Health Authority (NHA) digital standards.
        """
        child_id = unified_profile.get("child_id")
        abha_id = unified_profile.get("abha_id", f"91-ABHA-PENDING-{child_id[-6:]}")
        
        fhir_patient = {
            "resourceType": "Patient",
            "id": f"Patient-{child_id}",
            "identifier": [
                {
                    "system": "https://healthid.abdm.gov.in",
                    "value": abha_id,
                    "type": {"text": "ABHA Number"}
                },
                {
                    "system": "https://poshantracker.gov.in",
                    "value": child_id,
                    "type": {"text": "Poshan Tracker ID"}
                }
            ],
            "gender": "male" if unified_profile.get("gender") == "M" else "female",
            "address": [{
                "district": "Nandurbar",
                "state": "Maharashtra",
                "text": f"{unified_profile.get('block_name')} Block, Nandurbar"
            }]
        }

        fhir_observation = {
            "resourceType": "Observation",
            "id": f"Observation-WHZ-{child_id}",
            "status": "final",
            "category": [{
                "coding": [{
                    "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                    "code": "vital-signs"
                }]
            }],
            "code": {
                "coding": [{
                    "system": "http://loinc.org",
                    "code": "77606-2",
                    "display": "Weight-for-length/height z-score"
                }]
            },
            "subject": {"reference": f"Patient/{child_id}"},
            "valueQuantity": {
                "value": unified_profile.get("current_whz"),
                "unit": "SD",
                "system": "http://unitsofmeasure.org"
            },
            "interpretation": [{
                "coding": [{
                    "system": "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
                    "code": "LL" if unified_profile.get("current_whz", 0) < -2.0 else "N",
                    "display": "Critical Low" if unified_profile.get("current_whz", 0) < -2.0 else "Normal"
                }]
            }]
        }

        return {
            "resourceType": "Bundle",
            "type": "collection",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "entry": [
                {"resource": fhir_patient},
                {"resource": fhir_observation}
            ]
        }
