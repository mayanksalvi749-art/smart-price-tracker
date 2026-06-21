"""Unique royalty-free image URLs — one per product, category-tagged seed."""

_global_used: set[str] = set()


def unique_image_url(category: str, index: int, product_slug: str) -> str:
    slug = f"spt-{category.lower().replace(' ', '-')}-{product_slug}-{index}"
    url = f"https://picsum.photos/seed/{slug}/400/400"
    n = 0
    while url in _global_used:
        n += 1
        url = f"https://picsum.photos/seed/{slug}-v{n}/400/400"
    _global_used.add(url)
    return url
