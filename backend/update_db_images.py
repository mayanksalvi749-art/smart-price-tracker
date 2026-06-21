import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL or SUPABASE_KEY not found in environment variables.")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

REPLACEMENTS = {
    "photo-1695048133149-6db0f9aca30f": "photo-1695048133142-1a20484d2569",
    "photo-1695048065338-29f0b7e3f1d5": "photo-1567581935884-3349723552ca",
    "photo-1650784404025-4a2a75dfd2b3": "photo-1629131726692-1accd0c53ce0",
    "photo-1703587969650-0ab44be46e02": "photo-1610945265064-0e34e5519bbf",
    "photo-1565849511593-ed3de33d8314": "photo-1616348436168-de43ad0db179",
    "photo-1589739900243-4b52cd9b102e": "photo-1544244015-0df4b3ffc6b0",
    "photo-1698526998040-e0f0e80fff62": "photo-1610945265064-0e34e5519bbf",
    "photo-1627820723064-e2fe08b0d8d0": "photo-1600861195091-690c92f1d2cc",
    "photo-1496181130204-755241544e35": "photo-1517336714731-489689fd1ca8",
    "photo-1612287230202-1bf1d85d1bdf": "photo-1625600243103-1dc6824c6c8a",
    "photo-1527813713060-7475c081504e": "photo-1625600243103-1dc6824c6c8a",
    "photo-1510127852285-a3c2faccf04a": "photo-1495707902641-75cac588d2e9",
    "photo-1613777548195-61b0e52e96af": "photo-1580910051074-3eb694886505",
    "photo-1681244222373-56f218b8d3ab": "photo-1517336714731-489689fd1ca8",
    "photo-1517502884422-41eaaced0168": "photo-1523275335684-37898b6baf30"
}

def migrate_images():
    print("Fetching products from Supabase...")
    # We fetch products in chunks to handle database size safely
    offset = 0
    limit = 100
    updated_count = 0

    while True:
        res = supabase.table("products").select("id, name, image").range(offset, offset + limit - 1).execute()
        products = res.data or []
        if not products:
            break
        
        for p in products:
            image_url = p.get("image") or ""
            need_update = False
            new_url = image_url

            for old_id, new_id in REPLACEMENTS.items():
                if old_id in image_url:
                    new_url = image_url.replace(old_id, new_id)
                    need_update = True

            if need_update:
                try:
                    print(f"Updating Product ID {p['id']} ({p['name'][:30]}...):")
                    print(f"  Old: {image_url}")
                    print(f"  New: {new_url}")
                    
                    supabase.table("products").update({"image": new_url}).eq("id", p["id"]).execute()
                    updated_count += 1
                except Exception as e:
                    print(f"  Error updating product {p['id']}: {e}")

        offset += limit

    print(f"\nMigration complete. Total products updated: {updated_count}")

if __name__ == "__main__":
    migrate_images()
