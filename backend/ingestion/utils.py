from __future__ import annotations

import re
from urllib.parse import urljoin, urlparse, parse_qs

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-IN,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


def parse_inr_price(text: str | None) -> float | None:
    if not text:
        return None
    cleaned = re.sub(r"[^\d.]", "", text.replace(",", ""))
    if not cleaned:
        return None
    try:
        val = float(cleaned)
        return val if val > 0 else None
    except ValueError:
        return None


def clean_text(text: str | None, limit: int = 300) -> str:
    if not text:
        return ""
    t = re.sub(r"\s+", " ", text).strip()
    return t[:limit]


def absolute_url(base: str, href: str | None) -> str:
    if not href:
        return ""
    if href.startswith("http"):
        return href.split("?")[0] if "flipkart" in href else href
    return urljoin(base, href)


def external_id_from_url(url: str) -> str:
    if not url:
        return ""
    parsed = urlparse(url)
    path = parsed.path.strip("/")
    if "amazon" in parsed.netloc and "/dp/" in parsed.path:
        return parsed.path.split("/dp/")[-1].split("/")[0]
    if "flipkart" in parsed.netloc:
        q = parse_qs(parsed.query).get("pid", [""])[0]
        if q:
            return q
        return path.split("/")[-1]
    if "croma" in parsed.netloc:
        return path.split("/")[-1]
    if "reliancedigital" in parsed.netloc:
        return path.split("/")[-1]
    return path.replace("/", "-")[:120]
