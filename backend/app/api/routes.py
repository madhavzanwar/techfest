"""
FastAPI REST API Routes for Poshan-Suraksha Platform.
Exposes endpoints for epidemiological overview, role-scoped child profiles,
escalation queue, ABDM interoperability, and DPDP audit logs.
"""
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, Request
from backend.app.core.config import settings
from backend.app.core.security import AccessEnforcer
from backend.app.models.schemas import (
    UserRole, RiskTier, OverviewStats, UnifiedChildProfile,
    EscalationCase, ActionRequest, AuditLogEntry
)
from backend.app.data_engine.state import db_store
from backend.app.data_engine.identity_resolution import IdentityResolver

router = APIRouter()

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "system": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "district": f"{settings.DISTRICT_NAME}, {settings.STATE_NAME}",
        "total_beneficiaries_monitored": len(db_store.unified_profiles)
    }

@router.get("/overview", response_model=OverviewStats)
def get_overview(request: Request, role: str = "DISTRICT_OFFICER"):
    """Returns macro-level epidemiological and operational KPIs."""
    db_store.audit_manager.log(
        user_role=role,
        user_id=f"{role}_USER",
        action="GET_OVERVIEW_METRICS",
        resource="DASHBOARD_OVERVIEW",
        justification="Macro monitoring and policy decision-support",
        pii_redacted=True,
        client_ip=request.client.host if request.client else "127.0.0.1"
    )
    return db_store.get_overview_stats()

@router.get("/children")
def list_children(
    request: Request,
    role: UserRole = UserRole.DISTRICT_OFFICER,
    scope: Optional[str] = None,
    block: Optional[str] = None,
    tier: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100)
):
    """
    Returns filterable, paginated child profiles with automatic Role-Based Access Control
    and DPDP Data Minimization applied.
    """
    results = []
    search_term = search.lower().strip() if search else None

    for child_id, profile in db_store.unified_profiles.items():
        # Block filter
        if block and profile["block_name"] != block:
            continue
        
        # Tier filter
        if tier and profile["risk"]["tier"] != tier.upper():
            continue

        # Search term
        if search_term:
            name_match = search_term in profile["pseudonym_name"].lower()
            id_match = search_term in child_id.lower()
            if not (name_match or id_match):
                continue

        # Apply RBAC filtering & PII redaction
        filtered = AccessEnforcer.filter_child_profile(profile, role, scope)
        if filtered:
            results.append(filtered)

    total_matches = len(results)
    start = (page - 1) * limit
    end = start + limit
    paginated = results[start:end]

    db_store.audit_manager.log(
        user_role=role.value,
        user_id=f"{role.value}_USER",
        action="QUERY_CHILDREN_LIST",
        resource=f"FILTER:block={block},tier={tier},page={page}",
        justification="Casework screening and intervention management",
        pii_redacted=(role == UserRole.DISTRICT_OFFICER),
        client_ip=request.client.host if request.client else "127.0.0.1"
    )

    return {
        "total": total_matches,
        "page": page,
        "limit": limit,
        "total_pages": (total_matches + limit - 1) // limit,
        "data": paginated
    }

@router.get("/children/{child_id}")
def get_child_detail(
    child_id: str,
    request: Request,
    role: UserRole = UserRole.DISTRICT_OFFICER,
    scope: Optional[str] = None
):
    """Retrieves deep longitudinal profile and health linkage for a specific child."""
    profile = db_store.unified_profiles.get(child_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Child profile not found")

    filtered = AccessEnforcer.filter_child_profile(profile, role, scope)
    if not filtered:
        raise HTTPException(status_code=403, detail="Access denied: Record outside worker's assigned geographic beat")

    db_store.audit_manager.log(
        user_role=role.value,
        user_id=f"{role.value}_USER",
        action="VIEW_CHILD_DETAIL",
        resource=child_id,
        justification="Clinical assessment and multi-visit growth trajectory analysis",
        pii_redacted=(role == UserRole.DISTRICT_OFFICER),
        client_ip=request.client.host if request.client else "127.0.0.1"
    )

    return filtered

@router.get("/escalations")
def list_escalations(
    request: Request,
    tier: Optional[str] = None,
    block: Optional[str] = None,
    sla_status: Optional[str] = None,
    case_status: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200)
):
    """Surfaces active prioritized escalation cases requiring frontline or administrative action."""
    cases = list(db_store.escalation_cases.values())
    
    if tier:
        cases = [c for c in cases if c.risk_tier.value == tier.upper()]
    if block:
        cases = [c for c in cases if c.block_name == block]
    if sla_status:
        cases = [c for c in cases if c.sla_status == sla_status.upper()]
    if case_status:
        cases = [c for c in cases if c.case_status == case_status.upper()]

    # Sort priority: Critical first, then by hours_remaining ascending (urgency)
    tier_weight = {RiskTier.CRITICAL: 0, RiskTier.WATCH: 1, RiskTier.NORMAL: 2}
    cases.sort(key=lambda x: (tier_weight.get(x.risk_tier, 3), x.hours_remaining))

    return {
        "count": len(cases),
        "cases": [c.model_dump() for c in cases[:limit]]
    }

@router.post("/escalations/{case_id}/action")
def record_escalation_action(
    case_id: str,
    action_req: ActionRequest,
    request: Request,
    role: UserRole = UserRole.BLOCK_OFFICER
):
    """Records an administrative or clinical intervention on an escalated case."""
    case = db_store.escalation_cases.get(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Escalation case not found")

    # Record in persistent SQLite audit table
    db_store.audit_manager.record_escalation_action(
        case_id=case_id,
        child_id=case.child_id,
        action_type=action_req.action_type,
        officer_name=action_req.officer_name,
        notes=action_req.notes
    )

    # Update in-memory case state
    case.case_status = "ACTIONED"
    case.latest_action = action_req.action_type
    case.action_taken_by = action_req.officer_name
    case.action_notes = action_req.notes

    # Also log in DPDP audit log
    db_store.audit_manager.log(
        user_role=role.value,
        user_id=action_req.officer_name,
        action="RECORD_ESCALATION_INTERVENTION",
        resource=case_id,
        justification=f"Intervention recorded: {action_req.action_type} - {action_req.notes}",
        pii_redacted=False,
        client_ip=request.client.host if request.client else "127.0.0.1"
    )

    return {
        "status": "success",
        "message": f"Intervention '{action_req.action_type}' successfully logged for case {case_id}",
        "updated_case": case.model_dump()
    }

@router.get("/escalations/{case_id}/history")
def get_case_action_history(case_id: str):
    """Retrieves full intervention history for a given case."""
    actions = db_store.audit_manager.get_case_actions(case_id)
    return {"case_id": case_id, "actions": actions}

@router.get("/interoperability/stats")
def get_interoperability_stats():
    """Returns analytics on identity resolution, ABHA penetration, and linkage confidence."""
    total = len(db_store.unified_profiles)
    status_counts = {"DETERMINISTIC_ABHA": 0, "DETERMINISTIC_AADHAAR_HASH": 0, "PROBABILISTIC_HIGH": 0, "PROBABILISTIC_MEDIUM": 0, "UNLINKED": 0}
    
    for p in db_store.unified_profiles.values():
        st = p["linkage_status"]
        if st in status_counts:
            status_counts[st] += 1
        else:
            status_counts["UNLINKED"] += 1

    abha_count = sum(1 for p in db_store.unified_profiles.values() if p["abha_id"])
    linked_total = total - status_counts["UNLINKED"]

    return {
        "total_records": total,
        "total_linked": linked_total,
        "overall_linkage_rate_pct": round(linked_total / total * 100, 1),
        "abha_coverage_pct": round(abha_count / total * 100, 1),
        "linkage_breakdown": [
            {"method": "ABDM ABHA Deterministic Link", "count": status_counts["DETERMINISTIC_ABHA"], "confidence": "100%", "level": "High (Gold Standard)"},
            {"method": "Salted Aadhaar Hash Match", "count": status_counts["DETERMINISTIC_AADHAAR_HASH"], "confidence": "98%", "level": "High (Biometric Blinded)"},
            {"method": "Multi-Parameter Probabilistic (High)", "count": status_counts["PROBABILISTIC_HIGH"], "confidence": "80-95%", "level": "Medium-High"},
            {"method": "Probabilistic (Frontline Verification Needed)", "count": status_counts["PROBABILISTIC_MEDIUM"], "confidence": "60-79%", "level": "Medium"},
            {"method": "Unlinked / Orphaned Health Records", "count": status_counts["UNLINKED"], "confidence": "<60%", "level": "Unresolved"}
        ]
    }

@router.post("/interoperability/match-single")
def match_single_pair(poshan_record: dict, asha_record: dict):
    """Interactive endpoint to test and demonstrate the matching algorithm in real-time."""
    status, conf, explanation = IdentityResolver.match_records(poshan_record, asha_record)
    return {
        "linkage_status": status,
        "confidence_score": conf,
        "matching_analysis": explanation
    }

@router.get("/interoperability/abdm-bundle/{child_id}")
def get_abdm_fhir_bundle(child_id: str):
    """Outputs an ABDM-compliant FHIR R4 Bundle for the requested child."""
    profile = db_store.unified_profiles.get(child_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Child profile not found")
    return IdentityResolver.export_abdm_fhir_bundle(profile)

@router.get("/audit-logs", response_model=List[AuditLogEntry])
def get_audit_logs(limit: int = 50):
    """Surfaces the immutable audit trail for DPDP compliance and supervisory oversight."""
    return db_store.audit_manager.get_recent_logs(limit=limit)
