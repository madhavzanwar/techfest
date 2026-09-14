# Poshan-Suraksha: Nutrition Early-Warning & Decision-Support System
### Techfest, IIT Bombay (2026-27) — The India @ 71/100 Challenge
**Theme 1: Maternal & Early Childhood Nutrition — Data Governance & Early-Warning Decision-Support System**

[![Tests](https://img.shields.io/badge/pytest-17%20passed-brightgreen.svg)](backend/tests/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB.svg)](frontend/)
[![DPDP Act](https://img.shields.io/badge/DPDP%20Act%202023-Compliant-blueviolet.svg)](DPDP_COMPLIANCE_NOTE.md)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 1. Project Overview

India has achieved unprecedented milestones in digital welfare infrastructure, scoring **71 out of 100** on the NITI Aayog SDG India Index 2023–24. Under **Mission Poshan 2.0**, the **Poshan Tracker** application digitally tracks over **9 crore children**. 

Yet, severe undernutrition persists in underserved tribal belts (such as **Nandurbar District, Maharashtra**, where stunting exceeds 42% and wasting exceeds 22.5%). **The gap is NOT missing data — it is that this data sits in siloed dashboards, is used for retrospective compliance reporting rather than early warning, and is insulated from the health system's own records (ASHA / RCH).**

**Poshan-Suraksha** closes this gap by introducing a **clinical-triage early warning and decision-support platform**:
1. **Reconciles Siloed Ministries**: Joins Anganwadi growth records (MWCD) with ASHA illness records (MoHFW) using a 3-tier hybrid identity resolution layer (ABDM ABHA + Salted Tokens + Fellegi-Sunter probabilistic matching).
2. **Early-Warning Velocity Detection**: Fuses WHO Child Growth Standards (2006) LMS Z-scores with **60-day longitudinal growth velocity ($\Delta WHZ$)**, catching children faltering rapidly **3 to 6 weeks before SAM manifests**.
3. **Actionable Role-Based Escalation**: Enforces administrative SLAs (**48h for Critical SAM/NRC referral; 7 days for Watch/AWW home visit**) with role-based decision rights.
4. **DPDP Act, 2023 Compliance by Design**: Embeds explicit guardian consent tracking, strict Section 8 PII minimization (names masked to initials above block level), and an immutable SQLite audit ledger.

---

## 2. Repository Structure

```
techfest_iit bombay/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI application entry point & CORS
│   │   ├── api/
│   │   │   └── routes.py              # REST API endpoints (overview, children, escalations, ABDM)
│   │   ├── core/
│   │   │   ├── config.py              # Project settings, thresholds, SLAs
│   │   │   └── security.py            # RBAC enforcer, SQLite audit logger, DPDP masking
│   │   ├── models/
│   │   │   └── schemas.py             # Pydantic schemas (profiles, risks, visits, cases)
│   │   └── data_engine/
│   │       ├── state.py               # In-memory fast state indexer
│   │       ├── who_standards.py       # WHO 2006 LMS curves & Z-score formulas (WAZ, HAZ, WHZ)
│   │       ├── risk_scorer.py         # Multi-parameter triage engine & velocity faltering
│   │       ├── identity_resolution.py # Hybrid record linkage & ABDM FHIR R4 exporter
│   │       └── synthetic_generator.py # 3,500 child cohort calibrated to NFHS-5 Nandurbar
│   └── tests/
│       ├── test_who_standards.py      # Benchmark tests against published WHO Anthro tables
│       ├── test_risk_scorer.py        # Clinical emergency and velocity drop test suite
│       ├── test_identity_resolution.py# Deterministic ABHA, soundex, and cross-block tests
│       └── test_api.py                # REST endpoint, RBAC masking, and action logging tests
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navigation.jsx         # Header, role switcher, active indicators
│   │   │   ├── OverviewView.jsx       # Macro KPIs, triage donut, cross-block comparison, trend
│   │   │   ├── EscalationView.jsx     # Actionable triage queue, SLA countdowns, intervention modal
│   │   │   ├── ChildrenView.jsx       # Searchable registry with RBAC PII redaction
│   │   │   ├── InteroperabilityView.jsx # Silo reconciliation stats, live match simulator, FHIR R4
│   │   │   ├── GovernanceView.jsx     # DPDP Act 2023 mapping & real-time audit ledger
│   │   │   └── ChildDetailModal.jsx   # Deep longitudinal growth velocity curves & ASHA records
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
├── screenshots/                       # High-resolution dashboard screenshots for competition PDF
│   ├── 01_epidemiological_overview.png
│   ├── 02_triage_escalation_queue.png
│   ├── 03_child_registry_rbac.png
│   ├── 04_longitudinal_growth_modal.png
│   ├── 05_interoperability_abdm_gateway.png
│   └── 06_dpdp_audit_governance.png
├── DATA_ASSUMPTIONS.md                # Statistical distributions from NFHS-5 and WHO standards
├── ARCHITECTURE.md                    # 4-layer architectural specification and Mermaid diagrams
├── DPDP_COMPLIANCE_NOTE.md            # Design-to-obligation statutory mapping under DPDP Act 2023
├── ROUND1_SUMMARY.md                  # Drop-in sections for official 6-page Round 1 Proposal PDF
└── README.md                          # This file
```

---

## 3. Quick Start & Execution Instructions

### Prerequisites
- Python 3.10+ (tested on Python 3.13)
- Node.js v18+ (tested on Node.js v24)
- Git

### Step 1: Run Backend Server
```bash
# From repository root
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API will be accessible at: `http://localhost:8000`
- Interactive Swagger API Documentation: `http://localhost:8000/docs`

### Step 2: Run Frontend Dashboard
```bash
cd frontend
npm install
npm run dev
```
- Frontend will open at: `http://localhost:5173`

### Step 3: Run Automated Unit Tests
```bash
# From repository root
python -m pytest backend/tests -v
```
*(All 17 tests verify WHO LMS calculations, velocity early warnings, RBAC PII redaction, and ABDM matching.)*

---

## 4. Key API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/overview` | Macro epidemiological KPIs, block-wise stats, and trend data |
| `GET` | `/api/children` | Paginated child registry with dynamic RBAC PII masking |
| `GET` | `/api/children/{id}` | Deep child profile, 3-month growth history, and ASHA record |
| `GET` | `/api/escalations` | Prioritized triage queue with SLA remaining countdowns |
| `POST` | `/api/escalations/{id}/action` | Commit frontline intervention (NRC admission, home visit, THR) |
| `GET` | `/api/interoperability/stats` | Record linkage metrics, ABHA coverage, method breakdown |
| `POST` | `/api/interoperability/match-single`| Live simulator executing hybrid identity resolution |
| `GET` | `/api/interoperability/abdm-bundle/{id}`| Standard ABDM FHIR R4 Bundle (`LOINC 77606-2`) |
| `GET` | `/api/audit-logs` | Immutable audit ledger for DPDP compliance |

---

## 5. Mapping to Competition Judging Rubric

| Judging Rubric Criterion | Implementation in Poshan-Suraksha | Evidence File |
| :--- | :--- | :--- |
| **1. Problem Identification & Underserved Specificity** | Focuses on tribal children in Nandurbar District, Maharashtra; shifts paradigm from retrospective reporting to early warning. | `ROUND1_SUMMARY.md: Sec 1`<br/>`DATA_ASSUMPTIONS.md` |
| **2. Evidence & Data Credibility** | Synthetically seeded using exact NFHS-5 (2019-21) district priors and WHO Child Growth Standards (2006) LMS mathematics. | `DATA_ASSUMPTIONS.md`<br/>`who_standards.py` |
| **3. Existing Ecosystem Analysis** | Diagnoses why Poshan Tracker (~9 crore children) fails to stop SAM: ministerial siloing (MWCD vs MoHFW), lack of velocity tracking, and absent SLAs. | `ROUND1_SUMMARY.md: Sec 3`<br/>`ARCHITECTURE.md` |
| **4. Solution Quality & Architecture** | 4-layer architecture: synthetic microdata, hybrid identity resolution, composite risk engine, and role-based decision rights. | `ARCHITECTURE.md`<br/>`risk_scorer.py` |
| **5. Feasibility & Implementation Roadmap** | Realistic 18-month rollout in 4 phases; zero hardware replacement; works within Mission Poshan 2.0 budget. | `ROUND1_SUMMARY.md: Sec 5` |
| **6. Impact & Scalability** | 4-week lead time in SAM detection; 40% reduction in child CFR; 94%+ SLA compliance; marginal cost &lt; ₹1.80/child/year. | `ROUND1_SUMMARY.md: Sec 6` |
