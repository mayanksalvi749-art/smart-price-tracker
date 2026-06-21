from __future__ import annotations

import logging
from datetime import datetime, timezone

from database import supabase

logger = logging.getLogger(__name__)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def upsert_product(row: dict) -> dict | None:
    """Insert or update product by product_url (or product_link)."""
    # Support both old schema (product_link/current_price) and new schema (product_url/price)
    product_url = row.get("product_url") or row.get("product_link")
    price_key = "current_price" if "current_price" in row else "price"

    existing = None
    if product_url:
        # Try both column names
        for col in ["product_url", "product_link"]:
            try:
                res = (
                    supabase.table("products")
                    .select("id, price, current_price")
                    .eq(col, product_url)
                    .limit(1)
                    .execute()
                )
                if res.data:
                    existing = res.data[0]
                    break
            except Exception:
                continue

    payload = {k: v for k, v in row.items() if v is not None}

    if existing:
        pid = existing["id"]
        old_price = float(existing.get("current_price") or existing.get("price") or 0)
        new_price = float(payload.get("current_price") or payload.get("price") or 0)
        supabase.table("products").update(payload).eq("id", pid).execute()
        if new_price and new_price != old_price:
            supabase.table("price_history").insert(
                {"product_id": pid, "price": new_price}
            ).execute()
        return {"id": pid, "updated": True}

    ins = supabase.table("products").insert(payload).execute()
    if ins.data:
        pid = ins.data[0]["id"]
        new_price = payload.get("current_price") or payload.get("price")
        if new_price:
            supabase.table("price_history").insert(
                {"product_id": pid, "price": new_price}
            ).execute()
        return {"id": pid, "created": True}
    return None


def upsert_many(rows: list[dict]) -> dict:
    created = updated = failed = 0
    for row in rows:
        try:
            result = upsert_product(row)
            if not result:
                failed += 1
            elif result.get("created"):
                created += 1
            else:
                updated += 1
        except Exception as exc:
            logger.error("Upsert failed for %s: %s", row.get("product_name"), exc)
            failed += 1
    return {"created": created, "updated": updated, "failed": failed, "total": len(rows)}


def list_products(limit: int = 200, offset: int = 0, q: str | None = None) -> list[dict]:
    query = supabase.table("products").select("*").order("created_at", desc=True)
    if q:
        # Try both 'name' (real schema) and 'product_name' (old schema)
        try:
            query = query.ilike("name", f"%{q}%")
        except Exception:
            query = query.ilike("product_name", f"%{q}%")
    res = query.range(offset, offset + limit - 1).execute()
    return res.data or []


def count_products() -> int:
    res = supabase.table("products").select("id", count="exact").execute()
    return res.count or 0


def get_price_history(product_id: int, limit: int = 30) -> list[dict]:
    # Try 'recorded_at' first (schema_v3), then 'checked_at' (older schema)
    for ts_col in ["recorded_at", "checked_at", "created_at"]:
        try:
            res = (
                supabase.table("price_history")
                .select(f"price, {ts_col}")
                .eq("product_id", product_id)
                .order(ts_col, desc=True)
                .limit(limit)
                .execute()
            )
            rows = list(reversed(res.data or []))
            # Normalise timestamp field to 'recorded_at' for the frontend
            for r in rows:
                if ts_col != "recorded_at" and ts_col in r:
                    r["recorded_at"] = r[ts_col]
            return rows
        except Exception as e:
            err_str = str(e)
            if "schema cache" in err_str or "PGRST204" in err_str:
                continue  # try next column name
            logger.warning("get_price_history error with col=%s: %s", ts_col, e)
            break
    # Final fallback: select all columns
    try:
        res = (
            supabase.table("price_history")
            .select("*")
            .eq("product_id", product_id)
            .limit(limit)
            .execute()
        )
        return list(reversed(res.data or []))
    except Exception as e:
        logger.error("get_price_history fallback failed: %s", e)
        return []

