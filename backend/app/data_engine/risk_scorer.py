"""
Risk-Fusion & Clinical Triage Scoring Engine.
Implements a multi-parameter early warning composite risk index for child undernutrition.
"""
from typing import List, Optional
from backend.app.models.schemas import RiskTier, RiskAssessment, GrowthVisit
from backend.app.data_engine.who_standards import classify_muac

class NutritionRiskEngine:
    """
    Triage-style Composite Risk Engine combining:
    1. Anthropometric Domain (Weight: 40%) - Wasting, Stunting, Underweight, MUAC, Oedema
    2. Longitudinal Velocity Domain (Weight: 30%) - Trend & deceleration over visits (Early Warning)
    3. Health System Vulnerability Domain (Weight: 30%) - Illnesses, Anemia, Immunization, Birth weight
    """

    @classmethod
    def evaluate_child(
        cls,
        current_visit: GrowthVisit,
        growth_history: List[GrowthVisit],
        health_record: Optional[dict] = None
    ) -> RiskAssessment:
        triggers: List[str] = []

        # =====================================================================
        # 1. ANTHROPOMETRIC DOMAIN (Max 40 points)
        # =====================================================================
        anthro_score = 0.0
        
        # Clinical fail-safe condition: Bilateral pitting oedema (Kwashiorkor)
        if current_visit.oedema:
            anthro_score += 40.0
            triggers.append("CRITICAL: Bilateral Pitting Oedema Present (Kwashiorkor Clinical Emergency)")

        # Weight-for-Height (Wasting / SAM / MAM)
        if current_visit.whz < -3.0:
            anthro_score += 35.0
            triggers.append(f"Severe Wasting (WHZ {current_visit.whz:.2f} < -3.0 SD)")
        elif current_visit.whz < -2.0:
            anthro_score += 22.0
            triggers.append(f"Moderate Wasting (WHZ {current_visit.whz:.2f} < -2.0 SD)")
        elif current_visit.whz < -1.0:
            anthro_score += 10.0
            triggers.append(f"Mild Wasting / At Risk (WHZ {current_visit.whz:.2f})")

        # MUAC Red/Yellow Zone
        muac_class = classify_muac(current_visit.muac_mm)
        if muac_class == "SAM":
            anthro_score += 35.0
            triggers.append(f"Red Tape MUAC ({current_visit.muac_mm:.0f} mm < 115 mm)")
        elif muac_class == "MAM":
            anthro_score += 20.0
            triggers.append(f"Yellow Tape MUAC ({current_visit.muac_mm:.0f} mm, 115-124 mm)")

        # Height-for-Age (Stunting - Chronic Deprivation)
        if current_visit.haz < -3.0:
            anthro_score += 15.0
            triggers.append(f"Severe Chronic Stunting (HAZ {current_visit.haz:.2f} < -3.0 SD)")
        elif current_visit.haz < -2.0:
            anthro_score += 8.0
            triggers.append(f"Stunted Linear Growth (HAZ {current_visit.haz:.2f} < -2.0 SD)")

        # Weight-for-Age (Underweight)
        if current_visit.waz < -3.0:
            anthro_score += 12.0
            triggers.append(f"Severely Underweight (WAZ {current_visit.waz:.2f} < -3.0 SD)")
        elif current_visit.waz < -2.0:
            anthro_score += 6.0

        anthro_score = min(anthro_score, 40.0)

        # =====================================================================
        # 2. LONGITUDINAL VELOCITY DOMAIN (Max 30 points) - THE EARLY WARNING CORE
        # =====================================================================
        velocity_score = 0.0
        delta_whz = 0.0

        if len(growth_history) >= 2:
            prev_visit = growth_history[-2]
            delta_whz = current_visit.whz - prev_visit.whz
            delta_waz = current_visit.waz - prev_visit.waz
            delta_weight = current_visit.weight_kg - prev_visit.weight_kg

            # Velocity deceleration triggers: A child dropping rapidly BEFORE hitting -2.0 or -3.0
            if delta_whz <= -1.0:
                velocity_score += 28.0
                triggers.append(f"EARLY WARNING: Acute WHZ Collapse ({delta_whz:.2f} SD drop in 30-60d)")
            elif delta_whz <= -0.5:
                velocity_score += 18.0
                triggers.append(f"EARLY WARNING: Growth Faltering ({delta_whz:.2f} SD drop over visits)")
            elif delta_whz <= -0.25:
                velocity_score += 8.0

            # Weight stagnation or loss
            if delta_weight < -0.2:
                velocity_score += 15.0
                triggers.append(f"Absolute Weight Loss ({abs(delta_weight):.2f} kg decrease)")
            elif abs(delta_weight) <= 0.05 and current_visit.waz < -1.0:
                velocity_score += 10.0
                triggers.append("Weight Stagnation during critical growth window")
        else:
            # Baseline single-visit (no historical velocity available yet)
            velocity_score = 5.0  # neutral uncertainty buffer

        velocity_score = min(velocity_score, 30.0)

        # =====================================================================
        # 3. HEALTH SYSTEM VULNERABILITY DOMAIN (Max 30 points) - ASHA INTEGRATION
        # =====================================================================
        health_score = 0.0
        if health_record:
            # Immunization status
            imm = health_record.get("immunization_status", "FULL")
            if imm == "ZERO_DOSE":
                health_score += 12.0
                triggers.append("Zero-Dose Child (Completely Unvaccinated)")
            elif imm in ("PARTIAL", "DELAYED"):
                health_score += 6.0
                triggers.append("Delayed/Incomplete Immunization Cascade")

            # Recent morbidity (Diarrhea impairs nutrient absorption dramatically)
            diarrhea_days = health_record.get("recent_diarrhea_days", 0)
            if diarrhea_days >= 5:
                health_score += 10.0
                triggers.append(f"Protracted Diarrhea ({diarrhea_days} days in past month)")
            elif diarrhea_days >= 2:
                health_score += 6.0
                triggers.append(f"Recent Diarrhea Episode ({diarrhea_days} days)")

            # Acute Respiratory Infection / Pneumonia
            if health_record.get("recent_ari_pneumonia", False):
                health_score += 8.0
                triggers.append("Acute Respiratory Infection (ARI) within 30 days")

            # Hemoglobin / Anemia
            hb = health_record.get("anemia_hb_level_g_dl")
            if hb is not None:
                if hb < 7.0:
                    health_score += 12.0
                    triggers.append(f"Severe Clinical Anemia (Hb {hb:.1f} g/dL < 7.0)")
                elif hb < 10.0:
                    health_score += 6.0
                    triggers.append(f"Moderate Anemia (Hb {hb:.1f} g/dL < 10.0)")

            # Low birth weight / vulnerability history
            if health_record.get("birth_weight_kg", 3.0) < 2.5:
                health_score += 5.0
                triggers.append(f"Low Birth Weight History ({health_record.get('birth_weight_kg')} kg)")

            if health_record.get("prior_nrc_referral", False):
                health_score += 8.0
                triggers.append("Prior NRC (Nutritional Rehabilitation Centre) Admission")
        else:
            # Health record not yet interoperable / unlinked
            health_score = 6.0  # modest informational deficit score

        health_score = min(health_score, 30.0)

        # =====================================================================
        # COMPOSITE SCORE & TIER DETERMINATION
        # =====================================================================
        composite_score = round(anthro_score + velocity_score + health_score, 1)

        # Fail-safe immediate critical overrides (clinical red lines)
        is_hard_critical = (
            current_visit.oedema or
            current_visit.whz < -3.0 or
            muac_class == "SAM" or
            (health_record and health_record.get("anemia_hb_level_g_dl", 12.0) < 7.0 and current_visit.whz < -2.0)
        )

        if is_hard_critical or composite_score >= 65.0:
            tier = RiskTier.CRITICAL
            recommendation = (
                "EMERGENCY PROTOCOL (SLA: 48h): Fast-track referral to Primary Health Centre Medical Officer "
                "or nearest Nutritional Rehabilitation Centre (NRC). Dispatch ASHA & AWW for emergency home visit "
                "with Therapeutic Nutrition (F-75/F-100 or Bal Amrut/THR) protocol."
            )
        elif composite_score >= 35.0 or delta_whz <= -0.75:
            tier = RiskTier.WATCH
            recommendation = (
                "EARLY WARNING PROTOCOL (SLA: 7 Days): Targeted Anganwadi intervention. Issue double-ration "
                "Take-Home Ration (THR), schedule biometric re-weigh within 14 days, and review sanitation/illness history."
            )
        else:
            tier = RiskTier.NORMAL
            recommendation = "ROUTINE PROTOCOL: Regular monthly growth monitoring and age-appropriate complementary feeding guidance."

        return RiskAssessment(
            tier=tier,
            composite_score=min(composite_score, 100.0),
            anthropometric_score=round(anthro_score, 1),
            velocity_score=round(velocity_score, 1),
            clinical_vulnerability_score=round(health_score, 1),
            primary_triggers=triggers if triggers else ["Standard anthropometric parameters within expected range"],
            velocity_delta_whz_60d=round(delta_whz, 2),
            recommendation=recommendation
        )
