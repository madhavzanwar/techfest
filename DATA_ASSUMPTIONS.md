# DATA_ASSUMPTIONS.md — Synthetic Data Seeding & Statistical Rigor

## 1. Overview & Context

This document transparently specifies the statistical assumptions, epidemiologic priors, and schema mapping used to generate the synthetic datasets for the **Nutrition Early-Warning & Escalation Platform** (Techfest IIT Bombay — The India @ 71/100 Challenge, Theme 1: Maternal & Early Childhood Nutrition).

> **Important Notice on Data Provenance**: In strict adherence to competition rules and academic integrity, **no live connection to proprietary or confidential government databases (ICDS-CAS, Poshan Tracker, RCH/Anmol, or ABDM production APIs) is fabricated or claimed**. All records in this platform are synthetically seeded using published macro-level distributions from the **National Family Health Survey (NFHS-5, 2019–21)**, **WHO Child Growth Standards (2006)**, and **NITI Aayog Aspirational Districts Indicators**.

---

## 2. Demographic & Epidemiologic Priors (NFHS-5 & Contextual Weighting)

The synthetic cohort models an underserved, tribal-majority aspirational district (**Nandurbar District, Maharashtra**, comprising 5 high-burden blocks: *Dhadgaon, Akkalkuwa, Shahada, Taloda, and Nandurbar rural*). Aspirational tribal geographies exhibit higher-than-national stunting and wasting burdens.

| Nutrition / Clinical Indicator | National NFHS-5 Benchmark | Simulated District Target Mean | Sampling Distribution / Model |
| :--- | :--- | :--- | :--- |
| **Stunting** (Height-for-Age Z < -2 SD) | 35.5% | **42.0%** | Gaussian mixture over WHO length/height-for-age LMS curves |
| **Severe Stunting** (HAZ < -3 SD) | 14.8% | **18.5%** | Tail probability below -3.0 SD threshold |
| **Wasting** (Weight-for-Height Z < -2 SD) | 19.3% | **22.5%** | Joint bivariate normal distribution conditional on height |
| **Severe Acute Malnutrition (SAM)** (WHZ < -3 SD) | 7.7% | **9.2%** | Extreme tail WHZ < -3.0 SD or MUAC < 115 mm |
| **Underweight** (Weight-for-Age Z < -2 SD) | 32.1% | **38.0%** | Derived from weight-for-age LMS tables |
| **Child Anemia** (Hb < 11.0 g/dL, 6–59m) | 67.1% | **73.4%** | Beta distribution shifted to mean 10.2 g/dL (SD 1.5) |
| **Low Birth Weight (< 2.5 kg)** | 18.2% | **24.0%** | Logistic regression with maternal nutrition proxy |
| **Full Immunization Coverage (12–23m)** | 76.4% | **68.0%** | Categorical: Full (68%), Partial (22%), Zero-Dose (10%) |
| **Recent Diarrhea (past 2 weeks)** | 7.3% | **11.2%** | Poisson / Zero-inflated Bernoulli model |
| **Acute Respiratory Infection (ARI)** | 2.8% | **5.4%** | Bernoulli trial correlated with seasonal / housing conditions |

---

## 3. The Dual-Silo Schema (Forcing Interoperability)

To reflect the reality of India's frontline data architecture:
1. **Poshan Tracker / Anganwadi Record System** operates under the **Ministry of Women and Child Development (MWCD)**. Frontline workers (Anganwadi Workers / AWWs) collect anthropometric measures (weight, height, MUAC) monthly.
2. **ASHA / RCH / Health Record System** operates under the **Ministry of Health and Family Welfare (MoHFW)**. Frontline ASHA workers track maternal health, institutional delivery, immunization schedules, childhood illnesses (diarrhea, ARI, pneumonia), and NRC (Nutrition Rehabilitation Centre) referrals.

### Record Schema Comparison

| Dimension | Poshan Tracker / ICDS Record | ASHA / Health System Record |
| :--- | :--- | :--- |
| **Primary Key** | `POSHAN-MH-NDB-#####` (12-char Poshan ID) | `RCH-MH-2023-#####` (State RCH ID) |
| **Child Identity** | Pseudonymous Token / Guardian initials | Mother's RCH ID, child birth order, alias |
| **Temporal Granularity** | Monthly Anganwadi Centre (AWC) weigh-in | Episode-based / immunization due dates |
| **Core Clinical Fields** | Weight (kg), Height (cm), MUAC (mm), Bilateral Oedema | Immunization status, Diarrheal episodes, ARI, Hb (g/dL), NRC history |
| **Location Hierarchy** | State → District → Block → Sector → AWC | State → District → Block → PHC → Subcenter → Village |
| **ABDM / ABHA Link** | Partial (35% linked, 65% unlinked) | Partial (62% linked, 38% unlinked) |
| **Consent Metadata** | DPDP-compliant consent timestamp, purpose token | General RCH institutional consent |

---

## 4. WHO Child Growth Standards & Z-Score Computation

The engine uses the **WHO Child Growth Standards (2006)** LMS methodology:
$$Z = \frac{\left(\frac{y}{M(t)}\right)^{L(t)} - 1}{L(t) \cdot S(t)}$$
where:
- $y$ is the child's anthropometric measurement (weight in kg, length/height in cm),
- $M(t)$ is the median reference for age $t$ (or height for WHZ),
- $L(t)$ is the Box-Cox power transform to adjust for skewness,
- $S(t)$ is the generalized coefficient of variation.

### Categorization Thresholds:
- **Normal**: $Z \ge -1.0$
- **Mild Risk / Borderline**: $-2.0 \le Z < -1.0$
- **Moderate Acute Malnutrition (MAM)**: $-3.0 \le Z < -2.0$ (or MUAC between $115\text{ mm}$ and $125\text{ mm}$)
- **Severe Acute Malnutrition (SAM)**: $Z < -3.0$, or MUAC $< 115\text{ mm}$, or bilateral pitting oedema present.

---

## 5. Longitudinal Velocity & Early-Warning Trend Assumptions

Traditional dashboards perform static cross-sectional classification. Our platform implements longitudinal velocity detection:
1. **Faltering Velocity**: A child whose WHZ was $+0.5$ two months ago, $-0.8$ last month, and $-1.8$ today has not yet breached the $-2.0$ SAM/MAM threshold, but shows rapid deceleration ($> 1.0\text{ SD}$ loss per 60 days). Under standard dashboards, they remain unflagged; in our system, they trigger a **"Watch — Rapid Velocity Drop"** alert.
2. **Post-Illness Vulnerability Window**: An episode of severe diarrhea or ARI in the health record within the past 21 days combined with stagnant weight triggers an immediate escalation, catching downward trajectories 3 to 6 weeks before SAM manifests.

---

## 6. Dataset Scale

- **Simulated Population**: 3,500 active child beneficiaries across 5 blocks, 45 Anganwadi Centres, and 18 Primary Health Centres (PHCs).
- **Temporal Depth**: 3 consecutive longitudinal observations per child (Months $T-2$, $T-1$, and $T_0$) to enable rigorous trend detection.
- **Linkage Overlap**: 88% true population intersection between Poshan Tracker and ASHA registries, with 12% discrepancy (out-migration, delayed registration, phonetic name variations) to validate identity resolution.
