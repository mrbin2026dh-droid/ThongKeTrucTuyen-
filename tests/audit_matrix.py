# -*- coding: utf-8 -*-
import sys
import os
import json
import time
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')

screenshot_dir = r"c:\Users\HPZBook\Desktop\THỐNG KÊ LÀM TRỰC TUYẾN\tests\screenshots"
os.makedirs(screenshot_dir, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    
    # 1. Desktop FHD (Teacher View & Admin View)
    context = browser.new_context(viewport={"width": 1920, "height": 1080})
    page = context.new_page()
    page.goto("http://localhost:3008", wait_until="networkidle")
    
    # Screenshot Teacher View Desktop
    page.screenshot(path=os.path.join(screenshot_dir, "Desktop_FHD_Teacher.png"))
    
    # Switch to Admin Tab
    page.click("#tab-admin")
    page.wait_for_timeout(500)
    
    # Check Admin Table dimensions
    table_metrics = page.evaluate("""() => {
        const table = document.querySelector('.matrix-table');
        const rows = Array.from(document.querySelectorAll('#admin-matrix-tbody tr'));
        const firstRowCells = rows[0] ? Array.from(rows[0].querySelectorAll('td')).map(td => ({
            text: td.textContent.trim().slice(0, 25),
            width: Math.round(td.getBoundingClientRect().width),
            height: Math.round(td.getBoundingClientRect().height)
        })) : [];
        
        return {
            tableWidth: Math.round(table.getBoundingClientRect().width),
            totalRows: rows.length,
            firstRowCells: firstRowCells
        };
    }""")
    print("Desktop Admin Table Metrics:", json.dumps(table_metrics, ensure_ascii=False, indent=2))
    
    # Screenshot Admin View Desktop
    page.screenshot(path=os.path.join(screenshot_dir, "Desktop_FHD_Admin.png"))
    context.close()
    
    # 2. Mobile iPhone 14 Pro
    m_ctx = browser.new_context(
        viewport={"width": 393, "height": 852},
        user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15"
    )
    m_page = m_ctx.new_page()
    m_page.goto("http://localhost:3008", wait_until="networkidle")
    
    m_overflow = m_page.evaluate("""() => {
        const doc = document.documentElement;
        const body = document.body;
        return {
            scrollWidth: Math.max(doc.scrollWidth, body.scrollWidth),
            clientWidth: Math.max(doc.clientWidth, body.clientWidth)
        };
    }""")
    print("iPhone Overflow Check:", m_overflow)
    m_page.screenshot(path=os.path.join(screenshot_dir, "iPhone_14_Pro_Teacher.png"))
    
    # Switch to Admin View on Mobile
    m_page.click("#tab-admin")
    m_page.wait_for_timeout(500)
    m_page.screenshot(path=os.path.join(screenshot_dir, "iPhone_14_Pro_Admin.png"))
    m_ctx.close()
    
    browser.close()

print("\nAll Playwright real screen audits completed successfully.")
