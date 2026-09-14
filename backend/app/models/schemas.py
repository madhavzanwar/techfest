"""
Data schemas and Pydantic models for Poshan-Suraksha Platform.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum

class UserRole(str, Enum):
    AWW = "AWW"                         # Anganwadi Worker (Frontline worker - beat scoped)
    BLOCK_OFFICER = "BLOCK_OFFICER"     # Child Development Project Officer (CDPO - block scoped)
    DISTRICT_OFFICER = "DISTRICT_OFFICER" # District Program Officer (DPO / Collector - aggregated view)
    ADMIN = "ADMIN"                     # State/Tech Admin with audit privileges

class RiskTier(str, Enum):
    NORMAL = "NORMAL"
    WATCH = "WATCH"
    CRITICAL = "CRITICAL"

class GrowthVisit(BaseModel):
    visit_month_index: int              # 0 = Current, -1 = 1 month ago, -2 = 2 months ago
    visit_date: str
    weight_kg: float
    height_cm: float
    muac_mm: float
    oedema: bool = False
    waz: float                          # Weight-for-Age Z score
    haz: float                          # Height-for-Age Z score
    whz: float                          # Weight-for-Height Z score

class RiskAssessment(BaseModel):
    tier: RiskTier
    composite_score: float = Field(..., ge=0.0, le=100.0)
    anthropometric_score: float
    velocity_score: float
    clinical_vulnerability_score: float
    primary_triggers: List[str]
    velocity_delta_whz_60d: float
    recommendation: str

class PoshanChildRecord(BaseModel):
    child_id: str                       # e.g. POSHAN-MH-NDB-10024
    pseudonym_name: str
    gender: str                         # "M" or "F"
    age_months: int
    awc_id: str                         # Anganwadi Centre ID
    block_name: str
    district_name: str
    guardian_consent_status: str        # "EXPLICIT_CONSENT_GRANTED", "PENDING", "WITHDRAWN"
    consent_timestamp: str
    growth_history: List[GrowthVisit]
    anonymized_aadhaar_hash: Optional[str] = None
    linked_rch_id: Optional[str] = None

class HealthAshaRecord(BaseModel):
    rch_id: str                         # e.g. RCH-MH-2023-88412
    child_alias: str
    gender: str
    dob_approx: str
    mother_rch_id: str
    phc_name: str
    village_name: str
    block_name: str
    immunization_status: str            # "FULL", "PARTIAL", "DELAYED", "ZERO_DOSE"
    recent_diarrhea_days: int
    recent_ari_pneumonia: bool
    anemia_hb_level_g_dl: float
    birth_weight_kg: float
    prior_nrc_referral: bool
    abha_id_stub: Optional[str] = None

class UnifiedChildProfile(BaseModel):
    child_id: str
    pseudonym_name: str
    masked_name: str                    # For district view (e.g. "S*** R***")
    gender: str
    age_months: int
    block_name: str
    awc_id: str
    phc_name: Optional[str] = None
    village_name: Optional[str] = None
    rch_id: Optional[str] = None
    abha_id: Optional[str] = None
    linkage_status: str                 # DETERMINISTIC_ABHA, PROBABILISTIC_HIGH, UNLINKED
    linkage_confidence: float
    consent_status: str
    current_weight: float
    current_height: float
    current_muac: float
    current_waz: float
    current_haz: float
    current_whz: float
    oedema: bool
    hb_level: Optional[float] = None
    immunization_status: Optional[str] = None
    recent_diarrhea_days: Optional[int] = 0
    recent_ari: Optional[bool] = False
    prior_nrc: Optional[bool] = False
    growth_history: List[GrowthVisit]
    risk: RiskAssessment

class EscalationCase(BaseModel):
    case_id: str
    child_id: str
    child_name: str
    block_name: str
    awc_id: str
    risk_tier: RiskTier
    composite_score: float
    trigger_summary: str
    assigned_role: str
    sla_hours: int
    hours_remaining: float
    sla_status: str                     # "ON_TRACK", "APPROACHING_BREACH", "BREACHED"
    case_status: str                    # "PENDING_ACTION", "ACTIONED", "RESOLVED"
    created_at: str
    latest_action: Optional[str] = None
    action_taken_by: Optional[str] = None
    action_notes: Optional[str] = None

class ActionRequest(BaseModel):
    action_type: str                    # e.g. "HOME_VISIT_CONDUCTED", "NRC_ADMISSION_INITIATED", "THR_DOUBLE_RATION_ISSUED", "PHC_DOCTOR_EXAMINATION"
    notes: str
    officer_name: str

class AuditLogEntry(BaseModel):
    id: Optional[int] = None
    timestamp: str
    user_role: str
    user_id: str
    action: str                         # VIEW_CASE, ESCALATE, RESOLVE_CASE, QUERY_ANALYTICS, LINK_IDENTITY
    resource_accessed: str
    justification: str
    pii_redacted: bool
    ip_hash: str

class OverviewStats(BaseModel):
    total_children_monitored: int
    critical_count: int
    watch_count: int
    normal_count: int
    critical_pct: float
    watch_pct: float
    normal_pct: float
    stunting_pct: float
    wasting_pct: float
    sam_pct: float
    underweight_pct: float
    interoperability_link_rate: float
    escalation_sla_compliance_pct: float
    cases_pending_action: int
    block_breakdown: List[dict]
    trend_distribution: List[dict]
