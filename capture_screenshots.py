"""
Automated Screenshot Capture Script for Poshan-Suraksha Platform.
Captures all 6 competition dashboard views.
"""
import time
import threading
import urllib.request
import uvicorn
from playwright.sync_api import sync_playwright
from backend.app.main import app

def run_server():
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="warning")

def capture_all():
    print("[*] Starting backend server in background thread...")
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()

    print("[*] Waiting for backend to be ready on port 8000...")
    for _ in range(30):
        try:
            with urllib.request.urlopen("http://127.0.0.1:8000/api/health") as response:
                if response.status == 200:
                    print("[OK] Backend server is healthy!")
                    break
        except Exception:
            time.sleep(1)

    print("[*] Launching Playwright Chromium headless browser...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 960}, device_scale_factor=2)
        page = context.new_page()

        # 1. Epidemiological Overview
        print(" -> Capturing 01_epidemiological_overview.png...")
        page.goto("http://127.0.0.1:8000")
        page.wait_for_selector("text=Closing the \"Data-to-Action\" Gap", timeout=15000)
        time.sleep(2)
        page.screenshot(path="screenshots/01_epidemiological_overview.png", full_page=False)

        # 2. Triage Escalation Queue
        print(" -> Capturing 02_triage_escalation_queue.png...")
        page.click("text=Early-Warning Escalation Queue")
        page.wait_for_selector("text=Triage Escalation Queue & Decision Rights", timeout=10000)
        time.sleep(1.5)
        page.screenshot(path="screenshots/02_triage_escalation_queue.png", full_page=False)

        # 3. Child Registry & Velocity
        print(" -> Capturing 03_child_registry_rbac.png...")
        page.click("text=Child Registry & Velocity")
        page.wait_for_selector("text=Child Registry & Anthropometric Velocity Monitoring", timeout=10000)
        time.sleep(1.5)
        page.screenshot(path="screenshots/03_child_registry_rbac.png", full_page=False)

        # 4. Longitudinal Growth Modal (Click on a critical case in child table)
        print(" -> Capturing 04_longitudinal_growth_modal.png...")
        page.click("table tbody tr:has-text('CRITICAL')")
        page.wait_for_selector("text=Longitudinal Growth Velocity Curve", timeout=10000)
        time.sleep(1.5)
        page.screenshot(path="screenshots/04_longitudinal_growth_modal.png", full_page=False)

        # 5. Interoperability & Identity Resolution (fresh navigation)
        print(" -> Capturing 05_interoperability_abdm_gateway.png...")
        page.goto("http://127.0.0.1:8000")
        time.sleep(1)
        page.click("text=Identity Resolution (ABDM/ASHA)")
        page.wait_for_selector("text=Reconciliation Coverage", timeout=10000)
        time.sleep(2)
        page.screenshot(path="screenshots/05_interoperability_abdm_gateway.png", full_page=False)

        # 6. DPDP Act & Audit Log Governance
        print(" -> Capturing 06_dpdp_audit_governance.png...")
        page.click("text=DPDP Act & Audit Log")
        page.wait_for_selector("text=Digital Personal Data Protection (DPDP) Act, 2023 Compliance", timeout=10000)
        time.sleep(2)
        page.screenshot(path="screenshots/06_dpdp_audit_governance.png", full_page=False)

        browser.close()
        print("[OK] All 6 competition screenshots captured successfully into /screenshots directory!")

if __name__ == "__main__":
    capture_all()
