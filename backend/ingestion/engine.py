from __future__ import annotations

import logging
from datetime import datetime, timezone

from .models import ScrapedProduct
from .playwright_scraper import playwright_search_query
from .scrapers import SCRAPERS

logger = logging.getLogger(__name__)

DEFAULT_QUERIES = [
    "iPhone 15",
    "Samsung Galaxy S24 Ultra",
    "MacBook Air M3",
    "Sony WH-1000XM5",
    "OnePlus 12",
    "iPad Air",
    "Dell XPS laptop",
    "Samsung 55 inch TV",
    "boAt headphones",
    "LG washing machine",
]


class IngestionEngine:
    """Fetches real products from Amazon, Flipkart, Croma, Reliance Digital."""

    def __init__(self, per_store_limit: int = 5, use_playwright_fallback: bool = True):
        self.per_store_limit = per_store_limit
        self.use_playwright_fallback = use_playwright_fallback

    def ingest_query(self, query: str) -> list[ScrapedProduct]:
        found: list[ScrapedProduct] = []
        seen_urls: set[str] = set()

        for scraper in SCRAPERS:
            batch = scraper.search(query, limit=self.per_store_limit)
            for p in batch:
                key = p.product_url or f"{p.source}:{p.name}"
                if key in seen_urls:
                    continue
                seen_urls.add(key)
                found.append(p)

        if not found and self.use_playwright_fallback:
            logger.info("HTTP scrapers returned 0 for %r — trying Playwright", query)
            for p in playwright_search_query(query, limit=self.per_store_limit):
                key = p.product_url or f"{p.source}:{p.name}"
                if key in seen_urls:
                    continue
                seen_urls.add(key)
                found.append(p)

        return found

    def ingest_all(self, queries: list[str] | None = None) -> list[ScrapedProduct]:
        queries = queries or DEFAULT_QUERIES
        all_products: list[ScrapedProduct] = []
        seen: set[str] = set()

        for q in queries:
            logger.info("Ingesting query: %s", q)
            for p in self.ingest_query(q):
                key = p.product_url or f"{p.source}:{p.external_id}:{p.name}"
                if key in seen:
                    continue
                seen.add(key)
                all_products.append(p)

        logger.info("Ingestion complete — %d unique products", len(all_products))
        return all_products

    @staticmethod
    def stamp_sync(rows: list[dict]) -> list[dict]:
        now = datetime.now(timezone.utc).isoformat()
        for row in rows:
            row["last_synced_at"] = now
        return rows
