import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
sb = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

# Check products
res = sb.table("products").select("id,name,image,price,category").limit(6).execute()
print("=== SAMPLE PRODUCTS ===")
for p in res.data:
    name = (p.get("name") or "")[:55]
    img  = (p.get("image") or "")[:90]
    print(f'  id={p["id"]}  cat={p.get("category")}')
    print(f'  name={name}')
    print(f'  image={img}')
    print()

# Price history columns & sample
res2 = sb.table("price_history").select("*").limit(5).execute()
print("=== PRICE HISTORY SAMPLE ===")
if res2.data:
    print("Columns:", list(res2.data[0].keys()))
    for r in res2.data:
        print(" ", r)
else:
    print("EMPTY - no rows in price_history")

# Count total
res3 = sb.table("price_history").select("id", count="exact").execute()
print("Total price_history rows:", res3.count)
