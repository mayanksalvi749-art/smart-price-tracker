from __future__ import annotations

import logging
import re
from typing import Callable

from .models import ScrapedProduct
from .utils import HEADERS, absolute_url, clean_text, external_id_from_url, parse_inr_price

logger = logging.getLogger(__name__)

# Playwright is optional — used when HTTP scrapers return no results
_playwright_available: bool | None = None


def _check_playwright() -> bool:
    global _playwright_available
    if _playwright_available is not None:
        return _playwright_available
    try:
        from playwright.sync_api import sync_playwright  # noqa: F401
        _playwright_available = True
    except ImportError:
        _playwright_available = False
    return _playwright_available


def playwright_search(
    url: str,
    base_url: str,
    store_name: str,
    card_selector: str,
    parse_card: Callable,
    limit: int = 8,
) -> list[ScrapedProduct]:
    if not _check_playwright():
        logger.info("Playwright not installed — skip browser fallback for %s", store_name)
        return []

    from playwright.sync_api import sync_playwright

    items: list[ScrapedProduct] = []
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(user_agent=HEADERS["User-Agent"])
            page.set_extra_http_headers({"Accept-Language": HEADERS["Accept-Language"]})
            page.goto(url, wait_until="domcontentloaded", timeout=45000)
            page.wait_for_timeout(2500)
            cards = page.query_selector_all(card_selector)
            for card in cards[: limit * 2]:
                if len(items) >= limit:
                    break
                try:
                    product = parse_card(card, base_url, store_name)
                    if product:
                        items.append(product)
                except Exception:
                    continue
            browser.close()
    except Exception as exc:
        logger.warning("Playwright scrape failed for %s: %s", store_name, exc)
    return items


def _parse_amazon_card(card, base_url: str, store_name: str) -> ScrapedProduct | None:
    title_el = card.query_selector("h2 a span, h2 span")
    link_el = card.query_selector("h2 a")
    img_el = card.query_selector("img.s-image")
    price_whole = card.query_selector("span.a-price-whole")
    price_frac = card.query_selector("span.a-price-fraction")
    strike = card.query_selector("span.a-text-price span.a-offscreen")

    name = clean_text(title_el.inner_text() if title_el else "")
    href = link_el.get_attribute("href") if link_el else ""
    image = img_el.get_attribute("src") if img_el else ""
    if not name or not href:
        return None

    price_text = price_whole.inner_text().strip() if price_whole else ""
    if price_frac:
        price_text += "." + price_frac.inner_text().strip()
    price = parse_inr_price(price_text)
    if not price:
        return None

    product_url = absolute_url(base_url, href)
    return ScrapedProduct(
        name=name,
        price=price,
        original_price=parse_inr_price(strike.inner_text() if strike else None),
        image=image,
        product_url=product_url,
        source=store_name,
        brand=store_name,
        category="Electronics",
        external_id=external_id_from_url(product_url),
    )


def _parse_flipkart_card(card, base_url: str, store_name: str) -> ScrapedProduct | None:
    link = card.query_selector("a[href*='/p/']") or card
    href = link.get_attribute("href") if link else ""
    if not href or "/p/" not in href:
        return None
    title_el = card.query_selector("div[class*='4rR01T'], div[class*='KzDlHZ'], a[title]")
    img_el = card.query_selector("img")
    price_el = card.query_selector("div[class*='_30jeq3'], div[class*='Nx9bqj']")

    name = clean_text(
        title_el.get_attribute("title") if title_el and title_el.get_attribute("title")
        else (title_el.inner_text() if title_el else "")
    )
    price = parse_inr_price(price_el.inner_text() if price_el else None)
    if not name or not price:
        return None

    product_url = absolute_url(base_url, href.split("?")[0])
    image = (img_el.get_attribute("src") or img_el.get_attribute("data-src")) if img_el else ""
    return ScrapedProduct(
        name=name,
        price=price,
        image=image,
        product_url=product_url,
        source=store_name,
        brand=store_name,
        category="Electronics",
        external_id=external_id_from_url(product_url),
    )


PLAYWRIGHT_FALLBACKS = [
    (
        "Amazon",
        "https://www.amazon.in",
        "https://www.amazon.in/s?k={query}",
        'div[data-component-type="s-search-result"]',
        _parse_amazon_card,
    ),
    (
        "Flipkart",
        "https://www.flipkart.com",
        "https://www.flipkart.com/search?q={query}",
        "a[href*='/p/']",
        _parse_flipkart_card,
    ),
]


def playwright_search_query(query: str, limit: int = 6) -> list[ScrapedProduct]:
    results: list[ScrapedProduct] = []
    for store_name, base_url, url_tpl, selector, parser in PLAYWRIGHT_FALLBACKS:
        url = url_tpl.format(query=query.replace(" ", "+"))
        batch = playwright_search(url, base_url, store_name, selector, parser, limit=limit)
        results.extend(batch)
    return results
