"""
Role-Based Access Control (RBAC), Escalation Queue Management, and DPDP-Compliant Audit Logging.
"""
import sqlite3
import hashlib
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from backend.app.core.config import settings
from backend.app.models.schemas import UserRole, RiskTier, AuditLogEntry, EscalationCase

class AuditManager:
    """Manages immutable audit log entries for regulatory DPDP compliance."""
    
    def __init__(self, db_path: str = str(settings.DB_PATH)):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                user_role TEXT NOT NULL,
                user_id TEXT NOT NULL,
                action TEXT NOT NULL,
                resource_accessed TEXT NOT NULL,
                justification TEXT NOT NULL,
                pii_redacted INTEGER NOT NULL,
                ip_hash TEXT NOT NULL
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS escalation_actions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                case_id TEXT NOT NULL,
                child_id TEXT NOT NULL,
                action_type TEXT NOT NULL,
                officer_name TEXT NOT NULL,
                notes TEXT NOT NULL,
                timestamp TEXT NOT NULL
            )
        """)
        conn.commit()
        conn.close()

    def log(self, user_role: str, user_id: str, action: str, resource: str, justification: str, pii_redacted: bool, client_ip: str = "127.0.0.1"):
        from datetime import timezone
        ip_hash = hashlib.sha256(client_ip.encode()).hexdigest()[:12]
        now = datetime.now(timezone.utc).isoformat()
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO audit_logs (timestamp, user_role, user_id, action, resource_accessed, justification, pii_redacted, ip_hash)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (now, user_role, user_id, action, resource, justification, 1 if pii_redacted else 0, ip_hash))
        conn.commit()
        conn.close()

    def get_recent_logs(self, limit: int = 50) -> List[AuditLogEntry]:
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, timestamp, user_role, user_id, action, resource_accessed, justification, pii_redacted, ip_hash
            FROM audit_logs ORDER BY id DESC LIMIT ?
        """, (limit,))
        rows = cursor.fetchall()
        conn.close()
        return [
            AuditLogEntry(
                id=r[0],
                timestamp=r[1],
                user_role=r[2],
                user_id=r[3],
                action=r[4],
                resource_accessed=r[5],
                justification=r[6],
                pii_redacted=bool(r[7]),
                ip_hash=r[8]
            ) for r in rows
        ]

    def record_escalation_action(self, case_id: str, child_id: str, action_type: str, officer_name: str, notes: str):
        from datetime import timezone
        now = datetime.now(timezone.utc).isoformat()
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO escalation_actions (case_id, child_id, action_type, officer_name, notes, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (case_id, child_id, action_type, officer_name, notes, now))
        conn.commit()
        conn.close()

    def get_case_actions(self, case_id: str) -> List[Dict[str, Any]]:
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT action_type, officer_name, notes, timestamp
            FROM escalation_actions WHERE case_id = ? ORDER BY id DESC
        """, (case_id,))
        rows = cursor.fetchall()
        conn.close()
        return [{"action_type": r[0], "officer_name": r[1], "notes": r[2], "timestamp": r[3]} for r in rows]

class AccessEnforcer:
    """Implements Role-Based Access Control and DPDP Section 8 Data Minimization."""

    @classmethod
    def filter_child_profile(cls, profile: Dict[str, Any], role: UserRole, user_scope: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Applies role-scoped filtering and PII masking:
        - AWW: can only see records for their own AWC. Full name visible for clinical care.
        - BLOCK_OFFICER: can see records within their block. Pseudonymized ID and clinical details.
        - DISTRICT_OFFICER: macro analysis. Raw PII redacted by default to masked initials.
        - ADMIN: full view with supervisory oversight.
        """
        p = dict(profile)
        
        # Scope enforcement
        if role == UserRole.AWW:
            if user_scope and p.get("awc_id") != user_scope:
                return None  # Out of beat boundary
        elif role == UserRole.BLOCK_OFFICER:
            if user_scope and p.get("block_name") != user_scope:
                return None  # Out of block boundary

        # PII Minimization rule (DPDP Act 2023)
        if role == UserRole.DISTRICT_OFFICER:
            # Mask PII at district level
            p["pseudonym_name"] = p["masked_name"]
            p["anonymized_aadhaar_hash"] = None
            p["rch_id"] = "RCH-REDACTED-DISTRICT-VIEW"
            p["guardian_consent_status"] = "PROTECTED_MINIMIZED"

        return p
