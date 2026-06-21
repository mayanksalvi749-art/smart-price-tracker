import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
sb = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

# Probe by trying only product_id and price (minimal)
res = sb.table("products").select("id,price").limit(1).execute()
pid = res.data[0]["id"]
price = res.data[0]["price"]
print(f"Using product id={pid}, price={price}")

# Try just product_id + price (no timestamp)
try:
    r = sb.table("price_history").insert({"product_id": pid, "price": price}).execute()
    print("Insert SUCCESS:", r.data)
    if r.data:
        print("Columns:", list(r.data[0].keys()))
        # Clean up test row
        test_id = r.data[0]["id"]
        sb.table("price_history").delete().eq("id", test_id).execute()
        print("Cleaned up test row")
except Exception as e:
    print("Insert error:", e)
