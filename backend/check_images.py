import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
sb = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
res = sb.table("products").select("id,name,image,category").execute()
data = res.data or []
print(f"Total: {len(data)} products")

cats = {}
for p in data:
    cat = p.get("category", "Unknown")
    cats[cat] = cats.get(cat, 0) + 1
print("Category distribution:", cats)
print()

for cat in list(cats.keys())[:5]:
    samples = [p for p in data if p.get("category") == cat][:2]
    print(f"--- {cat} ---")
    for s in samples:
        name = (s.get("name") or "")[:55]
        img  = (s.get("image") or "")[:100]
        print(f"  name={name}")
        print(f"  img ={img}")
