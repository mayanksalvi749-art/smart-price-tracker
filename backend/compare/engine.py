"""
Real-time Price Comparison Engine
Scrapes Smartprix + Amazon + Flipkart + Croma + Reliance Digital,
compares prices, finds the lowest deal, and returns structured JSON.
"""
from __future__ import annotations

import asyncio
import logging
import re
import time
from dataclasses import dataclass, field
from typing import Optional
from datetime import datetime

logger = logging.getLogger(__name__)

# ─── Data Structures ──────────────────────────────────────────────────────────

@dataclass
class StorePrice:
    store: str
    price: float
    original_price: Optional[float]
    discount_percentage: Optional[int]
    availability: str       # "In Stock" | "Out of Stock" | "Unknown"
    product_url: str
    product_title: str
    rating: Optional[float]
    image_url: str
    seller: str             # store or marketplace seller name
    last_updated: str       # ISO timestamp

    @property
    def savings(self) -> float:
        if self.original_price and self.original_price > self.price:
            return round(self.original_price - self.price, 2)
        return 0.0

    def to_dict(self) -> dict:
        return {
            "store": self.store,
            "price": self.price,
            "original_price": self.original_price,
            "discount_percentage": self.discount_percentage,
            "availability": self.availability,
            "product_url": self.product_url,
            "product_title": self.product_title,
            "rating": self.rating,
            "image_url": self.image_url,
            "seller": self.seller,
            "savings": self.savings,
            "last_updated": self.last_updated,
        }


@dataclass
class PriceHistoryPoint:
    date: str       # YYYY-MM-DD
    price: float
    store: str


@dataclass
class CompareResult:
    query: str
    scraped_at: str
    stores_checked: list[str]
    results: list[StorePrice]
    price_history_3m: list[PriceHistoryPoint]
    errors: list[str]

    @property
    def lowest_price_store(self) -> Optional[StorePrice]:
        available = [r for r in self.results if r.availability != "Out of Stock" and r.price > 0]
        if not available:
            return min(self.results, key=lambda r: r.price) if self.results else None
        return min(available, key=lambda r: r.price)

    @property
    def highest_price(self) -> Optional[float]:
        prices = [r.price for r in self.results if r.price > 0]
        return max(prices) if prices else None

    @property
    def lowest_price(self) -> Optional[float]:
        prices = [r.price for r in self.results if r.price > 0]
        return min(prices) if prices else None

    @property
    def average_price(self) -> Optional[float]:
        prices = [r.price for r in self.results if r.price > 0]
        if not prices:
            return None
        return round(sum(prices) / len(prices), 2)

    def to_dict(self) -> dict:
        lowest = self.lowest_price_store
        return {
            "query": self.query,
            "scraped_at": self.scraped_at,
            "stores_checked": self.stores_checked,
            "total_results": len(self.results),
            "lowest_price": {
                "store": lowest.store if lowest else None,
                "price": lowest.price if lowest else None,
                "product_url": lowest.product_url if lowest else None,
                "product_title": lowest.product_title if lowest else None,
                "image_url": lowest.image_url if lowest else None,
            },
            "price_summary": {
                "lowest": self.lowest_price,
                "highest": self.highest_price,
                "average": self.average_price,
            },
            "store_prices": [r.to_dict() for r in sorted(self.results, key=lambda x: x.price)],
            "price_history_3m": [
                {"date": h.date, "price": h.price, "store": h.store}
                for h in self.price_history_3m
            ],
            "errors": self.errors,
        }


# ─── Helper utilities ─────────────────────────────────────────────────────────

def _parse_price(text: str | None) -> Optional[float]:
    """Parse Indian Rupee price string → float."""
    if not text:
        return None
    cleaned = re.sub(r"[^\d.]", "", text.replace(",", ""))
    try:
        val = float(cleaned)
        return val if val > 50 else None  # reject absurd values
    except (ValueError, TypeError):
        return None


def _clean(text: str | None, limit: int = 300) -> str:
    if not text:
        return ""
    return re.sub(r"\s+", " ", str(text)).strip()[:limit]


def _now_iso() -> str:
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")


# ─── Playwright-based scrapers ─────────────────────────────────────────────────

async def _scrape_smartprix(query: str, limit: int = 5) -> list[StorePrice]:
    """Scrape Smartprix for price comparison listings."""
    results: list[StorePrice] = []
    try:
        from playwright.async_api import async_playwright
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            ctx = await browser.new_context(
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
                ),
                locale="en-IN",
            )
            page = await ctx.new_page()
            search_url = f"https://www.smartprix.com/goods?q={query.replace(' ', '+')}&sm=e"
            await page.goto(search_url, wait_until="domcontentloaded", timeout=30000)
            await page.wait_for_timeout(2000)

            cards = await page.query_selector_all("div.sm-product, div.product-item, li.product")
            for card in cards[:limit]:
                try:
                    title_el = await card.query_selector(".name, h3, .sm-name, [class*='title']")
                    price_el = await card.query_selector(".price, .selling-price, [class*='price']")
                    link_el = await card.query_selector("a")
                    img_el = await card.query_selector("img")
                    orig_el = await card.query_selector(".old-price, del, [class*='old'], [class*='mrp']")

                    title = _clean(await title_el.inner_text() if title_el else "")
                    price_txt = _clean(await price_el.inner_text() if price_el else "")
                    price = _parse_price(price_txt)
                    href = await link_el.get_attribute("href") if link_el else ""
                    img = await img_el.get_attribute("src") if img_el else ""
                    orig_txt = _clean(await orig_el.inner_text() if orig_el else "")
                    orig = _parse_price(orig_txt)

                    if not price or not title:
                        continue

                    product_url = href if href.startswith("http") else f"https://www.smartprix.com{href}"
                    disc = round(((orig - price) / orig) * 100) if orig and orig > price else None

                    results.append(StorePrice(
                        store="Smartprix",
                        price=price,
                        original_price=orig,
                        discount_percentage=disc,
                        availability="In Stock",
                        product_url=product_url,
                        product_title=title,
                        rating=None,
                        image_url=img or "",
                        seller="Smartprix",
                        last_updated=_now_iso(),
                    ))
                except Exception:
                    continue
            await browser.close()
    except Exception as exc:
        logger.warning("Smartprix scrape failed: %s", exc)
    return results


async def _scrape_amazon(query: str, limit: int = 5) -> list[StorePrice]:
    results: list[StorePrice] = []
    try:
        from playwright.async_api import async_playwright
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            ctx = await browser.new_context(
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
                ),
                locale="en-IN",
            )
            page = await ctx.new_page()
            await page.goto(
                f"https://www.amazon.in/s?k={query.replace(' ', '+')}&i=electronics",
                wait_until="domcontentloaded",
                timeout=30000,
            )
            await page.wait_for_timeout(2000)
            cards = await page.query_selector_all('div[data-component-type="s-search-result"]')
            for card in cards[:limit * 2]:
                if len(results) >= limit:
                    break
                try:
                    title_el = await card.query_selector("h2 a span, h2 span")
                    link_el = await card.query_selector("h2 a")
                    img_el = await card.query_selector("img.s-image")
                    price_whole = await card.query_selector("span.a-price-whole")
                    price_frac = await card.query_selector("span.a-price-fraction")
                    strike_el = await card.query_selector("span.a-text-price span.a-offscreen")
                    rating_el = await card.query_selector("span.a-icon-alt")

                    title = _clean(await title_el.inner_text() if title_el else "")
                    href = await link_el.get_attribute("href") if link_el else ""
                    img = await img_el.get_attribute("src") if img_el else ""
                    pt = _clean(await price_whole.inner_text() if price_whole else "")
                    if price_frac:
                        pt += "." + _clean(await price_frac.inner_text())
                    price = _parse_price(pt)
                    orig = _parse_price(_clean(await strike_el.inner_text() if strike_el else ""))

                    rating = None
                    if rating_el:
                        m = re.search(r"([\d.]+)", await rating_el.inner_text())
                        if m:
                            rating = float(m.group(1))

                    if not price or not title:
                        continue

                    product_url = f"https://www.amazon.in{href}" if href.startswith("/") else href
                    disc = round(((orig - price) / orig) * 100) if orig and orig > price else None

                    results.append(StorePrice(
                        store="Amazon",
                        price=price,
                        original_price=orig,
                        discount_percentage=disc,
                        availability="In Stock",
                        product_url=product_url,
                        product_title=title,
                        rating=rating,
                        image_url=img or "",
                        seller="Amazon.in",
                        last_updated=_now_iso(),
                    ))
                except Exception:
                    continue
            await browser.close()
    except Exception as exc:
        logger.warning("Amazon scrape failed: %s", exc)
    return results


async def _scrape_flipkart(query: str, limit: int = 5) -> list[StorePrice]:
    results: list[StorePrice] = []
    try:
        from playwright.async_api import async_playwright
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            ctx = await browser.new_context(
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
                ),
                locale="en-IN",
            )
            page = await ctx.new_page()
            # Close login popup
            await page.goto(
                f"https://www.flipkart.com/search?q={query.replace(' ', '+')}&otracker=search",
                wait_until="domcontentloaded",
                timeout=30000,
            )
            await page.wait_for_timeout(2000)
            try:
                close_btn = await page.query_selector("button._2KpZ6l._2doB4z")
                if close_btn:
                    await close_btn.click()
            except Exception:
                pass

            seen: set[str] = set()
            cards = await page.query_selector_all("a[href*='/p/']")
            for card in cards[:limit * 3]:
                if len(results) >= limit:
                    break
                try:
                    href = await card.get_attribute("href") or ""
                    if "/p/" not in href:
                        continue
                    product_url = f"https://www.flipkart.com{href.split('?')[0]}" if href.startswith("/") else href.split("?")[0]
                    if product_url in seen:
                        continue
                    seen.add(product_url)

                    title_el = await card.query_selector("div[class*='4rR01T'], div[class*='KzDlHZ'], a[title]")
                    img_el = await card.query_selector("img")
                    price_el = await card.query_selector("div[class*='_30jeq3'], div[class*='Nx9bqj']")
                    strike_el = await card.query_selector("div[class*='_3I9_wc'], div[class*='yRaY8j']")
                    rating_el = await card.query_selector("div[class*='_3LWZlK']")

                    title_txt = ""
                    if title_el:
                        title_txt = (await title_el.get_attribute("title") or "") or _clean(await title_el.inner_text())
                    title = _clean(title_txt) or _clean(await card.inner_text())[:100]

                    img = ""
                    if img_el:
                        img = await img_el.get_attribute("src") or await img_el.get_attribute("data-src") or ""

                    price = _parse_price(_clean(await price_el.inner_text() if price_el else ""))
                    orig = _parse_price(_clean(await strike_el.inner_text() if strike_el else ""))
                    rating_txt = _clean(await rating_el.inner_text() if rating_el else "")
                    rating = _parse_price(rating_txt)
                    if rating and (rating < 0 or rating > 5):
                        rating = None

                    if not price or not title or len(title) < 5:
                        continue

                    disc = round(((orig - price) / orig) * 100) if orig and orig > price else None

                    results.append(StorePrice(
                        store="Flipkart",
                        price=price,
                        original_price=orig,
                        discount_percentage=disc,
                        availability="In Stock",
                        product_url=product_url,
                        product_title=title,
                        rating=rating,
                        image_url=img,
                        seller="Flipkart",
                        last_updated=_now_iso(),
                    ))
                except Exception:
                    continue
            await browser.close()
    except Exception as exc:
        logger.warning("Flipkart scrape failed: %s", exc)
    return results


async def _scrape_croma(query: str, limit: int = 3) -> list[StorePrice]:
    results: list[StorePrice] = []
    try:
        from playwright.async_api import async_playwright
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            ctx = await browser.new_context(
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
                ),
                locale="en-IN",
            )
            page = await ctx.new_page()
            await page.goto(
                f"https://www.croma.com/search/?q={query.replace(' ', '+')}",
                wait_until="domcontentloaded",
                timeout=30000,
            )
            await page.wait_for_timeout(3000)

            cards = await page.query_selector_all("li.product-item, div.product-item")
            for card in cards[:limit * 2]:
                if len(results) >= limit:
                    break
                try:
                    title_el = await card.query_selector("h3, .product-title, [class*='title']")
                    price_el = await card.query_selector(".amount, .new-price, [class*='selling-price']")
                    link_el = await card.query_selector("a")
                    img_el = await card.query_selector("img")
                    orig_el = await card.query_selector(".old-price, del, [class*='mrp']")

                    title = _clean(await title_el.inner_text() if title_el else "")
                    price = _parse_price(_clean(await price_el.inner_text() if price_el else ""))
                    href = await link_el.get_attribute("href") if link_el else ""
                    img = (await img_el.get_attribute("data-src") or await img_el.get_attribute("src")) if img_el else ""
                    orig = _parse_price(_clean(await orig_el.inner_text() if orig_el else ""))

                    if not price or not title:
                        continue

                    product_url = href if href.startswith("http") else f"https://www.croma.com{href}"
                    disc = round(((orig - price) / orig) * 100) if orig and orig > price else None

                    results.append(StorePrice(
                        store="Croma",
                        price=price,
                        original_price=orig,
                        discount_percentage=disc,
                        availability="In Stock",
                        product_url=product_url,
                        product_title=title,
                        rating=None,
                        image_url=img or "",
                        seller="Croma",
                        last_updated=_now_iso(),
                    ))
                except Exception:
                    continue
            await browser.close()
    except Exception as exc:
        logger.warning("Croma scrape failed: %s", exc)
    return results


async def _scrape_reliancedigital(query: str, limit: int = 3) -> list[StorePrice]:
    results: list[StorePrice] = []
    try:
        from playwright.async_api import async_playwright
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            ctx = await browser.new_context(
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
                ),
                locale="en-IN",
            )
            page = await ctx.new_page()
            await page.goto(
                f"https://www.reliancedigital.in/search?q={query.replace(' ', '+')}",
                wait_until="domcontentloaded",
                timeout=30000,
            )
            await page.wait_for_timeout(3000)

            cards = await page.query_selector_all("div[class*='product-card'], li[class*='product']")
            for card in cards[:limit * 2]:
                if len(results) >= limit:
                    break
                try:
                    title_el = await card.query_selector("h3, h4, [class*='title'], [class*='name']")
                    price_el = await card.query_selector("[class*='selling-price'], [class*='price']")
                    link_el = await card.query_selector("a")
                    img_el = await card.query_selector("img")
                    orig_el = await card.query_selector("[class*='mrp'], del")

                    title = _clean(await title_el.inner_text() if title_el else "")
                    price = _parse_price(_clean(await price_el.inner_text() if price_el else ""))
                    href = await link_el.get_attribute("href") if link_el else ""
                    img = await img_el.get_attribute("src") if img_el else ""
                    orig = _parse_price(_clean(await orig_el.inner_text() if orig_el else ""))

                    if not price or not title or len(title) < 5:
                        continue

                    product_url = href if href.startswith("http") else f"https://www.reliancedigital.in{href}"
                    disc = round(((orig - price) / orig) * 100) if orig and orig > price else None

                    results.append(StorePrice(
                        store="Reliance Digital",
                        price=price,
                        original_price=orig,
                        discount_percentage=disc,
                        availability="In Stock",
                        product_url=product_url,
                        product_title=title,
                        rating=None,
                        image_url=img or "",
                        seller="Reliance Digital",
                        last_updated=_now_iso(),
                    ))
                except Exception:
                    continue
            await browser.close()
    except Exception as exc:
        logger.warning("Reliance Digital scrape failed: %s", exc)
    return results


# ─── Price History from Supabase ──────────────────────────────────────────────

def _get_price_history_from_supabase(query: str) -> list[PriceHistoryPoint]:
    """Fetch 3-month price history from the price_history table."""
    try:
        from database import supabase
        from datetime import timedelta

        three_months_ago = (datetime.utcnow() - timedelta(days=90)).isoformat()

        # Find products matching the query — try 'name' (real schema) first, then 'product_name'
        prod_res = None
        for name_col in ["name", "product_name"]:
            try:
                prod_res = supabase.table("products").select(f"id, {name_col}").ilike(name_col, f"%{query.split()[0]}%").limit(5).execute()
                if prod_res.data:
                    break
            except Exception:
                continue

        if not prod_res or not prod_res.data:
            return []

        product_ids = [p["id"] for p in prod_res.data]
        history: list[PriceHistoryPoint] = []

        for pid in product_ids:
            h_res = supabase.table("price_history").select("price, checked_at").eq("product_id", pid).gte("checked_at", three_months_ago).order("checked_at").limit(90).execute()
            for row in (h_res.data or []):
                if row.get("price") and row.get("checked_at"):
                    date_str = row["checked_at"][:10]
                    history.append(PriceHistoryPoint(
                        date=date_str,
                        price=float(row["price"]),
                        store="Database",
                    ))

        return sorted(history, key=lambda h: h.date)
    except Exception as exc:
        logger.warning("Failed to fetch price history: %s", exc)
        return []



# ─── Main Engine ──────────────────────────────────────────────────────────────

class PriceComparisonEngine:
    """
    Fetches real-time prices from multiple Indian e-commerce stores.
    Stores checked: Smartprix, Amazon, Flipkart, Croma, Reliance Digital.
    Returns structured CompareResult with price history.
    """

    STORES_CHECKED = ["Smartprix", "Amazon", "Flipkart", "Croma", "Reliance Digital"]

    def __init__(self, per_store_limit: int = 5, delay_between_stores: float = 1.0):
        self.per_store_limit = per_store_limit
        self.delay = delay_between_stores

    async def compare_async(self, query: str) -> CompareResult:
        """Run all store scrapers concurrently and return CompareResult."""
        scraped_at = _now_iso()
        errors: list[str] = []
        all_results: list[StorePrice] = []

        # Run scrapers concurrently with individual error handling
        tasks = [
            ("Smartprix", _scrape_smartprix(query, self.per_store_limit)),
            ("Amazon", _scrape_amazon(query, self.per_store_limit)),
            ("Flipkart", _scrape_flipkart(query, self.per_store_limit)),
            ("Croma", _scrape_croma(query, min(self.per_store_limit, 3))),
            ("Reliance Digital", _scrape_reliancedigital(query, min(self.per_store_limit, 3))),
        ]

        for store_name, coro in tasks:
            try:
                batch = await asyncio.wait_for(coro, timeout=45.0)
                all_results.extend(batch)
                logger.info("✓ %s: %d results", store_name, len(batch))
            except asyncio.TimeoutError:
                msg = f"{store_name}: timed out"
                errors.append(msg)
                logger.warning(msg)
            except Exception as exc:
                msg = f"{store_name}: {exc}"
                errors.append(msg)
                logger.warning(msg)

        # Deduplicate by URL
        seen_urls: set[str] = set()
        unique_results: list[StorePrice] = []
        for r in all_results:
            key = r.product_url or f"{r.store}:{r.product_title}"
            if key not in seen_urls:
                seen_urls.add(key)
                unique_results.append(r)

        # Fetch price history from Supabase
        history = _get_price_history_from_supabase(query)

        return CompareResult(
            query=query,
            scraped_at=scraped_at,
            stores_checked=self.STORES_CHECKED,
            results=unique_results,
            price_history_3m=history,
            errors=errors,
        )

    def compare(self, query: str) -> CompareResult:
        """Synchronous wrapper around compare_async."""
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # In an async context (FastAPI), run in executor
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as pool:
                    future = pool.submit(asyncio.run, self.compare_async(query))
                    return future.result(timeout=120)
            else:
                return loop.run_until_complete(self.compare_async(query))
        except Exception as exc:
            logger.error("compare() failed: %s", exc)
            return CompareResult(
                query=query,
                scraped_at=_now_iso(),
                stores_checked=self.STORES_CHECKED,
                results=[],
                price_history_3m=[],
                errors=[str(exc)],
            )
