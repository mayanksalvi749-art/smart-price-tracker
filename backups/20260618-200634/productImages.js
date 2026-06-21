/**
 * Product image helpers — always prefer stored URLs from the data source.
 * DB / API fields: image, primary_image, image_2, image_3
 */

export const IMAGE_NOT_AVAILABLE = "/image-not-available.svg";
export const DEFAULT_PLACEHOLDER = IMAGE_NOT_AVAILABLE;

const VIEW_LABELS = {
  mobile: ["Front View", "Back View", "Side View"],
  laptop: ["Front View", "Open View", "Keyboard View"],
  electronics: ["Front View", "Side View", "Detail View"],
  fashion: ["Front View", "Back View", "Folded View"],
  beauty: ["Product View", "Packaging View", "Detail View"],
  default: ["Front View", "Side View", "Detail View"],
};

const CATEGORY_ALIASES = {
  Laptops: "Electronics",
  "Men's Fashion": "Fashion",
  "Women's Fashion": "Fashion",
  Shoes: "Fashion",
  Watches: "Electronics",
  "Home Appliances": "Electronics",
  electronics: "Electronics",
  jewelery: "Beauty",
  "men's clothing": "Fashion",
  "women's clothing": "Fashion",
};

function isValidImageUrl(url) {
  if (!url || typeof url !== "string") return false;
  const t = url.trim();
  return t.startsWith("http://") || t.startsWith("https://") || t.startsWith("/");
}

function pickPrimary(product) {
  return (
    product.primary_image ||
    product.image ||
    product.image_url ||
    ""
  ).trim();
}

function viewLabelsFor(product) {
  const cat = (product.category || "").toLowerCase();
  if (cat === "mobiles") return VIEW_LABELS.mobile;
  if (cat === "electronics" || cat === "laptops") return VIEW_LABELS.electronics;
  if (cat === "fashion") return VIEW_LABELS.fashion;
  if (cat === "beauty") return VIEW_LABELS.beauty;
  return VIEW_LABELS.default;
}

export function normalizeCategory(cat) {
  if (!cat) return "Electronics";
  if (["Mobiles", "Electronics", "Fashion", "Beauty"].includes(cat)) return cat;
  return CATEGORY_ALIASES[cat] || cat;
}

/** Build gallery from stored product image fields — never replaces with generated URLs */
export function resolveProductGallery(product) {
  const labels = viewLabelsFor(product);
  const primary = pickPrimary(product);
  const hasPrimary = isValidImageUrl(primary);

  const img1 = hasPrimary ? primary : IMAGE_NOT_AVAILABLE;
  const img2 = isValidImageUrl(product.image_2) ? product.image_2 : img1;
  const img3 = isValidImageUrl(product.image_3) ? product.image_3 : img1;

  const gallery = [
    { url: img1, label: labels[0], field: "primary_image" },
    { url: img2, label: labels[1], field: "image_2" },
    { url: img3, label: labels[2], field: "image_3" },
  ];

  return {
    primary_image: img1,
    image_2: img2,
    image_3: img3,
    image: img1,
    gallery,
    product_type: product.product_type || "default",
    image_labels: labels,
    fallbackImg: IMAGE_NOT_AVAILABLE,
  };
}

export function resolveProductImage(product) {
  const primary = pickPrimary(product);
  const url = isValidImageUrl(primary) ? primary : IMAGE_NOT_AVAILABLE;
  const g = resolveProductGallery(product);
  return {
    url,
    field: "image",
    fallback: IMAGE_NOT_AVAILABLE,
    gallery: g.gallery,
    product_type: g.product_type,
  };
}

export function categoryFallbackImage() {
  return IMAGE_NOT_AVAILABLE;
}
