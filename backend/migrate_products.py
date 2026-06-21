#!/usr/bin/env python3
"""
migrate_products.py — Run live ingestion.

  python migrate_products.py       # scrape Amazon/Flipkart/Croma/Reliance Digital
"""

import sys

def main():
    from run_ingest import main as ingest_main
    print("Running live product scraper...")
    ingest_main()
    return 0

if __name__ == "__main__":
    sys.exit(main())
