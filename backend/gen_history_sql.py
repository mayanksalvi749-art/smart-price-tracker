import os
import random
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
sb = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

res = sb.table("products").select("id,price,name").execute()
products = res.data or []
print(f"Found {len(products)} products")

today = datetime.now(timezone.utc)
rows = []
for p in products:
    pid = p["id"]
    current = float(p.get("price") or 0)
    if current <= 0:
        continue
    for days_ago in [30, 26, 22, 18, 14, 10, 6, 2, 0]:
        variation = random.uniform(-0.15, 0.10)
        hist_price = round(max(current * (1 + variation), current * 0.5), 2)
        recorded = today - timedelta(days=days_ago)
        rows.append((pid, hist_price, recorded.isoformat()))

print(f"Generated {len(rows)} history rows")

# Write SQL
lines = [
    "-- Price History Seed Script",
    "-- Run this in Supabase SQL Editor: https://supabase.com/dashboard",
    "",
    "-- Step 1: Allow inserts into price_history from anon key",
    "DROP POLICY IF EXISTS \"Allow anon insert on price_history\" ON public.price_history;",
    "CREATE POLICY \"Allow anon insert on price_history\"",
    "  ON public.price_history FOR INSERT WITH CHECK (true);",
    "",
    "-- Step 2: Allow deletes (for cleanup)",
    "DROP POLICY IF EXISTS \"Allow public delete on price_history\" ON public.price_history;",
    "CREATE POLICY \"Allow public delete on price_history\"",
    "  ON public.price_history FOR DELETE USING (true);",
    "",
    "-- Step 3: Find actual timestamp column name",
    "SELECT column_name FROM information_schema.columns",
    "  WHERE table_name = 'price_history' AND table_schema = 'public';",
    "",
    "-- Step 4: Clear old empty history",
    "DELETE FROM public.price_history;",
    "",
    "-- Step 5: Insert 30-day price history for all products",
    "INSERT INTO public.price_history (product_id, price, checked_at) VALUES",
]

vals = [f"  ({pid}, {price}, '{ts}')" for (pid, price, ts) in rows]
lines.append(",\n".join(vals) + ";")
lines.append("")
lines.append("-- Verify")
lines.append("SELECT COUNT(*) AS total_history_rows FROM public.price_history;")

sql = "\n".join(lines)
out = os.path.join(os.path.dirname(__file__), "seed_price_history.sql")
with open(out, "w", encoding="utf-8") as f:
    f.write(sql)
print(f"Written {len(rows)} inserts to seed_price_history.sql")
