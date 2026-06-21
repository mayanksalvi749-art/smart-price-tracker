"""
Smart Price Tracker API — real product ingestion from Indian e-commerce stores.
Run: uvicorn app:app --reload --port 8000
"""

from __future__ import annotations

import threading
import logging
import os
from contextlib import asynccontextmanager
from typing import Any

from apscheduler.schedulers.background import BackgroundScheduler
from dotenv import load_dotenv
from fastapi import BackgroundTasks, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ingestion import DEFAULT_QUERIES, IngestionEngine
from compare import PriceComparisonEngine
from services.product_repository import (
    count_products,
    get_price_history,
    list_products,
    upsert_many,
)

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

REFRESH_HOURS = int(os.getenv("INGEST_REFRESH_HOURS", "6"))
_scheduler: BackgroundScheduler | None = None
_ingest_running = False


def run_ingestion_job(queries: list[str] | None = None) -> dict[str, Any]:
    global _ingest_running
    if _ingest_running:
        return {"status": "already_running"}
    _ingest_running = True
    try:
        engine = IngestionEngine(
            per_store_limit=int(os.getenv("INGEST_PER_STORE_LIMIT", "5")),
            use_playwright_fallback=os.getenv("USE_PLAYWRIGHT", "true").lower() == "true",
        )
        products = engine.ingest_all(queries)
        rows = [p.to_db_row() for p in products]
        stats = upsert_many(rows)
        stats["scraped"] = len(products)
        stats["status"] = "completed"
        logger.info("Ingestion job finished: %s", stats)
        return stats
    finally:
        _ingest_running = False


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _scheduler
    _scheduler = BackgroundScheduler()
    _scheduler.add_job(
        run_ingestion_job,
        "interval",
        hours=REFRESH_HOURS,
        id="product_refresh",
        replace_existing=True,
    )
    _scheduler.start()
    logger.info("Scheduled product refresh every %d hours", REFRESH_HOURS)

    if os.getenv("INGEST_ON_STARTUP", "true").lower() == "true":
        if count_products() == 0:
            logger.info("Database empty — starting initial ingestion")
            threading.Thread(target=run_ingestion_job, daemon=True).start()

    yield

    if _scheduler:
        _scheduler.shutdown(wait=False)


app = FastAPI(title="Smart Price Tracker API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class IngestRequest(BaseModel):
    queries: list[str] | None = None


@app.get("/")
def home():
    return {
        "message": "Smart Price Tracker API",
        "products": count_products(),
        "stores": ["Amazon", "Flipkart", "Croma", "Reliance Digital"],
    }


@app.get("/api/health")
def health():
    return {"ok": True, "products": count_products(), "ingest_running": _ingest_running}


@app.get("/api/products")
def get_products(
    q: str | None = Query(None, description="Search by product name"),
    limit: int = Query(200, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    return {"items": list_products(limit=limit, offset=offset, q=q), "count": count_products()}


@app.get("/api/products/{product_id}")
def get_product(product_id: int):
    from database import supabase

    res = supabase.table("products").select("*").eq("id", product_id).limit(1).execute()
    if not res.data:
        raise HTTPException(404, "Product not found")
    return res.data[0]


@app.get("/api/products/{product_id}/history")
def product_history(product_id: int, limit: int = Query(30, ge=1, le=90)):
    return {"items": get_price_history(product_id, limit=limit)}


@app.get("/price-stats/{product_id}")
@app.get("/api/products/{product_id}/stats")
def get_price_stats(product_id: str):
    """Compute highest/lowest/average price from price_history table."""
    from database import supabase
    try:
        try:
            p_id = int(product_id)
        except ValueError:
            return {"status": "success", "stats": None}

        result = (
            supabase.table("price_history")
            .select("price")
            .eq("product_id", p_id)
            .execute()
        )
        prices = [float(r["price"]) for r in (result.data or []) if r.get("price") is not None]
        if not prices:
            return {"status": "success", "stats": None}
        return {
            "status": "success",
            "stats": {
                "highest": max(prices),
                "lowest": min(prices),
                "average": round(sum(prices) / len(prices), 2),
                "count": len(prices),
            }
        }
    except Exception as e:
        logger.error(f"Error in price-stats: {e}")
        return {"status": "success", "stats": None}


@app.post("/api/ingest/run")
def trigger_ingest(background_tasks: BackgroundTasks, body: IngestRequest | None = None):
    queries = body.queries if body else None

    def _task():
        run_ingestion_job(queries)

    background_tasks.add_task(_task)
    return {"status": "started", "message": "Ingestion running in background"}


@app.post("/api/ingest/sync")
def sync_ingest(body: IngestRequest | None = None):
    """Blocking ingest — waits until complete."""
    queries = body.queries if body else None
    return run_ingestion_job(queries)


# ─────────────────────────────────────────────────────────────────────────────
# Real-time Price Comparison (Smartprix + Amazon + Flipkart + Croma + RD)
# ─────────────────────────────────────────────────────────────────────────────

class CompareRequest(BaseModel):
    query: str
    per_store_limit: int = 5


@app.get("/api/compare")
async def compare_prices_get(q: str = Query(..., description="Product name to compare"), limit: int = Query(5, ge=1, le=10)):
    """
    Real-time price comparison across Smartprix, Amazon, Flipkart, Croma, Reliance Digital.
    Returns structured JSON with lowest price store, all store prices, and 3-month price history.
    """
    if not q or len(q.strip()) < 3:
        raise HTTPException(400, "Query must be at least 3 characters")
    try:
        engine = PriceComparisonEngine(per_store_limit=limit)
        result = engine.compare(q.strip())
        return result.to_dict()
    except Exception as exc:
        logger.error("Price comparison failed for %r: %s", q, exc)
        raise HTTPException(500, f"Comparison failed: {exc}")


@app.post("/api/compare")
async def compare_prices_post(body: CompareRequest):
    """
    Real-time price comparison (POST version).
    Body: { "query": "iPhone 15 Pro", "per_store_limit": 5 }
    """
    if not body.query or len(body.query.strip()) < 3:
        raise HTTPException(400, "Query must be at least 3 characters")
    try:
        engine = PriceComparisonEngine(per_store_limit=body.per_store_limit)
        result = engine.compare(body.query.strip())
        return result.to_dict()
    except Exception as exc:
        logger.error("Price comparison failed for %r: %s", body.query, exc)
        raise HTTPException(500, f"Comparison failed: {exc}")
