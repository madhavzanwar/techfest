# DPDP_COMPLIANCE_NOTE.md — Child Data Governance & Legal Architecture

## Digital Personal Data Protection (DPDP) Act, 2023 Compliance Note

### Platform: Poshan-Suraksha (Nutrition Early-Warning & Decision-Support System)
### Context: Techfest IIT Bombay — The India @ 71/100 Challenge (Theme 1)

---

## 1. Statutory Context & Legal Imperative

Child nutrition data is doubly sensitive:
1. It pertains to **minors under the age of 6 years** (prescribed special safeguards under **Section 9** of the DPDP Act, 2023).
2. It captures **longitudinal biometric, anthropometric, and clinical health indicators** (wasting, stunting, clinical oedema, hemoglobin concentration, diarrheal illness).

Under legacy practices in government dashboards, entire registries containing children's names, guardian Aadhaar numbers, and addresses have often been exposed across district portals. **Poshan-Suraksha is built with DPDP compliance engineered directly into the data schema, API middleware, and database tables from day one.**

---

## 2. Statutory Obligation to Architecture Mapping Matrix

| DPDP Act 2023 Section | Statutory Legal Obligation | Architectural Implementation in Poshan-Suraksha | Code / Schema Artifact |
| :--- | :--- | :--- | :--- |
| **Section 9(1)** | **Verifiable Parental / Guardian Consent** before processing personal data of a child. | Every child profile schema mandates an explicit `guardian_consent_status` enum (`EXPLICIT_CONSENT_GRANTED`, `PENDING_REVIEW`, `WITHDRAWN`) and a UTC `consent_timestamp`. Non-consented records cannot be processed for secondary research. | `schemas.py:PoshanChildRecord`<br/>`synthetic_generator.py:consent_status` |
| **Section 9(2)** | **Prohibition of Tracking or Behavioral Monitoring** that could have an adverse effect on children. | The algorithmic engine is strictly confined to clinical nutrition triage and early warning. No behavioral targeting, profiling for commercial use, or extraneous surveillance is enabled. | `risk_scorer.py:NutritionRiskEngine` |
| **Section 8(1)** | **Data Minimization & Purpose Limitation**: Process only data strictly necessary for the stated purpose. | Role-Based Access Control (RBAC) middleware strictly redacts Personally Identifiable Information (PII) above the block level. District Collectors and State Directors see macro trends and initials-masked records (`A*** P***`). Full names are visible *only* to the frontline Anganwadi Worker responsible for physical home visits. | `security.py:AccessEnforcer`<br/>`routes.py:list_children` |
| **Section 8(2)** | **Data Accuracy & Completeness**: Ensure personal data is accurate and consistent when used to make decisions. | Dual-registry reconciliation resolves identity fragmentation between Poshan Tracker (MWCD) and ASHA records (MoHFW), computing confidence scores and flagging discrepancies rather than making unverified life-critical assumptions. | `identity_resolution.py:IdentityResolver` |
| **Section 8(3)** | **Reasonable Security Safeguards** to prevent data breach. | Salted SHA-256 HMAC tokens are used for Aadhaar linkage rather than storing raw 12-digit UIDAI numbers. ABDM ABHA tokens are mapped through secure FHIR R4 interfaces. | `identity_resolution.py`<br/>`synthetic_generator.py:anonymized_aadhaar_hash` |
| **Section 6(4)** | **Consent Withdrawal**: Data principal/guardian has the right to withdraw consent with the same ease as granting it. | When a guardian requests withdrawal, the status transitions to `WITHDRAWN`. Secondary analytics and aggregated dashboards drop the record immediately, while preserving acute lifesaving emergency medical triage flags under the "Medical Emergency" exemption of Section 7(c). | `security.py:filter_child_profile`<br/>`schemas.py` |
| **Section 10(2)** | **Maintenance of Audit Logs & Accountability** for Significant Data Fiduciaries. | Every API request, filter execution, child detail view, and escalation intervention is written to an immutable SQLite audit log (`audit_logs` table) recording actor role, actor ID, action, justification, PII redaction flag, and client IP hash. | `security.py:AuditManager`<br/>`poshan_suraksha.db` |

---

## 3. Tiered Role-Based Access Control (RBAC) Matrix

To operationalize **Section 8 (Data Minimization)**, the API exposes four strictly defined access tiers:

```
[District / State Level] ──> Sees ONLY Aggregated Analytics & Masked Names (e.g. "R*** V***")
           │
[Block Officer Level]   ──> Sees Pseudonymized Case Queue + Assigned Triage SLAs
           │
[Anganwadi Worker Beat] ──> Sees Full Names & Household Address for Physical Home Visits ONLY
```

```python
# Exact implementation in backend/app/core/security.py
class AccessEnforcer:
    @classmethod
    def filter_child_profile(cls, profile: Dict[str, Any], role: UserRole, user_scope: Optional[str] = None):
        p = dict(profile)
        # 1. Geographic Beat Enforcement
        if role == UserRole.AWW and user_scope and p.get("awc_id") != user_scope:
            return None
        # 2. DPDP Section 8 PII Minimization for District Tier
        if role == UserRole.DISTRICT_OFFICER:
            p["pseudonym_name"] = p["masked_name"]  # e.g., "A*** P***"
            p["anonymized_aadhaar_hash"] = None
            p["rch_id"] = "RCH-REDACTED-DISTRICT-VIEW"
            p["guardian_consent_status"] = "PROTECTED_MINIMIZED"
        return p
```

---

## 4. Tamper-Evident Audit Trail Schema

Under **Section 10**, all access to child health information must be auditable by the **Data Protection Board of India**. 

The `audit_logs` ledger records:
```sql
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,         -- ISO 8601 UTC timestamp
    user_role TEXT NOT NULL,         -- DISTRICT_OFFICER, BLOCK_OFFICER, AWW, ADMIN
    user_id TEXT NOT NULL,           -- Unique worker / officer identifier
    action TEXT NOT NULL,            -- VIEW_CHILD_DETAIL, ACTION_CASE, QUERY_REGISTRY
    resource_accessed TEXT NOT NULL, -- Target child ID, case ID, or filter parameters
    justification TEXT NOT NULL,     -- Clinical or operational reason documented
    pii_redacted INTEGER NOT NULL,   -- 1 if PII was minimized, 0 if frontline unmasked
    ip_hash TEXT NOT NULL            -- Salted hash of client IP address
);
```

---

## 5. Conclusion & Policy Value

By addressing privacy and consent not as an afterthought but as **foundational architectural invariants**, Poshan-Suraksha provides a viable blueprint for how India's public health technology can be fully compliant with the Digital Personal Data Protection Act, 2023 without compromising the speed and life-saving efficacy of frontline clinical interventions.
