# -*- coding: utf-8 -*-
import sys
import json
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 393, "height": 852})
    
    console_errors = []
    page.on("pageerror", lambda err: console_errors.append(str(err)))
    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
    
    page.goto("http://localhost:3008", wait_until="networkidle")
    
    # 1. Verify that no native select-contest exists
    native_select_exists = page.evaluate("() => Boolean(document.getElementById('select-contest'))")
    
    # 2. Check contest cards container
    cards_count = page.evaluate("() => document.querySelectorAll('#contest-cards-container .contest-card-interactive').length")
    
    # 3. Check card title wrapping (no text truncation ellipsis)
    title_wrap_check = page.evaluate("""() => {
        const titleEl = document.querySelector('#contest-cards-container .contest-card-interactive h3');
        if (!titleEl) return null;
        const style = window.getComputedStyle(titleEl);
        return {
            text: titleEl.textContent,
            textOverflow: style.textOverflow,
            whiteSpace: style.whiteSpace,
            wordBreak: style.wordBreak,
            hasBreakWords: titleEl.classList.contains('break-words')
        };
    }""")
    
    # 4. Check live countdown pill in card and side panel
    countdown_check = page.evaluate("""() => {
        const sideCountdown = document.getElementById('contest-countdown-display');
        const cardCountdown = document.querySelector('#contest-cards-container .countdown-pill');
        const zaloBtn = document.getElementById('btn-copy-zalo-launch');
        return {
            sideCountdownText: sideCountdown ? sideCountdown.textContent.trim() : null,
            cardCountdownText: cardCountdown ? cardCountdown.textContent.trim() : null,
            hasZaloBtn: Boolean(zaloBtn),
            zaloBtnText: zaloBtn ? zaloBtn.textContent.trim() : null
        };
    }""")
    
    # 5. Check ExportService.generateZaloLaunchAnnouncement output
    zalo_msg_sample = page.evaluate("""() => {
        if (typeof ExportService === 'undefined' || typeof AppState === 'undefined' || !AppState.contests.length) {
            return null;
        }
        return ExportService.generateZaloLaunchAnnouncement(AppState.contests[0]);
    }""")
    
    browser.close()
    
    result = {
        "native_select_exists": native_select_exists,
        "cards_count": cards_count,
        "title_wrap_check": title_wrap_check,
        "countdown_check": countdown_check,
        "zalo_announcement_preview": zalo_msg_sample,
        "console_errors": console_errors
    }
    
    print(json.dumps(result, ensure_ascii=False, indent=2))
