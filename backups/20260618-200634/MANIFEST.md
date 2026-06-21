# Backup manifest — 2026-06-18

Created before adding 320+ product catalog seed (append-only).

## Backed up files
- `Dashboard.jsx` — frontend product listing page
- `productImages.js` — image resolution helpers
- `migrate_products.py` — previous migration entry point

## Files added (new)
- `backend/catalog/image_pools.py`
- `backend/catalog/generator.py`
- `backend/catalog/__init__.py`
- `backend/seed_catalog.py`

## Files minimally modified
- `frontend/src/pages/Dashboard.jsx` — category alias map + fetch sort order only
- `frontend/src/utils/productImages.js` — category alias map only
- `backend/migrate_products.py` — now runs seed_catalog by default (live scrape via `--live`)

## UI unchanged
No components, routes, cards, or layout were removed.
