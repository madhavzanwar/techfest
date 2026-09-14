"""
In-Memory State Store & Escalation Queue Manager.
Loads synthetic cohorts, indexes them for high-speed API retrieval, and tracks live escalations.
"""
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from backend.app.core.config import settings
from backend.app.core.security import AuditManager
from backend.app.models.schemas import RiskTier, EscalationCase, OverviewStats
from backend.app.data_engine.synthetic_generator import generate_synthetic_ecosystem

class DataStore:
    def __init__(self):
        self.poshan_records: Dict[str, Any] = {}
        self.asha_records: Dict[str, Any] = {}
        self.unified_profiles: Dict[str, Any] = {}
        self.escalation_cases: Dict[str, EscalationCase] = {}
        self.audit_manager = AuditManager()
        self.initialized = False

    def initialize(self, count: int = 3500):
        if self.initialized:
            return
        
        print(f"[*] Initializing Poshan-Suraksha data engine with {count} children...")
        poshan_list, asha_list, unified_list = generate_synthetic_ecosystem(count=count, random_seed=42)
        
        self.poshan_records = {r["child_id"]: r for r in poshan_list}
        self.asha_records = {r["rch_id"]: r for r in asha_list}
        self.unified_profiles = {p["child_id"]: p for p in unified_list}

        # Seed Escalation Queue for Critical and Watch cases
        from datetime import timezone
        now = datetime.now(timezone.utc)
        case_idx = 1
        for child_id, p in self.unified_profiles.items():
            risk_tier = p["risk"]["tier"]
            if risk_tier in [RiskTier.CRITICAL.value, RiskTier.WATCH.value]:
                case_id = f"ESC-{p['block_name'][:3].upper()}-{case_idx:05d}"
                is_crit = (risk_tier == RiskTier.CRITICAL.value)
                sla_hrs = settings.SLA_CRITICAL_HOURS if is_crit else settings.SLA_WATCH_HOURS
                
                # Realistic elapsed hours distribution with healthy variance
                # case_idx modulo variation creates realistic spread: on track, approaching breach, breached, actioned
                spread_seed = (case_idx * 7) % 100
                if spread_seed < 15:
                    # Breached
                    elapsed_hrs = round(sla_hrs + (case_idx % 8) + 1.5, 1)
                    sla_status = "BREACHED"
                    case_status = "PENDING_ACTION"
                elif spread_seed < 35:
                    # Approaching breach (urgent warning)
                    elapsed_hrs = round(sla_hrs - (3 + (case_idx % 8)), 1)
                    sla_status = "APPROACHING_BREACH"
                    case_status = "PENDING_ACTION"
                elif spread_seed < 85:
                    # On track (standard queue)
                    elapsed_hrs = round((case_idx * 2.3) % (sla_hrs * 0.65), 1)
                    sla_status = "ON_TRACK"
                    case_status = "PENDING_ACTION"
                else:
                    # Already actioned by frontline supervisor
                    elapsed_hrs = round((case_idx * 1.5) % (sla_hrs * 0.7), 1)
                    sla_status = "ON_TRACK"
                    case_status = "ACTIONED"

                hours_remaining = max(0.0, round(sla_hrs - elapsed_hrs, 1))

                assigned_role = "PHC Medical Officer & CDPO" if is_crit else "ASHA Lead & Anganwadi Supervisor"
                
                latest_act = None
                act_by = None
                act_notes = None
                if case_status == "ACTIONED":
                    latest_act = "THR_DOUBLE_RATION_ISSUED" if not is_crit else "PHC_DOCTOR_EXAMINATION"
                    act_by = "AWW Sunita Padvi" if not is_crit else "Dr. V. Patil (MO)"
                    act_notes = "Beneficiary assessed and emergency intervention logged per SOP."

                case = EscalationCase(
                    case_id=case_id,
                    child_id=child_id,
                    child_name=p["pseudonym_name"],
                    block_name=p["block_name"],
                    awc_id=p["awc_id"],
                    risk_tier=RiskTier(risk_tier),
                    composite_score=p["risk"]["composite_score"],
                    trigger_summary="; ".join(p["risk"]["primary_triggers"][:2]),
                    assigned_role=assigned_role,
                    sla_hours=sla_hrs,
                    hours_remaining=hours_remaining,
                    sla_status=sla_status,
                    case_status=case_status,
                    created_at=(now - timedelta(hours=elapsed_hrs)).isoformat(),
                    latest_action=latest_act,
                    action_taken_by=act_by,
                    action_notes=act_notes
                )
                self.escalation_cases[case_id] = case
                case_idx += 1

        # Pre-seed realistic audit log entries demonstrating DPDP compliance
        self.audit_manager.log(
            user_role="SYSTEM",
            user_id="CRON_DATA_INGEST",
            action="INGEST_SYNTHETIC_COHORT",
            resource=f"Nandurbar-Cohort-{count}",
            justification="Scheduled daily ingestion & Z-score recalculation",
            pii_redacted=True
        )
        self.audit_manager.log(
            user_role="DISTRICT_OFFICER",
            user_id="DPO_NANDURBAR_01",
            action="QUERY_ANALYTICS",
            resource="DISTRICT_EPIDEMIOLOGY_DASHBOARD",
            justification="Quarterly Poshan Abhiyaan convergence review",
            pii_redacted=True
        )
        self.audit_manager.log(
            user_role="BLOCK_OFFICER",
            user_id="CDPO_DHADGAON",
            action="VIEW_ESCALATION_QUEUE",
            resource="DHADGAON_CRITICAL_CASES",
            justification="Weekly SAM triage and NRC referral coordination",
            pii_redacted=False
        )

        self.initialized = True
        print(f"[OK] Data engine initialized: {len(self.unified_profiles)} profiles, {len(self.escalation_cases)} escalated cases.")

    def get_overview_stats(self) -> OverviewStats:
        total = len(self.unified_profiles)
        if total == 0:
            return OverviewStats(
                total_children_monitored=0, critical_count=0, watch_count=0, normal_count=0,
                critical_pct=0, watch_pct=0, normal_pct=0, stunting_pct=0, wasting_pct=0,
                sam_pct=0, underweight_pct=0, interoperability_link_rate=0,
                escalation_sla_compliance_pct=0, cases_pending_action=0,
                block_breakdown=[], trend_distribution=[]
            )

        crit = sum(1 for p in self.unified_profiles.values() if p["risk"]["tier"] == RiskTier.CRITICAL.value)
        watch = sum(1 for p in self.unified_profiles.values() if p["risk"]["tier"] == RiskTier.WATCH.value)
        norm = total - crit - watch

        stunted = sum(1 for p in self.unified_profiles.values() if p["current_haz"] < -2.0)
        wasted = sum(1 for p in self.unified_profiles.values() if p["current_whz"] < -2.0)
        sam = sum(1 for p in self.unified_profiles.values() if p["current_whz"] < -3.0 or p["current_muac"] < 115 or p["oedema"])
        underweight = sum(1 for p in self.unified_profiles.values() if p["current_waz"] < -2.0)
        linked = sum(1 for p in self.unified_profiles.values() if p["linkage_status"] != "UNLINKED")

        # SLA compliance rate
        pending_cases = list(self.escalation_cases.values())
        on_track = sum(1 for c in pending_cases if c.sla_status != "BREACHED")
        sla_comp = round((on_track / len(pending_cases) * 100.0), 1) if pending_cases else 100.0

        # Block breakdown
        block_map = {}
        for b in settings.BLOCKS:
            block_map[b] = {"block_name": b, "total": 0, "critical": 0, "watch": 0, "normal": 0, "stunting": 0, "sam": 0}

        for p in self.unified_profiles.values():
            b = p["block_name"]
            if b in block_map:
                block_map[b]["total"] += 1
                tier = p["risk"]["tier"]
                if tier == RiskTier.CRITICAL.value:
                    block_map[b]["critical"] += 1
                elif tier == RiskTier.WATCH.value:
                    block_map[b]["watch"] += 1
                else:
                    block_map[b]["normal"] += 1
                if p["current_haz"] < -2.0:
                    block_map[b]["stunting"] += 1
                if p["current_whz"] < -3.0 or p["current_muac"] < 115:
                    block_map[b]["sam"] += 1

        # Trend over the 3 observation months
        t2_crit = sum(1 for p in self.unified_profiles.values() if p["growth_history"][0]["whz"] < -3.0)
        t1_crit = sum(1 for p in self.unified_profiles.values() if p["growth_history"][1]["whz"] < -3.0)
        t0_crit = sam

        trend_distribution = [
            {"month": "Month T-2 (June)", "critical_sam": t2_crit, "moderate_mam": int(wasted * 0.95), "normal": total - t2_crit - int(wasted * 0.95)},
            {"month": "Month T-1 (July)", "critical_sam": t1_crit, "moderate_mam": int(wasted * 0.98), "normal": total - t1_crit - int(wasted * 0.98)},
            {"month": "Month T0 (August Current)", "critical_sam": t0_crit, "moderate_mam": wasted - sam, "normal": total - wasted}
        ]

        return OverviewStats(
            total_children_monitored=total,
            critical_count=crit,
            watch_count=watch,
            normal_count=norm,
            critical_pct=round(crit / total * 100, 1),
            watch_pct=round(watch / total * 100, 1),
            normal_pct=round(norm / total * 100, 1),
            stunting_pct=round(stunted / total * 100, 1),
            wasting_pct=round(wasted / total * 100, 1),
            sam_pct=round(sam / total * 100, 1),
            underweight_pct=round(underweight / total * 100, 1),
            interoperability_link_rate=round(linked / total * 100, 1),
            escalation_sla_compliance_pct=sla_comp,
            cases_pending_action=len([c for c in pending_cases if c.case_status == "PENDING_ACTION"]),
            block_breakdown=list(block_map.values()),
            trend_distribution=trend_distribution
        )

db_store = DataStore()
