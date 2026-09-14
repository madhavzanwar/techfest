"""
WHO Child Growth Standards (2006) LMS Reference Tables and Z-Score Computation.
Covers:
- Weight-for-Age (WAZ) 0-60 months (Boys / Girls)
- Length/Height-for-Age (HAZ) 0-60 months (Boys / Girls)
- Weight-for-Length/Height (WHZ) 45-120 cm (Boys / Girls)
- Mid-Upper Arm Circumference (MUAC) clinical triage
"""
import math
from typing import Tuple, Dict

# WHO Reference LMS Tables (Interpolated monthly grids 0-60 months for Boys [M] and Girls [F])
# Reference: WHO Child Growth Standards (Geneva: World Health Organization, 2006)

# Weight-for-age: key sample points [Month: (L, M, S)]
WFA_BOYS_LMS = {
    0: (0.3487, 3.346, 0.14602),
    3: (0.1348, 6.405, 0.12356),
    6: (0.0183, 7.934, 0.11370),
    9: (-0.0526, 8.895, 0.10842),
    12: (-0.0995, 9.646, 0.10543),
    18: (-0.1557, 10.873, 0.10271),
    24: (-0.1874, 12.151, 0.10170),
    30: (-0.2078, 13.313, 0.10141),
    36: (-0.2224, 14.346, 0.10147),
    42: (-0.2337, 15.309, 0.10183),
    48: (-0.2435, 16.252, 0.10255),
    54: (-0.2527, 17.218, 0.10375),
    60: (-0.2618, 18.232, 0.10549),
}

WFA_GIRLS_LMS = {
    0: (0.3996, 3.232, 0.14171),
    3: (0.1983, 5.845, 0.12521),
    6: (0.0906, 7.297, 0.11718),
    9: (0.0261, 8.243, 0.11283),
    12: (-0.0152, 8.948, 0.11059),
    18: (-0.0655, 10.155, 0.10884),
    24: (-0.0963, 11.479, 0.10839),
    30: (-0.1166, 12.695, 0.10848),
    36: (-0.1311, 13.854, 0.10883),
    42: (-0.1420, 14.978, 0.10940),
    48: (-0.1506, 16.082, 0.11020),
    54: (-0.1578, 17.185, 0.11124),
    60: (-0.1643, 18.298, 0.11254),
}

# Height/Length-for-age: [Month: (L, M, S)]
HFA_BOYS_LMS = {
    0: (1.0, 49.88, 0.03795),
    3: (1.0, 61.43, 0.03606),
    6: (1.0, 67.62, 0.03531),
    9: (1.0, 71.99, 0.03507),
    12: (1.0, 75.75, 0.03525),
    18: (1.0, 82.35, 0.03588),
    24: (1.0, 87.82, 0.03673),
    30: (1.0, 93.18, 0.03780),
    36: (1.0, 96.11, 0.03893),
    42: (1.0, 100.37, 0.03986),
    48: (1.0, 103.32, 0.04068),
    54: (1.0, 106.84, 0.04135),
    60: (1.0, 110.02, 0.04192),
}

HFA_GIRLS_LMS = {
    0: (1.0, 49.14, 0.03790),
    3: (1.0, 59.80, 0.03598),
    6: (1.0, 65.73, 0.03520),
    9: (1.0, 70.14, 0.03494),
    12: (1.0, 74.02, 0.03513),
    18: (1.0, 80.71, 0.03577),
    24: (1.0, 86.43, 0.03666),
    30: (1.0, 91.88, 0.03774),
    36: (1.0, 95.14, 0.03889),
    42: (1.0, 99.45, 0.03983),
    48: (1.0, 102.70, 0.04066),
    54: (1.0, 106.22, 0.04134),
    60: (1.0, 109.43, 0.04192),
}

# Weight-for-Length/Height: [Height cm: (L, M, S)]
WFH_BOYS_LMS = {
    45: (-0.3521, 2.434, 0.0886),
    55: (-0.3521, 4.498, 0.0898),
    65: (-0.3521, 7.378, 0.0885),
    75: (-0.3521, 9.771, 0.0872),
    85: (-0.3521, 11.968, 0.0863),
    95: (-0.3521, 14.288, 0.0882),
    105: (-0.3521, 16.923, 0.0924),
    115: (-0.3521, 20.155, 0.0988),
    120: (-0.3521, 22.124, 0.1030),
}

WFH_GIRLS_LMS = {
    45: (-0.3833, 2.392, 0.0876),
    55: (-0.3833, 4.316, 0.0895),
    65: (-0.3833, 7.022, 0.0891),
    75: (-0.3833, 9.381, 0.0886),
    85: (-0.3833, 11.583, 0.0887),
    95: (-0.3833, 13.978, 0.0915),
    105: (-0.3833, 16.687, 0.0968),
    115: (-0.3833, 19.988, 0.1042),
    120: (-0.3833, 22.012, 0.1089),
}

def _interpolate_lms(table: Dict[float, Tuple[float, float, float]], key: float) -> Tuple[float, float, float]:
    """Linearly interpolates L, M, S parameters from reference grid."""
    keys = sorted(table.keys())
    if key <= keys[0]:
        return table[keys[0]]
    if key >= keys[-1]:
        return table[keys[-1]]
    
    for i in range(len(keys) - 1):
        k0, k1 = keys[i], keys[i+1]
        if k0 <= key <= k1:
            ratio = (key - k0) / (k1 - k0)
            l0, m0, s0 = table[k0]
            l1, m1, s1 = table[k1]
            return (
                l0 + ratio * (l1 - l0),
                m0 + ratio * (m1 - m0),
                s0 + ratio * (s1 - s0)
            )
    return table[keys[-1]]

def calculate_zscore(measurement: float, L: float, M: float, S: float) -> float:
    """Computes standard Box-Cox transformed Z-score according to WHO LMS method."""
    if measurement <= 0 or M <= 0 or S <= 0:
        return 0.0
    if abs(L) > 0.001:
        z = ((measurement / M) ** L - 1.0) / (L * S)
    else:
        z = math.log(measurement / M) / S
    return round(float(z), 2)

def compute_waz(weight_kg: float, age_months: float, sex: str = "M") -> float:
    """Computes Weight-for-Age Z-score (WAZ) using WHO standards."""
    table = WFA_BOYS_LMS if sex.upper() == "M" else WFA_GIRLS_LMS
    L, M, S = _interpolate_lms(table, float(age_months))
    return calculate_zscore(weight_kg, L, M, S)

def compute_haz(height_cm: float, age_months: float, sex: str = "M") -> float:
    """Computes Height-for-Age Z-score (HAZ) using WHO standards."""
    table = HFA_BOYS_LMS if sex.upper() == "M" else HFA_GIRLS_LMS
    L, M, S = _interpolate_lms(table, float(age_months))
    return calculate_zscore(height_cm, L, M, S)

def compute_whz(weight_kg: float, height_cm: float, sex: str = "M") -> float:
    """Computes Weight-for-Height/Length Z-score (WHZ) using WHO standards."""
    table = WFH_BOYS_LMS if sex.upper() == "M" else WFH_GIRLS_LMS
    L, M, S = _interpolate_lms(table, float(height_cm))
    return calculate_zscore(weight_kg, L, M, S)

def classify_muac(muac_mm: float) -> str:
    """
    Classifies Mid-Upper Arm Circumference (MUAC) according to WHO/UNICEF clinical guidelines:
    - SAM (Severe Acute Malnutrition): MUAC < 115 mm (Red tape)
    - MAM (Moderate Acute Malnutrition): 115 mm <= MUAC < 125 mm (Yellow tape)
    - NORMAL: MUAC >= 125 mm (Green tape)
    """
    if muac_mm < 115:
        return "SAM"
    elif muac_mm < 125:
        return "MAM"
    else:
        return "NORMAL"
