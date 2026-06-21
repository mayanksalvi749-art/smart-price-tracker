from __future__ import annotations

from dataclasses import dataclass, field, asdict
from typing import Any


@dataclass
class ScrapedProduct:
    name: str
    price: float
    image: str
    product_url: str
    source: str
    original_price: float | None = None
    rating: float | None = None
    review_count: int | None = None
    brand: str = ""
    category: str = "Electronics"
    description: str = ""
    external_id: str = ""
    discount: int = 0

    def to_db_row(self) -> dict[str, Any]:
        orig = self.original_price
        price = self.price
        discount = self.discount
        if orig and orig > price and not discount:
            discount = round(((orig - price) / orig) * 100)
        elif price and not orig and discount:
            orig = round(price / (1 - discount / 100)) if discount < 100 else price

        return {
            "product_name": self.name[:500],
            "category": self.category,
            "brand": self.brand or self.source,
            "current_price": round(price, 2),
            "original_price": round(orig, 2) if orig else round(price * 1.2, 2),
            "discount_percentage": int(discount or 0),
            "image_url": self.image,
            "product_description": (self.description or self.name)[:1000],
            "product_link": self.product_url,
            "source_website": self.source,
            "rating": self.rating if self.rating is not None else 4.0,
            "stock_status": "In Stock"
        }

