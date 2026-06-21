from __future__ import annotations

import logging
from typing import Protocol

import httpx
from bs4 import BeautifulSoup

from .models import ScrapedProduct
from .utils import HEADERS, absolute_url, clean_text, external_id_from_url, parse_inr_price

logger = logging.getLogger(__name__)


class StoreScraper(Protocol):
    store_name: str

    def search(self, query: str, limit: int = 8) -> list[ScrapedProduct]: ...


class HttpStoreScraper:
    store_name = "Store"
    search_url_template = ""
    base_url = ""

    def __init__(self, timeout: float = 25.0):
        self.timeout = timeout

    def fetch_html(self, url: str) -> str:
        with httpx.Client(
            headers=HEADERS,
            follow_redirects=True,
            timeout=self.timeout,
        ) as client:
            resp = client.get(url)
            resp.raise_for_status()
            return resp.text

    def search(self, query: str, limit: int = 8) -> list[ScrapedProduct]:
        url = self.search_url_template.format(query=query.replace(" ", "+"))
        try:
            html = self.fetch_html(url)
            return self.parse_search(html, limit)
        except Exception as exc:
            logger.warning("%s search failed for %r: %s", self.store_name, query, exc)
            return []

    def parse_search(self, html: str, limit: int) -> list[ScrapedProduct]:
        raise NotImplementedError


class AmazonScraper(HttpStoreScraper):
    store_name = "Amazon"
    base_url = "https://www.amazon.in"
    search_url_template = "https://www.amazon.in/s?k={query}"

    def parse_search(self, html: str, limit: int) -> list[ScrapedProduct]:
        soup = BeautifulSoup(html, "html.parser")
        items: list[ScrapedProduct] = []
        for card in soup.select('div[data-component-type="s-search-result"]'):
            if len(items) >= limit:
                break
            title_el = card.select_one("h2 a span") or card.select_one("h2 span")
            link_el = card.select_one("h2 a")
            img_el = card.select_one("img.s-image")
            price_whole = card.select_one("span.a-price-whole")
            price_frac = card.select_one("span.a-price-fraction")
            strike = card.select_one("span.a-text-price span.a-offscreen")
            rating_el = card.select_one("span.a-icon-alt")

            name = clean_text(title_el.get_text() if title_el else "")
            href = link_el.get("href") if link_el else ""
            image = img_el.get("src") if img_el else ""
            if not name or not href:
                continue

            price_text = ""
            if price_whole:
                price_text = price_whole.get_text(strip=True)
                if price_frac:
                    price_text += "." + price_frac.get_text(strip=True)
            price = parse_inr_price(price_text)
            if not price:
                continue

            orig = parse_inr_price(strike.get_text() if strike else None)
            rating = None
            if rating_el:
                m = __import__("re").search(r"([\d.]+)", rating_el.get_text())
                if m:
                    rating = float(m.group(1))

            product_url = absolute_url(self.base_url, href)
            items.append(
                ScrapedProduct(
                    name=name,
                    price=price,
                    original_price=orig,
                    image=image,
                    product_url=product_url,
                    source=self.store_name,
                    brand="Amazon",
                    category="Electronics",
                    rating=rating,
                    external_id=external_id_from_url(product_url),
                )
            )
        return items


class FlipkartScraper(HttpStoreScraper):
    store_name = "Flipkart"
    base_url = "https://www.flipkart.com"
    search_url_template = "https://www.flipkart.com/search?q={query}"

    def parse_search(self, html: str, limit: int) -> list[ScrapedProduct]:
        soup = BeautifulSoup(html, "html.parser")
        items: list[ScrapedProduct] = []
        cards = soup.select("div[data-id]") or soup.select("a[href*='/p/']")
        seen: set[str] = set()

        for card in cards:
            if len(items) >= limit:
                break
            link = card if card.name == "a" else card.select_one("a[href*='/p/']")
            if not link:
                continue
            href = link.get("href", "")
            if "/p/" not in href:
                continue
            product_url = absolute_url(self.base_url, href.split("?")[0])
            if product_url in seen:
                continue
            seen.add(product_url)

            title_el = card.select_one("div[class*='4rR01T'], a[title], div[class*='KzDlHZ']")
            name = clean_text(
                title_el.get("title") if title_el and title_el.get("title") else
                (title_el.get_text() if title_el else link.get_text())
            )
            img_el = card.select_one("img")
            image = img_el.get("src") or img_el.get("data-src") if img_el else ""
            price_el = card.select_one("div[class*='_30jeq3'],div[class*='Nx9bqj']")
            strike_el = card.select_one("div[class*='_3I9_wc'],div[class*='yRaY8j']")
            rating_el = card.select_one("div[class*='_3LWZlK']")

            price = parse_inr_price(price_el.get_text() if price_el else None)
            if not name or not price:
                continue

            orig = parse_inr_price(strike_el.get_text() if strike_el else None)
            rating = parse_inr_price(rating_el.get_text() if rating_el else None)

            items.append(
                ScrapedProduct(
                    name=name,
                    price=price,
                    original_price=orig,
                    image=image,
                    product_url=product_url,
                    source=self.store_name,
                    brand="Flipkart",
                    category="Electronics",
                    rating=rating,
                    external_id=external_id_from_url(product_url),
                )
            )
        return items


class CromaScraper(HttpStoreScraper):
    store_name = "Croma"
    base_url = "https://www.croma.com"
    search_url_template = "https://www.croma.com/search/?q={query}"

    def parse_search(self, html: str, limit: int) -> list[ScrapedProduct]:
        soup = BeautifulSoup(html, "html.parser")
        items: list[ScrapedProduct] = []
        cards = soup.select("ul.product-list li, div.cp-product, div.product-item")
        if not cards:
            cards = soup.select("a[href*='/p/']")

        seen: set[str] = set()
        for card in cards:
            if len(items) >= limit:
                break
            link = card if card.name == "a" else card.select_one("a[href*='/p/'], a[href*='/ip/']")
            if not link:
                continue
            href = link.get("href", "")
            product_url = absolute_url(self.base_url, href)
            if product_url in seen:
                continue
            seen.add(product_url)

            name_el = card.select_one(".product-title, h3, .cp-title, [class*='title']")
            name = clean_text(name_el.get_text() if name_el else link.get_text())
            img_el = card.select_one("img")
            image = ""
            if img_el:
                image = img_el.get("data-src") or img_el.get("src") or ""
            price_el = card.select_one(".amount, .new-price, [class*='price'], .cp-price")
            mrp_el = card.select_one(".old-price, del, [class*='mrp']")

            price = parse_inr_price(price_el.get_text() if price_el else None)
            if not name or not price:
                continue

            items.append(
                ScrapedProduct(
                    name=name,
                    price=price,
                    original_price=parse_inr_price(mrp_el.get_text() if mrp_el else None),
                    image=image,
                    product_url=product_url,
                    source=self.store_name,
                    brand="Croma",
                    category="Electronics",
                    external_id=external_id_from_url(product_url),
                )
            )
        return items


class RelianceDigitalScraper(HttpStoreScraper):
    store_name = "Reliance Digital"
    base_url = "https://www.reliancedigital.in"
    search_url_template = "https://www.reliancedigital.in/search?q={query}"

    def parse_search(self, html: str, limit: int) -> list[ScrapedProduct]:
        soup = BeautifulSoup(html, "html.parser")
        items: list[ScrapedProduct] = []
        cards = soup.select("div[class*='product'], li[class*='product'], a[href*='/p/']")
        seen: set[str] = set()

        for card in cards:
            if len(items) >= limit:
                break
            link = card if card.name == "a" else card.select_one("a[href*='/p/'], a[href*='product']")
            if not link:
                continue
            href = link.get("href", "")
            product_url = absolute_url(self.base_url, href)
            if product_url in seen or product_url == self.base_url:
                continue
            seen.add(product_url)

            name_el = card.select_one("h3, h4, [class*='title'], [class*='name']")
            name = clean_text(name_el.get_text() if name_el else link.get_text())
            img_el = card.select_one("img")
            image = img_el.get("src") or img_el.get("data-src") if img_el else ""
            price_el = card.select_one("[class*='price'], [class*='selling'], span[class*='Price']")
            mrp_el = card.select_one("[class*='mrp'], del, [class*='strike']")

            price = parse_inr_price(price_el.get_text() if price_el else None)
            if not name or not price or len(name) < 5:
                continue

            items.append(
                ScrapedProduct(
                    name=name,
                    price=price,
                    original_price=parse_inr_price(mrp_el.get_text() if mrp_el else None),
                    image=image,
                    product_url=product_url,
                    source=self.store_name,
                    brand="Reliance Digital",
                    category="Electronics",
                    external_id=external_id_from_url(product_url),
                )
            )
        return items


SCRAPERS: list[HttpStoreScraper] = [
    AmazonScraper(),
    FlipkartScraper(),
    CromaScraper(),
    RelianceDigitalScraper(),
]
