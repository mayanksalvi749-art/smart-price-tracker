import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
sb = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

# Get all product IDs so we can seed price history
res = sb.table("products").select("id,price,name").execute()
products = res.data or []
print(f"Total products: {len(products)}")

if not products:
    print("No products — nothing to seed.")
    exit()

# Try inserting one price_history row to see what columns exist / what errors occur
test_row = {"product_id": products[0]["id"], "price": products[0].get("price", 100)}
print("Testing price_history insert with:", test_row)
try:
    r = sb.table("price_history").insert(test_row).execute()
    print("Insert result:", r.data)
    print("Columns that exist:", list(r.data[0].keys()) if r.data else "none")
except Exception as e:
    print("Insert error:", e)

# Also try with recorded_at field name
print()
print("Checking if price_history has checked_at or recorded_at...")
try:
    r2 = sb.table("price_history").select("*").limit(1).execute()
    if r2.data:
        print("Columns:", list(r2.data[0].keys()))
    else:
        print("Still empty but no column error")
except Exception as e:
    print("Select error:", e)
