# -*- coding: utf-8 -*-
import sys
import os
import json
import time
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')

screenshot_dir = r"c:\Users\HPZBook\Desktop\THỐNG KÊ LÀM TRỰC TUYẾN\tests\screenshots"
os.makedirs(screenshot_dir, exist_ok=True)

results = {
    "viewports": [],
    "console_errors": [],
    "touch_targets": [],
    "style_audit": {},
    "performance": {}
}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    
    # 1. TEST VIEWPORTS (Mobile iPhone, Android, Desktop)
    test_screens = [
        {"name": "iPhone_14_Pro", "width": 393, "height": 852, "is_mobile": True},
        {"name": "Samsung_Galaxy_S20", "width": 412, "height": 915, "is_mobile": True},
        {"name": "Laptop_1366", "width": 1366, "height": 768, "is_mobile": False},
        {"name": "Desktop_FHD", "width": 1920, "height": 1080, "is_mobile": False}
    ]
    
    for screen in test_screens:
        context = browser.new_context(
            viewport={"width": screen["width"], "height": screen["height"]},
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15" if screen["is_mobile"] else None
        )
        page = context.new_page()
        
        console_logs = []
        page.on("console", lambda msg: console_logs.append({"type": msg.type, "text": msg.text}))
        page.on("pageerror", lambda err: console_logs.append({"type": "error", "text": str(err)}))
        
        t0 = time.time()
        response = page.goto("http://localhost:3008", wait_until="networkidle")
        load_time_ms = int((time.time() - t0) * 1000)
        
        # Check scrollWidth vs clientWidth
        overflow_check = page.evaluate("""() => {
            const doc = document.documentElement;
            const body = document.body;
            const scrollW = Math.max(doc.scrollWidth, body.scrollWidth);
            const clientW = Math.max(doc.clientWidth, body.clientWidth);
            return {
                scrollWidth: scrollW,
                clientWidth: clientW,
                hasOverflow: scrollW > clientW
            };
        }""")
        
        # Save screenshot to disk (for user reference only)
        shot_path = os.path.join(screenshot_dir, f"{screen['name']}.png")
        page.screenshot(path=shot_path, full_page=False)
        
        # Filter true errors
        real_errors = [l for l in console_logs if l["type"] in ("error",)]
        
        results["viewports"].append({
            "name": screen["name"],
            "width": screen["width"],
            "height": screen["height"],
            "status": response.status if response else 0,
            "load_time_ms": load_time_ms,
            "scrollWidth": overflow_check["scrollWidth"],
            "clientWidth": overflow_check["clientWidth"],
            "zero_overflow": not overflow_check["hasOverflow"],
            "console_errors_count": len(real_errors),
            "screenshot": shot_path
        })
        context.close()
        
    # 2. AUDIT TOUCH TARGETS & UI STYLES (MATCH NOTEBOOK+LMS)
    context = browser.new_context(viewport={"width": 393, "height": 852})
    page = context.new_page()
    page.goto("http://localhost:3008", wait_until="networkidle")
    
    # Touch targets audit (must be >= 44px)
    touch_audit = page.evaluate("""() => {
        const buttons = Array.from(document.querySelectorAll('button, select, input[type="text"]'));
        const checks = buttons.map(b => {
            const rect = b.getBoundingClientRect();
            return {
                tag: b.tagName,
                id: b.id || b.className.slice(0, 20),
                height: Math.round(rect.height),
                width: Math.round(rect.width),
                is_valid: rect.height >= 44 || rect.height === 0 // 0 means hidden
            };
        });
        const visibleChecks = checks.filter(c => c.height > 0);
        const passCount = visibleChecks.filter(c => c.height >= 44).length;
        return {
            total_visible: visibleChecks.length,
            pass_ge_44px: passCount,
            items: visibleChecks.slice(0, 10)
        };
    }""")
    results["touch_targets"] = touch_audit
    
    # Style audit (Notebook+LMS DNA)
    style_audit = page.evaluate("""() => {
        const bodyStyle = window.getComputedStyle(document.body);
        const card = document.querySelector('.glass-card');
        const cardStyle = card ? window.getComputedStyle(card) : {};
        
        return {
            fontFamily: bodyStyle.fontFamily,
            bodyBackground: bodyStyle.backgroundImage || bodyStyle.background,
            cardBackdropFilter: cardStyle.backdropFilter || cardStyle.webkitBackdropFilter || 'none',
            cardBorder: cardStyle.border,
            teachersLoaded: typeof TEACHERS_DATABASE !== 'undefined' ? TEACHERS_DATABASE.length : 0
        };
    }""")
    results["style_audit"] = style_audit
    
    # 3. BENCHMARK CANVAS COMPRESSION SPEED
    perf_test = page.evaluate("""() => {
        // Create 4K dummy image in memory
        const c = document.createElement('canvas');
        c.width = 1920;
        c.height = 1080;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(0, 0, 1920, 1080);
        ctx.fillStyle = '#ffffff';
        ctx.font = '48px sans-serif';
        ctx.fillText('Chung Nhan Hoan Thanh Cuoc Thi 2026', 100, 200);
        ctx.fillText('Diem so: 100/100 - Dat loai Xuat Sac', 100, 300);
        
        const rawDataUrl = c.toDataURL('image/png'); // Simulates ~3-5MB uncompressed screenshot
        const rawSize = Math.round((rawDataUrl.length * 3) / 4);
        
        const t0 = performance.now();
        // Run compression logic
        const targetC = document.createElement('canvas');
        const scale = 1600 / 1920;
        targetC.width = 1600;
        targetC.height = Math.round(1080 * scale);
        const tctx = targetC.getContext('2d');
        tctx.drawImage(c, 0, 0, targetC.width, targetC.height);
        const compressedBase64 = targetC.toDataURL('image/jpeg', 0.82);
        const t1 = performance.now();
        
        const compressedSize = Math.round((compressedBase64.length * 3) / 4);
        
        return {
            originalBytes: rawSize,
            compressedBytes: compressedSize,
            savedPercent: ((rawSize - compressedSize) / rawSize * 100).toFixed(1),
            durationMs: (t1 - t0).toFixed(1)
        };
    }""")
    results["performance"] = perf_test
    
    browser.close()

print(json.dumps(results, ensure_ascii=False, indent=2))
