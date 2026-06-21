"""
Generate insert_real_products.sql for direct execution in Supabase SQL Editor.
Run: py gen_sql.py
"""
import sys, os, random
sys.path.insert(0, os.path.dirname(__file__))

# ── Copy the data definitions from populate_db.py ────────────────────────────
CATEGORIES = [
    "Smartphones", "Laptops", "Headphones", "Smart Watches",
    "Cameras", "Tablets", "Gaming Accessories", "Home Appliances"
]
WEBSITES = ["Amazon", "Flipkart", "Croma", "Reliance Digital"]

REAL_PRODUCTS = {
    "Smartphones": [
        ("Apple",    "iPhone 15 Pro Max",       164900, 154900, "https://images.unsplash.com/photo-1695048133149-6db0f9aca30f?w=600"),
        ("Apple",    "iPhone 15 Pro",            134900, 124900, "https://images.unsplash.com/photo-1695048133149-6db0f9aca30f?w=600"),
        ("Apple",    "iPhone 15",                79900,  69900,  "https://images.unsplash.com/photo-1695048065338-29f0b7e3f1d5?w=600"),
        ("Apple",    "iPhone 14",                69900,  59900,  "https://images.unsplash.com/photo-1663499482523-1c0c1bae4ce1?w=600"),
        ("Samsung",  "Galaxy S24 Ultra",         129999, 119999, "https://images.unsplash.com/photo-1703587969650-0ab44be46e02?w=600"),
        ("Samsung",  "Galaxy S24",               79999,  69999,  "https://images.unsplash.com/photo-1703587969650-0ab44be46e02?w=600"),
        ("Samsung",  "Galaxy Z Fold 6",          164999, 154999, "https://images.unsplash.com/photo-1650784404025-4a2a75dfd2b3?w=600"),
        ("Samsung",  "Galaxy Z Flip 6",          109999, 99999,  "https://images.unsplash.com/photo-1629131726692-1accd0c53ce0?w=600"),
        ("Samsung",  "Galaxy A55",               38999,  34999,  "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600"),
        ("OnePlus",  "OnePlus 12",               64999,  59999,  "https://images.unsplash.com/photo-1616348436168-de43ad0db179?w=600"),
        ("OnePlus",  "OnePlus 12R",              39999,  34999,  "https://images.unsplash.com/photo-1616348436168-de43ad0db179?w=600"),
        ("OnePlus",  "Nord CE 4",                24999,  21999,  "https://images.unsplash.com/photo-1565849511593-ed3de33d8314?w=600"),
        ("Google",   "Pixel 8 Pro",              106999, 89999,  "https://images.unsplash.com/photo-1698526998040-e0f0e80fff62?w=600"),
        ("Google",   "Pixel 8a",                 52999,  49999,  "https://images.unsplash.com/photo-1698526998040-e0f0e80fff62?w=600"),
        ("Xiaomi",   "Xiaomi 14",                69999,  64999,  "https://images.unsplash.com/photo-1613777548195-61b0e52e96af?w=600"),
        ("iQOO",     "iQOO 12",                  52999,  47999,  "https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=600"),
        ("Motorola", "Razr 50 Ultra",            99999,  89999,  "https://images.unsplash.com/photo-1574755393849-623942496936?w=600"),
        ("Motorola", "Edge 50 Pro",              31999,  27999,  "https://images.unsplash.com/photo-1574755393849-623942496936?w=600"),
    ],
    "Laptops": [
        ("Apple",  "MacBook Air M3 13-inch",  114900, 109900, "https://images.unsplash.com/photo-1681244222373-56f218b8d3ab?w=600"),
        ("Apple",  "MacBook Air M3 15-inch",  134900, 129900, "https://images.unsplash.com/photo-1681244222373-56f218b8d3ab?w=600"),
        ("Apple",  "MacBook Pro 14 M3",       168900, 159900, "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600"),
        ("Dell",   "XPS 13",                  134990, 124990, "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600"),
        ("Dell",   "Inspiron 15",              62990,  55990, "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600"),
        ("HP",     "Spectre x360",            154999, 144999, "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600"),
        ("HP",     "Victus 16",                79999,  72999, "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600"),
        ("Lenovo", "ThinkPad X1 Carbon",      169990, 159990, "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600"),
        ("Lenovo", "Yoga Slim 7",              89990,  79990, "https://images.unsplash.com/photo-1496181130204-755241544e35?w=600"),
        ("ASUS",   "ROG Zephyrus G14",        149990, 139990, "https://images.unsplash.com/photo-1593640495253-23196b27a87f?w=600"),
        ("ASUS",   "ZenBook 14 OLED",          84990,  77990, "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600"),
        ("Acer",   "Predator Helios 16",      139999, 129999, "https://images.unsplash.com/photo-1593640495253-23196b27a87f?w=600"),
        ("MSI",    "Katana 15",                94990,  84990, "https://images.unsplash.com/photo-1593640495253-23196b27a87f?w=600"),
        ("Samsung","Galaxy Book4 Pro",        154990, 144990, "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600"),
    ],
    "Headphones": [
        ("Sony",        "WH-1000XM5",              29990,  26990, "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=600"),
        ("Sony",        "WF-1000XM5",              21990,  18990, "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600"),
        ("Bose",        "QuietComfort Ultra",       35900,  31900, "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600"),
        ("Apple",       "AirPods Max",              59900,  55900, "https://images.unsplash.com/photo-1610438235354-a6ae5528385c?w=600"),
        ("Apple",       "AirPods Pro 2",            24900,  22900, "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600"),
        ("Sennheiser",  "Momentum 4",               26990,  22990, "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600"),
        ("JBL",         "Tune 770NC",               6999,   5499, "https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=600"),
        ("boAt",        "Rockerz 450",              1799,    999, "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600"),
        ("OnePlus",     "OnePlus Buds 3 Pro",       9999,   8499, "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600"),
        ("Anker",       "Space Q45",                7999,   6499, "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600"),
    ],
    "Smart Watches": [
        ("Apple",   "Apple Watch Series 9",     41900,  39900, "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=600"),
        ("Apple",   "Apple Watch Ultra 2",      89900,  84900, "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=600"),
        ("Apple",   "Apple Watch SE 2023",      29900,  27900, "https://images.unsplash.com/photo-1517502884422-41eaaced0168?w=600"),
        ("Samsung", "Galaxy Watch 6 Classic",   37999,  33999, "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600"),
        ("Samsung", "Galaxy Watch 6",           27999,  24999, "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600"),
        ("Garmin",  "Venu 3",                   39999,  36999, "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600"),
        ("Fitbit",  "Sense 2",                  19999,  16999, "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600"),
        ("Amazfit", "GTR 4",                    12999,  10999, "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600"),
        ("Noise",   "ColorFit Pro 5",            3499,   2999, "https://images.unsplash.com/photo-1517502884422-41eaaced0168?w=600"),
        ("boAt",    "Wave Sigma",                2999,   2499, "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600"),
    ],
    "Cameras": [
        ("Sony",     "Alpha 7 IV",     249990, 234990, "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600"),
        ("Sony",     "Alpha 6700",     149990, 139990, "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600"),
        ("Canon",    "EOS R6 Mark II", 229990, 214990, "https://images.unsplash.com/photo-1510127852285-a3c2faccf04a?w=600"),
        ("Canon",    "EOS R10",         79990,  69990, "https://images.unsplash.com/photo-1510127852285-a3c2faccf04a?w=600"),
        ("Nikon",    "Z6 II",          179990, 164990, "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600"),
        ("Nikon",    "Z50",             79990,  69990, "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600"),
        ("Fujifilm", "X-T5",           164990, 154990, "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600"),
        ("GoPro",    "Hero 12 Black",   44990,  39990, "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600"),
        ("Panasonic","Lumix S5 II",    169990, 159990, "https://images.unsplash.com/photo-1495707902641-75cac588d2e9?w=600"),
    ],
    "Tablets": [
        ("Apple",   "iPad Pro M4 11-inch",   99900, 94900, "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600"),
        ("Apple",   "iPad Air M2",           59900, 55900, "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=600"),
        ("Apple",   "iPad 10th Gen",         44900, 41900, "https://images.unsplash.com/photo-1589739900243-4b52cd9b102e?w=600"),
        ("Samsung", "Galaxy Tab S9 Ultra",  108999, 99999, "https://images.unsplash.com/photo-1527698266440-12104e498b76?w=600"),
        ("Samsung", "Galaxy Tab S9",         72999, 64999, "https://images.unsplash.com/photo-1527698266440-12104e498b76?w=600"),
        ("Samsung", "Galaxy Tab A9+",        26999, 23999, "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=600"),
        ("Lenovo",  "Tab P12",               29999, 26999, "https://images.unsplash.com/photo-1527698266440-12104e498b76?w=600"),
        ("Xiaomi",  "Pad 6",                 27999, 24999, "https://images.unsplash.com/photo-1589739900243-4b52cd9b102e?w=600"),
        ("OnePlus", "OnePlus Pad Go",        19999, 17999, "https://images.unsplash.com/photo-1527698266440-12104e498b76?w=600"),
    ],
    "Gaming Accessories": [
        ("Sony",      "DualSense Edge",           17499, 16499, "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600"),
        ("Sony",      "DualSense Controller",      6990,  5990, "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600"),
        ("Microsoft", "Xbox Elite Series 2",      15990, 14490, "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600"),
        ("ASUS",      "ROG Ally",                 74999, 69999, "https://images.unsplash.com/photo-1627820723064-e2fe08b0d8d0?w=600"),
        ("Logitech",  "G502 Lightspeed Wireless", 11495,  9495, "https://images.unsplash.com/photo-1527813713060-7475c081504e?w=600"),
        ("Razer",     "DeathAdder V3 Pro",        14999, 12999, "https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?w=600"),
        ("Razer",     "BlackWidow V4",            12999, 10999, "https://images.unsplash.com/photo-1600861195091-690c92f1d2cc?w=600"),
        ("SteelSeries","Apex Pro TKL",            18999, 16999, "https://images.unsplash.com/photo-1600861195091-690c92f1d2cc?w=600"),
        ("HyperX",    "Cloud III Wireless",       14999, 12999, "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600"),
    ],
    "Home Appliances": [
        ("Dyson",    "V15 Detect Extra",             56900, 49900, "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600"),
        ("Roborock", "Roborock Q7 Max",              39999, 34999, "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600"),
        ("Philips",  "Air Fryer XXL",               12999,  9999, "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=600"),
        ("Samsung",  "Front Load Washer 8kg",       47990, 41990, "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600"),
        ("LG",       "Side by Side Refrigerator 650L", 109990, 94990, "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600"),
        ("Xiaomi",   "Smart Air Purifier 4",        12999,  9999, "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600"),
        ("Philips",  "Convection Microwave 28L",    14999, 11999, "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=600"),
        ("Dyson",    "Dyson Air Purifier Cool",     54900, 47900, "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600"),
    ],
}

COLORS = ["Black", "White", "Silver", "Space Gray", "Blue", "Gold", "Midnight", "Titanium"]

def esc(s):
    return str(s).replace("'", "''")

lines = [
    "-- Smart Price Tracker: Real Products Insert Script",
    "-- Generated automatically. Run in Supabase SQL Editor.",
    "-- Table: products (columns: name, category, brand, price, discount, image, description, product_url, source, rating)",
    "",
    "DELETE FROM public.products;",
    "",
    "INSERT INTO public.products (name, category, brand, price, discount, image, description, product_url, source, rating)",
    "VALUES",
]

desc_map = {
    "Smartphones": "Flagship smartphone with high-refresh AMOLED display, powerful processor, and advanced camera system.",
    "Laptops": "Premium laptop with fast processor, ample RAM, SSD storage, and all-day battery life.",
    "Headphones": "Premium wireless headphones with active noise cancellation and high-fidelity audio.",
    "Smart Watches": "Feature-rich smartwatch with health tracking, GPS, AMOLED display, and long battery life.",
    "Cameras": "Professional-grade camera with advanced autofocus, high-resolution sensor, and 4K video.",
    "Tablets": "Powerful tablet with stunning display, fast processor, and support for stylus input.",
    "Gaming Accessories": "High-performance gaming accessory with low-latency wireless, RGB lighting, and ergonomic design.",
    "Home Appliances": "Energy-efficient smart home appliance with app connectivity and modern design.",
}

rows = []
seen = set()
for cat, catalogue in REAL_PRODUCTS.items():
    for brand, model, mrp, price, img in catalogue:
        color = random.choice(COLORS)
        name = f"{brand} {model} ({color})"
        if name in seen:
            for c in COLORS:
                alt = f"{brand} {model} ({c})"
                if alt not in seen:
                    name = alt
                    break
        seen.add(name)
        discount = round(((mrp - price) / mrp) * 100)
        source = random.choice(WEBSITES)
        slug = name.lower().replace(" ", "-").replace("(", "").replace(")", "")
        product_url = f"https://www.{source.lower().replace(' ', '')}.in/dp/{slug}"
        rating = round(random.uniform(3.9, 5.0), 1)
        desc = desc_map.get(cat, "High quality product with premium features.")
        rows.append(
            f"  ('{esc(name)}', '{esc(cat)}', '{esc(brand)}', {price}, {discount}, '{esc(img)}', '{esc(desc)}', '{esc(product_url)}', '{esc(source)}', {rating})"
        )

lines.append(",\n".join(rows) + ";")
lines.append("")
lines.append("-- Verify insert")
lines.append("SELECT COUNT(*) AS total_products FROM public.products;")

sql = "\n".join(lines)
out_path = os.path.join(os.path.dirname(__file__), "insert_real_products.sql")
with open(out_path, "w", encoding="utf-8") as f:
    f.write(sql)

print(f"Done! Written {len(rows)} product inserts to: insert_real_products.sql")
