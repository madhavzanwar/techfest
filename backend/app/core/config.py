"""
Core configuration settings for the Nutrition Early-Warning & Decision Support System.
Techfest IIT Bombay — India @ 71/100 Challenge.
"""
from pathlib import Path
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "Poshan-Suraksha: Nutrition Early-Warning & Escalation Platform"
    PROJECT_VERSION: str = "1.0.0"
    THEME: str = "Maternal & Early Childhood Nutrition — Techfest IIT Bombay"
    DISTRICT_NAME: str = "Nandurbar"
    STATE_NAME: str = "Maharashtra"
    BLOCKS: list[str] = ["Dhadgaon", "Akkalkuwa", "Shahada", "Taloda", "Nandurbar Rural"]
    
    # Path settings
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    DATA_DIR: Path = BASE_DIR / "data"
    DB_PATH: Path = BASE_DIR / "poshan_suraksha.db"
    
    # Risk thresholds
    NORMAL_THRESHOLD: float = 35.0
    WATCH_THRESHOLD: float = 65.0
    
    # Escalation SLAs (in hours)
    SLA_CRITICAL_HOURS: int = 48    # 48 hours for immediate Medical Officer / NRC referral
    SLA_WATCH_HOURS: int = 168       # 7 days (168 hours) for ASHA/AWW targeted nutritional follow-up
    
    # DPDP Act & Privacy settings
    DPDP_COMPLIANCE_MODE: bool = True
    MASK_PII_DISTRICT_LEVEL: bool = True

settings = Settings()
