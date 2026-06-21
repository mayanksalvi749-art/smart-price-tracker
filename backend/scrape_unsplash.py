from playwright.sync_api import sync_playwright
import re
import urllib.request
import concurrent.futures

queries = {
    "iphone_pro": "iphone-15-pro",
    "iphone_standard": "iphone-15",
    "galaxy_fold": "galaxy-z-fold",
    "galaxy_s24": "samsung-galaxy-s24",
    "oneplus_nord": "oneplus-phone",
    "tablet_ipad": "ipad",
    "pixel_phone": "google-pixel-phone",
    "gaming_console": "handheld-gaming-console",
    "gaming_mouse": "gaming-mouse",
    "laptop_general": "laptop",
    "canon_camera": "canon-camera",
    "smartwatch_general": "smartwatch"
}

def check_url(photo_id):
    url = f"https://images.unsplash.com/photo-{photo_id}?w=600"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status == 200:
                return photo_id, True
    except:
        pass
    return photo_id, False

def run():
    results = {}
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        for key, query in queries.items():
            print(f"Scraping Unsplash for '{query}'...")
            try:
                page.goto(f"https://unsplash.com/s/photos/{query}", wait_until="domcontentloaded", timeout=30000)
                # Let images load
                page.wait_for_timeout(3000)
                # Find all images
                images = page.locator("img").all()
                srcs = []
                for img in images:
                    src = img.get_attribute("src")
                    if src:
                        srcs.append(src)
                
                # Find photo IDs in srcs
                found_ids = []
                for src in srcs:
                    match = re.search(r'photo-([a-zA-Z0-9\-]+)', src)
                    if match:
                        photo_id = match.group(1)
                        if len(photo_id) > 10 and photo_id not in found_ids:
                            found_ids.append(photo_id)
                
                results[key] = found_ids[:8]
                print(f"  Found {len(found_ids)} photo IDs.")
            except Exception as e:
                print(f"  Error scraping '{query}': {e}")
        browser.close()

    # Validate IDs
    print("\nValidating photo IDs...")
    valid_replacements = {}
    for key, ids in results.items():
        valid_replacements[key] = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            check_results = executor.map(check_url, ids)
            for photo_id, ok in check_results:
                if ok:
                    valid_replacements[key].append(photo_id)
        print(f"Query '{key}': validated working IDs = {valid_replacements[key]}")

    print("\n--- Final Working Replacements Mapping ---")
    for k, v in valid_replacements.items():
        print(f"'{k}': {v}")

if __name__ == "__main__":
    run()
