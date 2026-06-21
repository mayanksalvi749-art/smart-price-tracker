import { useState, useCallback, useEffect } from "react";
import { FaChevronLeft, FaChevronRight, FaSearchPlus } from "react-icons/fa";
import { IMAGE_NOT_AVAILABLE } from "../utils/productImages";

/**
 * Amazon-style product image gallery with thumbnails, carousel, and hover zoom.
 */
export default function ProductImageGallery({ gallery = [], productName = "Product", variant = "light" }) {
  const items = gallery.filter((g) => g?.url);
  const [active, setActive] = useState(0);
  const [zooming, setZooming] = useState(false);
  const [imgSrc, setImgSrc] = useState(items[0]?.url || IMAGE_NOT_AVAILABLE);

  useEffect(() => {
    const first = items[0]?.url || IMAGE_NOT_AVAILABLE;
    setActive(0);
    setImgSrc(first);
  }, [productName, items.map((g) => g.url).join("|")]);

  const isDark = variant === "dark";
  const current = items[active] || { url: imgSrc, label: "Product", field: "primary_image" };

  const go = useCallback((dir) => {
    if (!items.length) return;
    setActive((i) => {
      const next = (i + dir + items.length) % items.length;
      setImgSrc(items[next].url);
      return next;
    });
  }, [items]);

  const selectThumb = (idx) => {
    setActive(idx);
    setImgSrc(items[idx].url);
  };

  const handleImgErr = () => {
    if (imgSrc !== IMAGE_NOT_AVAILABLE) setImgSrc(IMAGE_NOT_AVAILABLE);
  };

  if (!items.length) {
    return (
      <div className={`rounded-2xl p-6 flex items-center justify-center h-[380px] ${isDark ? "bg-white/10" : "bg-white border border-gray-100"}`}>
        <img src={IMAGE_NOT_AVAILABLE} alt={productName} className="max-h-full max-w-full object-contain" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main image with zoom + carousel */}
      <div
        className={`relative rounded-2xl overflow-hidden group ${isDark ? "bg-white" : "bg-white border border-gray-100 shadow-sm"}`}
        onMouseEnter={() => setZooming(true)}
        onMouseLeave={() => setZooming(false)}
      >
        <div className="relative h-[340px] md:h-[420px] overflow-hidden bg-white flex items-center justify-center">
          <img
            src={imgSrc || current.url}
            alt={`${productName} — ${current.label}`}
            loading="eager"
            referrerPolicy="no-referrer"
            onError={handleImgErr}
            className={`max-h-full max-w-full object-contain p-4 transition-transform duration-500 ease-out ${
              zooming ? "scale-150 cursor-zoom-in" : "scale-100"
            }`}
            style={{ transformOrigin: "center center" }}
          />
          {zooming && (
            <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 pointer-events-none">
              <FaSearchPlus className="text-[10px]" /> Zoom
            </div>
          )}
        </div>

        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg rounded-full w-9 h-9 flex items-center justify-center text-gray-700 opacity-0 group-hover:opacity-100 transition cursor-pointer"
              aria-label="Previous image"
            >
              <FaChevronLeft />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg rounded-full w-9 h-9 flex items-center justify-center text-gray-700 opacity-0 group-hover:opacity-100 transition cursor-pointer"
              aria-label="Next image"
            >
              <FaChevronRight />
            </button>
          </>
        )}

        <div className={`absolute bottom-0 inset-x-0 px-4 py-2 text-xs flex justify-between items-center ${isDark ? "bg-black/50 text-white" : "bg-gray-50 text-gray-500 border-t border-gray-100"}`}>
          <span>{current.label}</span>
          <span className="font-mono text-[10px]">field: {current.field}</span>
        </div>
      </div>

      {/* Thumbnails */}
      {items.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {items.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => selectThumb(idx)}
              className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 transition cursor-pointer bg-white ${
                active === idx
                  ? "border-blue-600 ring-2 ring-blue-100 shadow-md"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              title={`${item.label} (${item.field})`}
            >
              <img
                src={item.url}
                alt={item.label}
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(e) => { e.currentTarget.src = IMAGE_NOT_AVAILABLE; }}
                className="w-full h-full object-contain p-1"
              />
            </button>
          ))}
        </div>
      )}

      {/* Dot indicators (mobile carousel) */}
      {items.length > 1 && (
        <div className="flex justify-center gap-1.5 md:hidden">
          {items.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => selectThumb(idx)}
              className={`w-2 h-2 rounded-full transition ${active === idx ? "bg-blue-600 w-4" : "bg-gray-300"}`}
              aria-label={`Image ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
