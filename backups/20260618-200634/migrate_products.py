#!/usr/bin/env python3
"""
migrate_products.py — replaced by real-time ingestion.

Run schema migration first (schema_migration_v2.sql in Supabase SQL editor),
then ingest live products:

  pip install -r requirements.txt
  playwright install chromium   # optional browser fallback
  python run_ingest.py
"""

from run_ingest import main

if __name__ == "__main__":
    main()
