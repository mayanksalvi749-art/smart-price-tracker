"""
Seed price_history table using the Supabase service role key.
Also seeds realistic multi-day price history so the chart shows data.
Run: py seed_price_history.py
"""
import os
import sys
import random
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

load_dotenv()

# Try to use service_role key if available, fall back to anon key
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("Error: SUPABASE_URL or key not found in environment variables.")
    sys.exit(1)

from supabase import create_client
sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Fetch all products
res = sb.table("products").select("id,price,name").execute()
products = res.data or []
print(f"Found {len(products)} products")

if not products:
    print("No products found. Nothing to seed.")
    sys.exit(0)

# Determine timestamp column name:
ts_col = None
for col in ["recorded_at", "checked_at", "created_at"]:
    try:
        sb.table("price_history").select(f"id,{col}").limit(1).execute()
        ts_col = col
        break
    except Exception:
        continue

if not ts_col:
    print("Warning: Could not determine price_history timestamp column. Defaulting to 'checked_at'.")
    ts_col = "checked_at"
else:
    print(f"Detected price_history timestamp column: '{ts_col}'")

# Generate realistic 30-day price history for each product
# Prices fluctuate +-15% around the current price
history_rows = []
today = datetime.now(timezone.utc)

for p in products:
    pid = p["id"]
    current = float(p.get("price") or 0)
    if current <= 0:
        continue

    # Generate 8 data points over 30 days (every ~4 days)
    for days_ago in [30, 26, 22, 18, 14, 10, 6, 2, 0]:
        # Random price variation: -15% to +10%
        variation = random.uniform(-0.15, 0.10)
        hist_price = round(current * (1 + variation), 2)
        # Make sure price is positive
        hist_price = max(hist_price, current * 0.50)
        recorded = today - timedelta(days=days_ago)

        history_rows.append({
            "product_id": pid,
            "price": hist_price,
            ts_col: recorded.isoformat(),
        })

print(f"Generated {len(history_rows)} history rows")
print("Inserting in chunks...")

# Insert in chunks of 100
inserted = 0
chunk_size = 100
for i in range(0, len(history_rows), chunk_size):
    chunk = history_rows[i:i + chunk_size]
    try:
        r = sb.table("price_history").insert(chunk).execute()
        if r.data:
            inserted += len(r.data)
            print(f"  Chunk {i // chunk_size + 1}: inserted {len(r.data)} rows")
        else:
            print(f"  Chunk {i // chunk_size + 1}: no data returned")
    except Exception as e:
        print(f"  Chunk {i // chunk_size + 1} error: {e}")
        # If RLS blocks, print helpful message
        if "42501" in str(e):
            print()
            print("  RLS is blocking inserts with the anon key.")
            print("  You need to run the SQL below in the Supabase SQL Editor:")
            print()
            print("  CREATE POLICY \"Allow anon insert on price_history\"")
            print("    ON public.price_history FOR INSERT WITH CHECK (true);")
            print()
            # Generate SQL for the first 50 products instead
            break

print(f"\nDone. Inserted {inserted} price history rows for {len(products)} products.")
