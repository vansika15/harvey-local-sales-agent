import time
from selenium import webdriver
from selenium.webdriver.edge.options import Options
from selenium.webdriver.common.by import By

opts = Options()
opts.add_argument("--headless=new")
opts.add_argument("--window-size=1600,1100")
driver = webdriver.Edge(options=opts)

try:
    print("1. Opening http://127.0.0.1:8000 ...")
    driver.get("http://127.0.0.1:8000")
    time.sleep(2)
    
    print("2. Clicking Company Profiles...")
    btns = driver.find_elements(By.TAG_NAME, "button")
    for b in btns:
        if "company profiles" in b.text.lower():
            b.click()
            break
    time.sleep(2)

    body_text = driver.find_element(By.TAG_NAME, "body").text
    print("Body text length:", len(body_text))
    assert "Organization & Business Profiles" in body_text, "Company Profiles header missing!"
    assert len(body_text) > 100, "Page is blank!"
    print("✓ Company Profiles rendered successfully!")
    driver.save_screenshot("company_profiles_verified.png")

    # Click each company card to test switching companies
    cards = driver.find_elements(By.XPATH, "//div[contains(@class, 'cursor-pointer') and contains(@class, 'rounded-2xl')]")
    print(f"Found {len(cards)} company cards in grid.")
    for idx, card in enumerate(cards):
        comp_name = card.find_element(By.TAG_NAME, "h3").text
        print(f"   Clicking company card {idx+1}: {comp_name}...")
        card.click()
        time.sleep(1)
        sub_body = driver.find_element(By.TAG_NAME, "body").text
        assert len(sub_body) > 100, f"Page went blank when clicking company {comp_name}!"
        print(f"   ✓ {comp_name} profile dossier rendered cleanly!")
    
    # Check Product Portfolio
    print("3. Testing Product Portfolio navigation...")
    for b in driver.find_elements(By.TAG_NAME, "button"):
        if "product portfolio" in b.text.lower():
            b.click()
            break
    time.sleep(1.5)
    prod_text = driver.find_element(By.TAG_NAME, "body").text
    assert "Product Portfolio" in prod_text, "Product Portfolio header missing!"
    print("✓ Product Portfolio rendered cleanly!")

    # Check Prospects & Import
    print("4. Testing Prospects & Import navigation...")
    for b in driver.find_elements(By.TAG_NAME, "button"):
        if "prospects & import" in b.text.lower():
            b.click()
            break
    time.sleep(1.5)
    prosp_text = driver.find_element(By.TAG_NAME, "body").text
    assert "Prospect Accounts" in prosp_text or "Prospects" in prosp_text, "Prospects header missing!"
    print("✓ Prospects & Import rendered cleanly!")

    # Check all 15 views navigation
    print("5. Testing navigation across all 15 dashboard views...")
    views = [
        "Overview Dashboard", "Company Profiles", "Product Portfolio", "Product ICP Engine",
        "Prospects & Import", "Account Research", "Buying Signals", "Problem Statements",
        "Prospect Scoring", "Personalised Emails", "Reply Classifier", "Conversation History",
        "Hardware & Models", "Model Audit Logs", "Settings & System"
    ]
    for v in views:
        found = False
        for b in driver.find_elements(By.TAG_NAME, "button"):
            if v.lower() in b.text.lower():
                b.click()
                time.sleep(0.8)
                txt = driver.find_element(By.TAG_NAME, "body").text
                assert len(txt) > 50, f"View {v} is blank!"
                print(f"   ✓ View verified: {v}")
                found = True
                break
        assert found, f"Sidebar button {v} not found!"

    print("=== Checking Browser Console Logs ===")
    logs = driver.get_log("browser")
    severe = [l for l in logs if l.get("level") == "SEVERE"]
    print(f"Total severe errors: {len(severe)}")
    for s in severe:
        print("  ", s)
    assert len(severe) == 0, "Console has SEVERE errors!"
    print("ALL CHECKS PASSED WITH 0 CONSOLE ERRORS!")

finally:
    driver.quit()
