"""
Generate 320+ realistic Indian e-commerce products across 17 categories.
"""

from __future__ import annotations

import random
from typing import Any

from .image_pools import unique_image_url

random.seed(42)

# (category, count, brands, name_templates, price_range_inr)
CATALOG_SPECS: list[tuple] = [
    ("Mobiles", 24, ["Apple", "Samsung", "OnePlus", "Xiaomi", "Google", "Vivo", "Oppo", "Realme"],
     ["{brand} {model} 5G ({storage}GB, {color})", "{brand} {model} Pro Max {storage}GB {color}"],
     (14999, 159999)),
    ("Laptops", 22, ["Apple", "Dell", "HP", "Lenovo", "Asus", "Acer", "MSI", "Microsoft"],
     ["{brand} {model} Laptop {cpu} {ram}GB/{storage}GB SSD", "{brand} {model} Gaming Laptop RTX {gpu} {ram}GB"],
     (34999, 249999)),
    ("Tablets", 18, ["Apple", "Samsung", "Lenovo", "Xiaomi", "OnePlus", "Realme"],
     ["{brand} {model} Tablet {storage}GB Wi-Fi", "{brand} Tab {model} {storage}GB LTE"],
     (12999, 129999)),
    ("Smart Watches", 20, ["Apple", "Samsung", "Noise", "boAt", "Garmin", "Amazfit", "Fire-Boltt"],
     ["{brand} Watch {model} GPS {size}mm", "{brand} {model} Smartwatch AMOLED"],
     (1999, 59999)),
    ("Earbuds", 20, ["Apple", "Samsung", "Sony", "boAt", "Noise", "OnePlus", "JBL", "Realme"],
     ["{brand} {model} True Wireless Earbuds ANC", "{brand} Buds {model} with Wireless Charging"],
     (999, 24999)),
    ("Headphones", 20, ["Sony", "Bose", "Sennheiser", "JBL", "boAt", "Skullcandy", "Audio-Technica"],
     ["{brand} WH-{model} Wireless Noise Cancelling Headphones", "{brand} {model} Over-Ear Bluetooth Headphones"],
     (1499, 34999)),
    ("Cameras", 18, ["Sony", "Canon", "Nikon", "GoPro", "Fujifilm", "Panasonic"],
     ["{brand} Alpha {model} Mirrorless Camera Body", "{brand} EOS {model} DSLR Kit Lens"],
     (24999, 299999)),
    ("TVs", 20, ["Samsung", "LG", "Sony", "Mi", "OnePlus", "TCL", "Vu"],
     ['{brand} {size}" Crystal 4K Ultra HD Smart TV', '{brand} {size}" OLED 4K Google TV'],
     (19999, 399999)),
    ("Monitors", 18, ["Dell", "LG", "Samsung", "BenQ", "Acer", "Asus", "MSI"],
     ['{brand} {size}" {res} Gaming Monitor {hz}Hz', '{brand} UltraSharp {size}" 4K USB-C Monitor'],
     (7999, 89999)),
    ("Keyboards", 18, ["Logitech", "Razer", "Corsair", "Keychron", "Redragon", "HyperX"],
     ["{brand} {model} Mechanical Keyboard RGB", "{brand} MX Keys {model} Wireless Keyboard"],
     (999, 19999)),
    ("Mouse", 18, ["Logitech", "Razer", "Corsair", "HP", "Dell", "Redragon"],
     ["{brand} G{model} Wireless Gaming Mouse", "{brand} MX Master {model} Bluetooth Mouse"],
     (499, 12999)),
    ("Fashion", 22, ["Levi's", "H&M", "Zara", "Allen Solly", "Peter England", "Roadster", "Biba"],
     ["{brand} Men's {item} Slim Fit {color}", "{brand} Women's {item} Casual {color}"],
     (599, 8999)),
    ("Shoes", 22, ["Nike", "Adidas", "Puma", "Reebok", "Skechers", "Bata", "Woodland"],
     ["{brand} {model} Running Shoes {color}", "{brand} {model} Sports Sneakers Men"],
     (999, 12999)),
    ("Home Appliances", 22, ["LG", "Samsung", "Whirlpool", "IFB", "Godrej", "Voltas", "Daikin"],
     ["{brand} {capacity} Washing Machine {type}", "{brand} {capacity} Refrigerator Double Door"],
     (8999, 89999)),
    ("Kitchen Appliances", 20, ["Philips", "Prestige", "Bajaj", "Morphy Richards", "Havells", "Wonderchef"],
     ["{brand} {model} Mixer Grinder 750W", "{brand} Air Fryer {capacity}L Digital"],
     (999, 24999)),
    ("Books", 20, ["Penguin", "HarperCollins", "Rupa", "Westland", "Aleph", "Hachette"],
     ['"{title}" by {author} (Paperback)', '"{title}" — {author} Bestseller Edition'],
     (199, 1999)),
    ("Fitness", 20, ["Cult", "Decathlon", "Boldfit", "Amazon Basics", "Kore", "Strauss"],
     ["{brand} Adjustable Dumbbell Set {weight}kg", "{brand} Yoga Mat {feature} 6mm"],
     (299, 14999)),
]

MODELS = {
    "Apple": ["iPhone 15", "iPhone 16 Pro", "MacBook Air M3", "iPad Air", "Watch Series 9", "AirPods Pro"],
    "Samsung": ["Galaxy S24", "Galaxy A55", "Galaxy Tab S9", "Galaxy Watch 6", "Galaxy Buds2 Pro"],
    "Sony": ["WH-1000XM5", "Alpha 7 IV", "Bravia XR", "LinkBuds"],
    "Dell": ["XPS 13", "Inspiron 15", "Alienware m16", "UltraSharp U2723QE"],
    "default": ["Pro", "Plus", "Ultra", "Max", "Elite", "Prime"],
}
COLORS = ["Black", "White", "Blue", "Silver", "Graphite", "Midnight", "Green", "Red"]
STORAGE = [64, 128, 256, 512, 1024]
RAM = [8, 16, 32]
SIZES_TV = [43, 50, 55, 65, 75]
BOOK_TITLES = [
    "Atomic Habits", "The Psychology of Money", "Ikigai", "Deep Work", "Sapiens",
    "Rich Dad Poor Dad", "Think and Grow Rich", "The Alchemist", "Wings of Fire",
    "India After Gandhi", "The Lean Startup", "Zero to One",
]
AUTHORS = ["James Clear", "Morgan Housel", "Yuval Noah Harari", "Cal Newport", "APJ Abdul Kalam"]


def _pick_model(brand: str, i: int) -> str:
    pool = MODELS.get(brand, MODELS["default"])
    return pool[i % len(pool)]


def _build_name(category: str, brand: str, template: str, i: int) -> str:
    return template.format(
        brand=brand,
        model=_pick_model(brand, i),
        storage=STORAGE[i % len(STORAGE)],
        color=COLORS[i % len(COLORS)],
        cpu="Intel i7" if i % 2 else "Ryzen 7",
        ram=RAM[i % len(RAM)],
        gpu="4060" if i % 2 else "4050",
        size=SIZES_TV[i % len(SIZES_TV)],
        res="QHD" if i % 2 else "4K",
        hz=144 if i % 2 else 165,
        item="Formal Shirt" if i % 2 else "Casual T-Shirt",
        capacity="7kg" if category == "Home Appliances" else "20L",
        type="Front Load" if i % 2 else "Top Load",
        title=BOOK_TITLES[i % len(BOOK_TITLES)],
        author=AUTHORS[i % len(AUTHORS)],
        weight=10 + (i % 5) * 2,
        feature="Anti-Slip" if i % 2 else "Extra Thick",
    )


def _slugify(text: str) -> str:
    return "".join(c if c.isalnum() else "-" for c in text.lower())[:60].strip("-")


def generate_catalog() -> list[dict[str, Any]]:
    products: list[dict[str, Any]] = []
    global_idx = 0

    for category, count, brands, templates, (lo, hi) in CATALOG_SPECS:
        for i in range(count):
            brand = brands[i % len(brands)]
            template = templates[i % len(templates)]
            title = _build_name(category, brand, template, i)
            slug = _slugify(f"{category}-{brand}-{title}-{i}")

            discount = 5 + (global_idx % 35)
            original = random.randint(lo, hi)
            original = round(original / 100) * 100
            current = round(original * (1 - discount / 100) / 100) * 100
            rating = round(3.8 + (global_idx % 12) * 0.1, 1)
            reviews = 50 + (global_idx * 137) % 9800

            image_url = unique_image_url(category, global_idx, slug)
            external_id = f"catalog-{slug}"

            products.append({
                "name": title,
                "description": f"Premium {category.lower()} from {brand}. Top-rated on Indian marketplaces with fast delivery and manufacturer warranty.",
                "category": category,
                "brand": brand,
                "image": image_url,
                "primary_image": image_url,
                "price": float(current),
                "original_price": float(original),
                "rating": float(rating),
                "review_count": int(reviews),
                "discount": int(discount),
                "product_url": f"https://www.amazon.in/s?k={slug.replace('-', '+')}",
                "source": random.choice(["Amazon", "Flipkart", "Croma", "Reliance Digital"]),
                "external_id": external_id,
            })
            global_idx += 1

    return products
