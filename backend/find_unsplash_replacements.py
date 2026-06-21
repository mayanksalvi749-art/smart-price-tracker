import urllib.request
import re
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

def get_images_for_query(key, query):
    url = f"https://unsplash.com/s/photos/{query}"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
        with urllib.request.urlopen(req, timeout=10) as response:
            html = response.read().decode('utf-8')
            # Extract URLs of the form https://images.unsplash.com/photo-15...
            found = re.findall(r'https://images\.unsplash\.com/photo-([a-zA-Z0-9\-]+)', html)
            # Filter and deduplicate
            found_ids = list(set([f for f in found if len(f) > 10]))
            return key, found_ids[:5]
    except Exception as e:
        print(f"Error searching for {query}: {e}")
        return key, []

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

print("Fetching Unsplash photo search pages...")
results = {}
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
    future_to_key = {executor.submit(get_images_for_query, k, v): k for k, v in queries.items()}
    for future in concurrent.futures.as_completed(future_to_key):
        key = future_to_key[future]
        try:
            k, photo_ids = future.result()
            results[k] = photo_ids
            print(f"Query '{k}': found {len(photo_ids)} photo IDs.")
        except Exception as e:
            print(f"Query '{key}' generated an exception: {e}")

# Validate the found IDs
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

print("\n--- Summary of Working Replacements ---")
for k, v in valid_replacements.items():
    print(f"'{k}': {v}")
