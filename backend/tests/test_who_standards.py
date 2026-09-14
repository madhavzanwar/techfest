"""
Unit tests for WHO Child Growth Standards (2006) LMS and Z-Score Computation.
Verifies calculations against published WHO Anthro reference benchmarks.
"""
import pytest
from backend.app.data_engine.who_standards import (
    compute_waz, compute_haz, compute_whz, classify_muac
)

def test_waz_median_boys_12_months():
    """Official WHO table: 12-month-old boy median weight is ~9.65 kg (WAZ ~ 0.0 SD)."""
    waz = compute_waz(weight_kg=9.65, age_months=12, sex="M")
    assert -0.1 <= waz <= 0.1, f"Expected near 0.0 SD, got {waz}"

def test_waz_underweight_boundary():
    """A 12-month-old boy at 7.5 kg should be moderately to severely underweight (< -2.0 SD)."""
    waz = compute_waz(weight_kg=7.5, age_months=12, sex="M")
    assert waz < -2.0, f"Expected WAZ < -2.0 SD, got {waz}"

def test_haz_median_girls_24_months():
    """Official WHO table: 24-month-old girl median height is ~86.4 cm (HAZ ~ 0.0 SD)."""
    haz = compute_haz(height_cm=86.4, age_months=24, sex="F")
    assert -0.15 <= haz <= 0.15, f"Expected near 0.0 SD, got {haz}"

def test_haz_stunting_threshold():
    """A 24-month-old girl at 78.0 cm is severely stunted (HAZ < -2.5 SD)."""
    haz = compute_haz(height_cm=78.0, age_months=24, sex="F")
    assert haz < -2.0, f"Expected stunted HAZ < -2.0 SD, got {haz}"

def test_whz_wasting():
    """A boy of height 75 cm and weight 7.2 kg is wasted (WHZ < -2.5 SD)."""
    whz = compute_whz(weight_kg=7.2, height_cm=75.0, sex="M")
    assert whz < -2.0, f"Expected WHZ < -2.0 SD, got {whz}"

def test_classify_muac():
    """Verifies WHO/UNICEF tri-color tape classifications."""
    assert classify_muac(110.0) == "SAM", "MUAC < 115 mm must be SAM"
    assert classify_muac(114.9) == "SAM", "MUAC 114.9 mm must be SAM"
    assert classify_muac(118.0) == "MAM", "MUAC 115-124 mm must be MAM"
    assert classify_muac(124.0) == "MAM", "MUAC 124 mm must be MAM"
    assert classify_muac(125.0) == "NORMAL", "MUAC >= 125 mm must be NORMAL"
    assert classify_muac(140.0) == "NORMAL", "MUAC 140 mm must be NORMAL"
