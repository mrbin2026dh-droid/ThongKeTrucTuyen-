from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto('http://localhost:3008')
    res = page.evaluate('''() => {
        const raw = '<tr><td colspan="7">No data</td></tr>';
        return {
            direct: DOMPurify.sanitize(raw),
            tableWrapped: DOMPurify.sanitize('<table><tbody>' + raw + '</tbody></table>')
        };
    }''')
    print('DOMPurify tr test:', res)
    browser.close()
