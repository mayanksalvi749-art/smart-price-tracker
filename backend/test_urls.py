import urllib.request
from product_images import POOLS, assign_product_images, detect_product_type

broken = []
for t, pool in POOLS.items():
    for pid in pool:
        url = f"https://images.unsplash.com/{pid}?w=100&q=80"
        try:
            req = urllib.request.Request(url, method="HEAD")
            with urllib.request.urlopen(req, timeout=10) as r:
                if r.status >= 400:
                    broken.append((t, pid, r.status))
        except Exception as e:
            broken.append((t, pid, str(e)[:60]))

print("Broken:", len(broken))
for b in broken:
    print(b)

samples = [
    ("Sony PlayStation 5 Slim Disc Edition Console White", "Electronics"),
    ("Xbox Series X 1TB Console Black", "Electronics"),
    ("LG 27 inch Monitor", "Electronics"),
    ("Samsung 55 inch Crystal 4K TV", "Electronics"),
    ("JBL Charge 5 Speaker", "Electronics"),
    ("Sony SRS-XB100 Compact Bluetooth Speaker Black", "Electronics"),
    ("Boat Stone 350 Bluetooth Speaker Navy Blue", "Electronics"),
    ("Logitech MX Keys S Keyboard", "Electronics"),
    ("Razer BlackWidow Keyboard", "Electronics"),
    ("Logitech G502 Hero High Performance Gaming Mouse", "Electronics"),
    ("Levi's Men's Regular Fit Crew Neck T-Shirt White", "Fashion"),
    ("Nike Dri-FIT T-shirt", "Fashion"),
]
for name, cat in samples:
    t = detect_product_type(name, cat)
    imgs = assign_product_images(name, cat)
    print(name[:45], "->", t)
    print("  ", imgs["primary_image"][-55:])
