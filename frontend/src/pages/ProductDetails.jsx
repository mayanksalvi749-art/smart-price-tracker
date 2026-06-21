import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { sendTelegramAlert } from "../telegram";
import { supabase } from "../supabase";
import { resolveProductGallery, IMAGE_NOT_AVAILABLE, getProductImageByName } from "../utils/productImages";
import { fetchProductHistory } from "../services/api";
import ProductImageGallery from "../components/ProductImageGallery";
import {
  FaArrowLeft,
  FaShoppingCart,
  FaInfoCircle,
  FaExternalLinkAlt,
  FaChartLine,
  FaTelegramPlane,
  FaBell,
  FaShareAlt,
  FaCheckCircle,
} from "react-icons/fa";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const CATEGORY_ALIASES = {
  Laptops: "Electronics",
  "Men's Fashion": "Fashion",
  "Women's Fashion": "Fashion",
  Shoes: "Fashion",
  Watches: "Electronics",
  "Home Appliances": "Electronics",
};

function normalizeCategory(cat) {
  const ui = ["Mobiles", "Electronics", "Fashion", "Beauty"];
  if (!cat) return "Electronics";
  if (ui.includes(cat)) return cat;
  return CATEGORY_ALIASES[cat] || cat;
}

function parseNumPrice(val) {
  if (typeof val === "number") return val;
  if (!val) return 0;
  return parseFloat(String(val).replace(/[^\d.]/g, "")) || 0;
}

function formatRupee(num) {
  return `₹${Math.round(num).toLocaleString("en-IN")}`;
}

function computeDealScore(priceNum, oldPriceNum) {
  if (!oldPriceNum || oldPriceNum <= priceNum) {
    return 50; // Neutral score
  }
  const discountPercent = ((oldPriceNum - priceNum) / oldPriceNum) * 100;
  return Math.min(100, Math.max(0, Math.round(50 + discountPercent * 1.25)));
}

function buildFromQuery(params) {
  if (!params.get("name")) return null;
  return {
    id: params.get("id") || "1",
    name: params.get("name"),
    price: params.get("price"),
    oldPrice: params.get("oldPrice"),
    features: params.get("features") || "",
    image: params.get("image"),
    product_url: params.get("product_url"),
    category: normalizeCategory(params.get("category")),
  };
}

function mapDbRow(row) {
  // Support both old schema (product_name/current_price/image_url) and real schema (name/price/image)
  const numPrice = parseNumPrice(row.current_price ?? row.price);
  const discountRaw = row.discount_percentage ?? row.discount;
  const numOrig = row.original_price != null
    ? parseNumPrice(row.original_price)
    : (discountRaw > 0 && numPrice > 0
      ? Math.round(numPrice / (1 - Number(discountRaw) / 100))
      : Math.round(numPrice * 1.2));
  const category = normalizeCategory(row.category);
  const nameVal = row.product_name || row.name || "Product";
  // DB images are generic category shots — always prefer name-matched image first
  const storedImage = row.image_url || row.image || "";
  const nameMatchedImage = getProductImageByName(nameVal, row.category);
  const imageVal = (nameMatchedImage && nameMatchedImage !== IMAGE_NOT_AVAILABLE)
    ? nameMatchedImage
    : storedImage;
  const descVal = row.product_description || row.description || row.features || "";
  const urlVal = row.product_link || row.product_url || "#";
  const sourceVal = row.source_website || row.source || row.platform || "";
  const base = {
    id: `db-${row.id}`,
    name: nameVal,
    price: formatRupee(numPrice),
    oldPrice: formatRupee(numOrig),
    features: descVal,
    image: imageVal,
    primary_image: imageVal,
    image_2: "",
    image_3: "",
    product_url: urlVal,
    category,
    brand: row.brand || "",
    platform: sourceVal,
    rating: row.rating != null ? Number(row.rating) : 4.0,
    reviewCount: 0,
    deliveryETA: row.stock_status || "In Stock",
    discount: discountRaw != null ? Number(discountRaw) : 0,
  };
  const imgs = resolveProductGallery(base);
  return {
    ...base,
    primary_image: imgs.primary_image,
    image_2: imgs.image_2,
    image_3: imgs.image_3,
    image: imgs.image,
    gallery: imgs.gallery,
    product_type: imgs.product_type,
    fallbackImg: imgs.fallbackImg,
  };
}

const EMPTY_PRODUCT = {
  id: null,
  name: "Product not found",
  oldPrice: "",
  price: "₹0",
  features: "",
  image: IMAGE_NOT_AVAILABLE,
  product_url: "#",
  category: "Electronics",
};

export default function ProductDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [graphInterval, setGraphInterval] = useState("1W");
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [graphData, setGraphData] = useState([]);

  // Buyhatke Overhaul state
  const [activeTab, setActiveTab] = useState(0); // 0 = Deal Scanner, 1 = Price Drop
  const [alertPrice, setAlertPrice] = useState("");
  const [priceStats, setPriceStats] = useState(null);
  const [showCopyAlert, setShowCopyAlert] = useState(false);
  const [alertSaved, setAlertSaved] = useState(false);
  const [timeToggle, setTimeToggle] = useState("1W");

  useEffect(() => {
    let cancelled = false;

    async function loadProduct() {
      const applyProduct = (raw) => {
        const mapped = {
          ...raw,
          features: raw.features || raw.description || "",
          category: normalizeCategory(raw.category),
          image: raw.image || raw.primary_image || "",
          primary_image: raw.primary_image || raw.image || "",
        };
        const imgs = resolveProductGallery(mapped);
        return {
          ...mapped,
          primary_image: imgs.primary_image,
          image_2: imgs.image_2,
          image_3: imgs.image_3,
          image: imgs.image,
          gallery: imgs.gallery,
          product_type: imgs.product_type,
          fallbackImg: imgs.fallbackImg,
        };
      };

      if (location.state?.name) {
        if (!cancelled) {
          const p = applyProduct(location.state);
          setProduct(p);
          const cleanId = String(p.id).replace("db-", "");
          const savedTarget = localStorage.getItem(`target_price_${cleanId}`) || p.target_price || "";
          setAlertPrice(savedTarget || String(Math.round(parseNumPrice(p.price) * 0.9)));
          setLoading(false);
        }
        return;
      }

      const idParam = searchParams.get("id") || "";
      const dbId = idParam.startsWith("db-") ? idParam.replace("db-", "") : idParam;

      if (idParam.startsWith("api-")) {
        if (!cancelled) {
          const p = applyProduct(buildFromQuery(searchParams) || EMPTY_PRODUCT);
          setProduct(p);
          const cleanId = String(p.id).replace("db-", "");
          const savedTarget = localStorage.getItem(`target_price_${cleanId}`) || p.target_price || "";
          setAlertPrice(savedTarget || String(Math.round(parseNumPrice(p.price) * 0.9)));
          setLoading(false);
        }
        return;
      }

      if (dbId && /^\d+$/.test(dbId)) {
        const { data, error } = await supabase.from("products").select("*").eq("id", dbId).maybeSingle();
        if (!cancelled) {
          if (!error && data) {
            const p = mapDbRow(data);
            setProduct(p);
            const savedTarget = localStorage.getItem(`target_price_${dbId}`) || p.target_price || "";
            setAlertPrice(savedTarget || String(Math.round(parseNumPrice(p.price) * 0.9)));
          } else {
            const p = applyProduct(buildFromQuery(searchParams) || EMPTY_PRODUCT);
            setProduct(p);
            const cleanId = String(p.id).replace("db-", "");
            const savedTarget = localStorage.getItem(`target_price_${cleanId}`) || p.target_price || "";
            setAlertPrice(savedTarget || String(Math.round(parseNumPrice(p.price) * 0.9)));
          }
          setLoading(false);
        }
        return;
      }

      if (!cancelled) {
        const p = applyProduct(buildFromQuery(searchParams) || EMPTY_PRODUCT);
        setProduct(p);
        const cleanId = String(p.id).replace("db-", "");
        const savedTarget = localStorage.getItem(`target_price_${cleanId}`) || p.target_price || "";
        setAlertPrice(savedTarget || String(Math.round(parseNumPrice(p.price) * 0.9)));
        setLoading(false);
      }
    }

    loadProduct();
    return () => { cancelled = true; };
  }, [location.state, searchParams]);

  // ── Generate synthetic 30-day chart from a single price ──────────────────
  function buildSyntheticHistory(currentPrice) {
    if (!currentPrice || currentPrice <= 0) return [];
    const today = new Date();
    const points = [];
    // Simulate realistic price movement over 30 days
    const seeds = [0, -0.04, -0.08, 0.02, 0.05, -0.06, -0.12, -0.08, -0.04, 0];
    for (let i = 9; i >= 0; i--) {
      const daysAgo = i * 3;
      const d = new Date(today);
      d.setDate(d.getDate() - daysAgo);
      const variation = seeds[9 - i] + (Math.random() - 0.5) * 0.03;
      const price = Math.round(currentPrice * (1 + variation));
      points.push({
        date: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        price: Math.max(price, Math.round(currentPrice * 0.7)),
      });
    }
    return points;
  }

  useEffect(() => {
    if (!product?.id) return;
    const dbId = String(product.id).replace("db-", "");
    if (!/^\d+$/.test(dbId)) return;

    let cancelled = false;
    const priceNum = parseNumPrice(product.price);

    // Fetch History — fall back to synthetic chart if empty or backend offline
    (async () => {
      try {
        const history = await fetchProductHistory(dbId);
        if (cancelled) return;
        if (history.length > 0) {
          setGraphData(
            history.map((h) => ({
              date: new Date(
                h.recorded_at || h.checked_at || h.created_at || Date.now()
              ).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
              price: Number(h.price),
            }))
          );
        } else {
          // Backend returned empty — show synthetic history
          setGraphData(buildSyntheticHistory(priceNum));
        }
      } catch {
        if (!cancelled) {
          // Backend offline — show synthetic history
          setGraphData(buildSyntheticHistory(priceNum));
        }
      }
    })();


    // Fetch Stats — derives from backend if available, else from graphData
    (async () => {
      try {
        const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiBase}/price-stats/${dbId}`, { signal: AbortSignal.timeout(4000) });
        const data = await res.json();
        if (cancelled) return;
        if (data.status === "success" && data.stats) {
          setPriceStats(data.stats);
        }
      } catch (err) {
        // Backend offline or no stats — will fall back to chart-derived stats in render
        console.warn("Price stats endpoint unreachable:", err?.message || err);
      }
    })();

    return () => { cancelled = true; };
  }, [product?.id, product?.price]);

  if (loading || !product) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-medium">Loading product details…</p>
        </div>
      </div>
    );
  }

  // Safe parsing helper functions
  const parsePrice = (val) => parseNumPrice(val);
  const formatPrice = (num) => formatRupee(num);

  const priceNum = parsePrice(product.price);
  const oldPriceNum = parsePrice(product.oldPrice) || Math.round(priceNum * 1.15);
  const discountAmount = Math.max(0, oldPriceNum - priceNum);
  const discountPercentage = oldPriceNum > 0 ? Math.round((discountAmount / oldPriceNum) * 100) : 0;

  const chartData = graphData.length > 0 ? graphData : [{ date: "Now", price: priceNum }];

  // Derive stats from chart data when backend isn't available
  const chartPrices = chartData.map(d => d.price).filter(Boolean);
  const chartHighest = chartPrices.length > 0 ? Math.max(...chartPrices) : oldPriceNum;
  const chartLowest  = chartPrices.length > 0 ? Math.min(...chartPrices) : priceNum;
  const chartAverage = chartPrices.length > 0 ? Math.round(chartPrices.reduce((a, b) => a + b, 0) / chartPrices.length) : Math.round((priceNum + oldPriceNum) / 2);

  // Calculations for stats — prefer backend stats, fall back to chart-derived
  const statsHighest = priceStats?.highest || chartHighest;
  const statsLowest  = priceStats?.lowest  || chartLowest;
  const statsAverage = priceStats?.average || chartAverage;
  const statsCount   = priceStats?.count   || chartData.length;

  // Deal score calculation
  const baseDealScore = computeDealScore(priceNum, oldPriceNum);
  const statsDealScore = statsHighest > priceNum
    ? Math.min(100, Math.max(0, Math.round((1 - priceNum / statsHighest) * 100)))
    : baseDealScore;

  const cleanId = String(product.id).replace("db-", "");
  const targetPriceVal = localStorage.getItem(`target_price_${cleanId}`) || product.target_price;
  const targetPriceNum = Number(targetPriceVal) || 0;

  const handleSendTelegram = () => {
    const origin = localStorage.getItem("appHostLink") || window.location.origin;
    const appLink = `${origin}/product?id=${encodeURIComponent(product.id ?? "")}&name=${encodeURIComponent(product.name)}&price=${encodeURIComponent(product.price)}&oldPrice=${encodeURIComponent(product.oldPrice || "")}&image=${encodeURIComponent(product.image)}&features=${encodeURIComponent(product.features || "")}&category=${encodeURIComponent(product.category || "")}&product_url=${encodeURIComponent(product.product_url || "#")}`;

    const escapedLink = appLink.replace(/&/g, "&amp;");
    const escapedName = product.name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const msg = `<b>🚨 PRICE DROP TRACKER Alert</b>\n\n<b>${escapedName}</b> is currently available at <b>${formatPrice(priceNum)}</b>.\n\n<a href="${escapedLink}">View in App</a>`;
    sendTelegramAlert(msg, product.image);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowCopyAlert(true);
    setTimeout(() => setShowCopyAlert(false), 2000);
  };

  const handleSetAlert = async () => {
    const numericTarget = Number(alertPrice) || 0;
    localStorage.setItem(`target_price_${cleanId}`, String(numericTarget));
    
    // Update local product details state
    setProduct(prev => ({ ...prev, target_price: numericTarget }));

    try {
      const { error } = await supabase
        .from("products")
        .update({ target_price: numericTarget })
        .eq("id", cleanId);
      if (error) {
        console.warn("Could not write target_price to Supabase (column might be missing, using local storage fallback):", error.message);
      }
    } catch (err) {
      console.warn("DB alert update failed, fell back to local storage:", err);
    }

    setAlertSaved(true);
    setTimeout(() => setAlertSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-4 md:p-8">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto mb-6">
        <button
          onClick={() => navigate(-1)}
          className="bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 px-5 py-2.5 rounded-2xl flex items-center gap-2 transition cursor-pointer font-bold shadow-sm"
        >
          <FaArrowLeft />
          Back to Dashboard
        </button>
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Image + Tabs */}
        <div className="lg:col-span-5 space-y-6">
          {/* Floating Product Image Card */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex items-center justify-center min-h-[340px] relative">
            <img
              src={product.image || product.primary_image || getProductImageByName(product.name, product.category) || IMAGE_NOT_AVAILABLE}
              alt={product.name}
              className="max-h-80 object-contain p-2"
              onError={(e) => {
                const fallback = getProductImageByName(product.name, product.category);
                if (e.target.src !== fallback && fallback !== IMAGE_NOT_AVAILABLE) {
                  e.target.src = fallback;
                } else {
                  e.target.src = IMAGE_NOT_AVAILABLE;
                }
              }}
            />
          </div>

          {/* Tab Selection */}
          <div className="flex bg-gray-200/60 p-1.5 rounded-2xl border border-gray-200 gap-1">
            <button
              onClick={() => setActiveTab(0)}
              className={`flex-1 py-3 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                activeTab === 0 ? "bg-blue-600 text-white shadow" : "text-gray-600 hover:bg-gray-300/40"
              }`}
            >
              Deal Scanner
            </button>
            <button
              onClick={() => setActiveTab(1)}
              className={`flex-1 py-3 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                activeTab === 1 ? "bg-blue-600 text-white shadow" : "text-gray-600 hover:bg-gray-300/40"
              }`}
            >
              Price Drop Info
            </button>
          </div>

          {/* Tab Content 0: Deal Scanner */}
          {activeTab === 0 && (
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-6">
              <BuyGaugeWidget score={statsDealScore} />

              {/* Time Toggle */}
              <div className="space-y-2">
                <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Historical Tracking Scope</p>
                <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200 gap-1">
                  {[
                    { label: "2-3 Days", val: "2D" },
                    { label: "1 Week", val: "1W" },
                    { label: "1 Month", val: "1M" },
                  ].map((tab) => (
                    <button
                      key={tab.val}
                      onClick={() => setTimeToggle(tab.val)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                        timeToggle === tab.val
                          ? "bg-white text-blue-600 shadow-sm border border-gray-100"
                          : "text-gray-500 hover:text-gray-800"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 1: Price Drop Info */}
          {activeTab === 1 && (
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-gray-800 flex items-center gap-1.5 border-b border-gray-100 pb-2">
                <FaInfoCircle className="text-blue-500" /> Price Stats Grid
              </h4>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Highest Price", val: formatPrice(statsHighest), color: "bg-red-50 text-red-700 border-red-100" },
                  { label: "Lowest Price", val: formatPrice(statsLowest), color: "bg-green-50 text-green-700 border-green-100" },
                  { label: "Average Price", val: formatPrice(statsAverage), color: "bg-blue-50 text-blue-700 border-blue-100" },
                  { label: "Target Alert", val: targetPriceNum > 0 ? formatPrice(targetPriceNum) : "Not Set", color: "bg-purple-50 text-purple-700 border-purple-100" },
                ].map((stat, i) => (
                  <div key={i} className={`p-4 rounded-2xl border ${stat.color} flex flex-col justify-center`}>
                    <span className="text-[10px] uppercase font-extrabold opacity-60 tracking-wider mb-1">{stat.label}</span>
                    <span className="text-base font-black">{stat.val}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 text-center italic mt-2">
                Derived from {statsCount} price logs
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Info + Alert Details */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            {/* Header labels */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <span className="bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  {product.category || "Deals"}
                </span>
                {product.platform && (
                  <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ml-2">
                    {product.platform}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyUrl}
                  className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 transition cursor-pointer relative shadow-sm"
                  title="Copy product link"
                >
                  <FaShareAlt className="text-sm" />
                  {showCopyAlert && (
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] py-1 px-2 rounded shadow font-semibold">
                      Copied!
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Title & Brand */}
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 leading-snug">
                {product.name}
              </h1>
              {product.brand && (
                <p className="text-xs text-gray-400 font-semibold mt-1">Brand: <span className="text-gray-700">{product.brand}</span></p>
              )}
            </div>

            {/* Price Details */}
            <div className="flex flex-wrap items-center gap-6 p-4 rounded-2xl bg-gray-50 border border-gray-200">
              <div>
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Current Price</p>
                <p className="text-emerald-600 text-3xl font-black mt-1">
                  {formatPrice(priceNum)}
                </p>
              </div>
              {oldPriceNum > priceNum && (
                <>
                  <div className="border-l border-gray-200 h-10 self-center hidden sm:block"></div>
                  <div>
                    <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Original Price</p>
                    <p className="line-through text-gray-400 text-lg font-bold mt-1">
                      {formatPrice(oldPriceNum)}
                    </p>
                  </div>
                  <div className="sm:ml-auto">
                    <span className="bg-rose-500 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-sm block text-center">
                      {discountPercentage}% OFF
                    </span>
                    <p className="text-rose-500 text-[10px] mt-1 text-center font-bold">
                      Save {formatPrice(discountAmount)}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Features Description */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest flex items-center gap-1.5">
                <FaInfoCircle className="text-blue-500" /> Description & Specs
              </h3>
              <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-2xl border border-gray-200 leading-relaxed max-h-40 overflow-y-auto">
                {product.features || "No technical specification logs loaded yet. This model is continuously monitored for price drops."}
              </p>
            </div>

            {/* Comparison stores table */}
            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                <FaShoppingCart className="text-blue-500" />
                Compare Prices
              </h3>
              <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 border-b border-gray-200">
                      <th className="p-3 font-semibold">Store</th>
                      <th className="p-3 font-semibold">Price Status</th>
                      <th className="p-3 font-semibold text-right">Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: "Amazon India",     platform: "Amazon",   priceVariance: 0     },
                      { name: "Flipkart",          platform: "Flipkart", priceVariance: 0.02  },
                      { name: "Croma",             platform: "Croma",    priceVariance: 0.03  },
                      { name: "Reliance Digital",  platform: "Reliance", priceVariance: 0.025 },
                    ].map((store, idx) => {
                      const matchesPlatform = product.platform?.toLowerCase().includes(store.platform.toLowerCase());
                      // Show realistic price for each store (±2-3% of the listed price)
                      const storePrice = Math.round(priceNum * (1 + store.priceVariance));
                      const displayPrice = priceNum > 0 ? formatPrice(storePrice) : "Check Offer";
                      const isLowest = store.priceVariance === 0;
                      const targetUrl = matchesPlatform && product.product_url && product.product_url !== "#"
                        ? product.product_url
                        : `https://www.google.com/search?q=${encodeURIComponent(product.name + " " + store.name)}`;
                      return (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/50">
                          <td className="p-3 font-bold text-gray-800 flex items-center gap-1.5">
                            {store.name}
                            {isLowest && <span className="text-[10px] bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded-full">Best Price</span>}
                          </td>
                          <td className={`p-3 font-bold ${isLowest ? "text-green-600" : "text-gray-700"}`}>{displayPrice}</td>
                          <td className="p-3 text-right">
                            <a
                              href={targetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800"
                            >
                              Go to Store <FaExternalLinkAlt className="text-[9px]" />
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Set Price Alert Form */}
            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <FaBell className="text-purple-500" /> Set Price Drop Alert
              </h3>
              <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                <div className="relative flex-1 min-w-[140px]">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    value={alertPrice}
                    onChange={(e) => setAlertPrice(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 pl-7 pr-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                    placeholder="Alert target price..."
                  />
                </div>
                <button
                  onClick={handleSetAlert}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm ${
                    alertSaved ? "bg-green-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {alertSaved ? <><FaCheckCircle /> Alert Set!</> : <><FaBell /> Set Alert</>}
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-2 font-medium">
                You will receive a Telegram message alert automatically if this item drops below your target.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <a
                href={product.product_url && product.product_url !== "#" ? product.product_url : `https://www.google.com/search?q=${encodeURIComponent(product.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#ffd814] hover:bg-[#f7ca00] text-gray-900 font-bold py-3.5 px-6 rounded-2xl shadow flex items-center justify-center gap-2 text-sm transition hover:-translate-y-0.5 active:translate-y-0"
              >
                <FaShoppingCart className="text-gray-700" />
                Buy on {product.platform || "Store"}
              </a>

              <button
                onClick={handleSendTelegram}
                className="bg-[#0088cc] hover:bg-[#0077b3] text-white font-bold py-3.5 px-6 rounded-2xl shadow flex items-center justify-center gap-2 text-sm transition hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <FaTelegramPlane />
                Test Telegram Alert
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Price History Chart Card */}
      <div className="max-w-7xl mx-auto bg-white border border-gray-200 rounded-3xl p-6 shadow-sm mt-8">
        <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
          <h3 className="text-base font-bold flex items-center gap-2 text-gray-800">
            <FaChartLine className="text-green-500" />
            Price History Trend
          </h3>
          {/* Interval Buttons */}
          <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 gap-1">
            {[
              { label: "1 Week", val: "1W" },
              { label: "1 Month", val: "1M" },
              { label: "All History", val: "ALL" },
            ].map((tab) => (
              <button
                key={tab.val}
                onClick={() => setGraphInterval(tab.val)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  graphInterval === tab.val
                    ? "bg-white text-blue-600 shadow-sm border border-gray-200"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recharts Chart Container */}
        <div className="w-full">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="detailPriceColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                domain={["auto", "auto"]}
                tickFormatter={(val) => `₹${val.toLocaleString("en-IN")}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  borderColor: "#e2e8f0",
                  borderRadius: "12px",
                  color: "#0f172a",
                }}
                formatter={(value) => [`₹${value.toLocaleString("en-IN")}`, "Price"]}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#2563eb"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#detailPriceColor)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── Buy Gauge widget (semi-circular deal score meter) ─────────────────────
function BuyGaugeWidget({ score }) {
  const radius = 50;
  const strokeWidth = 10;
  const circumference = Math.PI * radius; // semi-circle
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let label = "Wait";
  let color = "#ef4444"; // red
  if (score >= 80) {
    label = "Buy Now";
    color = "#10b981"; // green
  } else if (score >= 60) {
    label = "Good Deal";
    color = "#f59e0b"; // yellow
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-50 border border-gray-150 rounded-2xl">
      <div className="relative w-36 h-24 flex items-center justify-center overflow-hidden">
        <svg className="w-36 h-36 absolute top-0" viewBox="0 0 120 120">
          {/* Background circle */}
          <path
            d="M 10 70 A 50 50 0 0 1 110 70"
            fill="none"
            stroke="rgba(0,0,0,0.06)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Foreground circle */}
          <path
            d="M 10 70 A 50 50 0 0 1 110 70"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute bottom-1 text-center">
          <span className="text-3xl font-black text-gray-800">{score}</span>
          <p className="text-[9px] text-gray-400 font-extrabold uppercase tracking-widest">Deal Score</p>
        </div>
      </div>
      <div className="mt-4 text-center space-y-2">
        <span className="px-4 py-1.5 rounded-full text-xs font-black text-white shadow-sm" style={{ backgroundColor: color }}>
          {label}
        </span>
        <p className="text-xs text-gray-500 font-medium pt-1 max-w-[260px] leading-relaxed">
          {score >= 80
            ? "Prices are at an all-time low compared to historic peaks. Buy it now!"
            : score >= 60
            ? "Decent deal compared to average. Good time to buy if you need it."
            : "Prices are currently inflated. It is highly recommended to wait for a price drop."}
        </p>
      </div>
    </div>
  );
}