"""
Legacy entry point — use run_ingest.py or POST /api/ingest/run instead.

  python run_ingest.py
  uvicorn app:app --reload --port 8000
"""

from run_ingest import main

if __name__ == "__main__":
    main()
