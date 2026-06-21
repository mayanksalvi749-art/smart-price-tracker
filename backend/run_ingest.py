#!/usr/bin/env python3
"""CLI: python run_ingest.py [--query "iPhone 15"]"""

import argparse
import logging

from ingestion import DEFAULT_QUERIES, IngestionEngine
from services.product_repository import upsert_many

logging.basicConfig(level=logging.INFO)


def main():
    parser = argparse.ArgumentParser(description="Ingest real products into Supabase")
    parser.add_argument("--query", action="append", help="Search query (repeatable)")
    parser.add_argument("--limit", type=int, default=5, help="Per-store result limit")
    args = parser.parse_args()

    queries = args.query or DEFAULT_QUERIES
    engine = IngestionEngine(per_store_limit=args.limit)
    products = engine.ingest_all(queries)
    rows = [p.to_db_row() for p in products]
    stats = upsert_many(rows)
    print(f"Scraped {len(products)} products -> {stats}")


if __name__ == "__main__":
    main()
