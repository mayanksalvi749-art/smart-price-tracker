import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { sendTelegramAlert } from "../telegram";
import {
  FaArrowLeft,
  FaShoppingCart,
  FaInfoCircle,
  FaExternalLinkAlt,
  FaChartLine,
  FaTelegramPlane,
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

export default function ProductDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const [graphInterval, setGraphInterval] = useState("1W"); // "1W" | "1M" | "ALL"

  // Load from URL query parameters if state is not set
  const queryParams = new URLSearchParams(location.search);
  const queryProduct = queryParams.get("name") ? {
    id: queryParams.get("id") || "1",
    name: queryParams.get("name"),
    price: queryParams.get("price"),
    oldPrice: queryParams.get("oldPrice"),
    features: queryParams.get("features"),
    image: queryParams.get("image"),
    product_url: queryParams.get("product_url"),
    category: queryParams.get("category"),
  } : null;

  // Fallback product if route state is empty
  const product = location.state || queryProduct || {
    id: 1,
    name: "iPhone 15",
    oldPrice: "₹85,000",
    price: "₹73,500",
    features: "128GB | A16 Bionic",
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569",
    product_url: "https://example.com/iphone15",
    category: "Mobiles",
  };

  // Safe parsing helper functions
  const parsePrice = (val) => {
    if (typeof val === "number") return val;
    if (!val) return 0;
    return parseFloat(String(val).replace(/[^\d.]/g, "")) || 0;
  };

  const formatPrice = (num) => {
    return `₹${num.toLocaleString("en-IN")}`;
  };

  const priceNum = parsePrice(product.price);
  const oldPriceNum = parsePrice(product.oldPrice) || Math.round(priceNum * 1.15);
  const discountAmount = Math.max(0, oldPriceNum - priceNum);
  const discountPercentage = oldPriceNum > 0 ? Math.round((discountAmount / oldPriceNum) * 100) : 0;

  // Generate deterministic mock history based on product name and interval
  const generateHistoryData = (basePrice, interval) => {
    const points = interval === "1W" ? 7 : interval === "1M" ? 30 : 90;
    const data = [];
    let seed = 0;
    const productName = product?.name || "Product";
    for (let i = 0; i < productName.length; i++) {
      seed += productName.charCodeAt(i);
    }

    const random = (idx) => {
      const x = Math.sin(seed + idx + (interval === "1W" ? 12 : interval === "1M" ? 24 : 36)) * 10000;
      return x - Math.floor(x);
    };

    const now = new Date();
    for (let i = points - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      
      let label = "";
      if (interval === "1W") {
        label = d.toLocaleDateString("en-IN", { weekday: "short" });
      } else {
        label = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      }

      // Fluctuations: generate values between -8% and +12%
      const fluctuation = (random(i) * 0.20 - 0.08); 
      const calculatedPrice = i === 0 ? basePrice : Math.round(basePrice * (1 + fluctuation));

      data.push({
        date: label,
        price: calculatedPrice,
      });
    }
    return data;
  };

  const graphData = generateHistoryData(priceNum, graphInterval);

  const handleSendTelegram = () => {
    const origin = localStorage.getItem("appHostLink") || window.location.origin;
    const appLink = `${origin}/product?name=${encodeURIComponent(product.name)}&price=${encodeURIComponent(product.price)}&oldPrice=${encodeURIComponent(product.oldPrice)}&image=${encodeURIComponent(product.image)}&features=${encodeURIComponent(product.features)}&category=${encodeURIComponent(product.category || "")}&product_url=${encodeURIComponent(product.product_url || "#")}`;

    const escapedLink = appLink.replace(/&/g, "&amp;");
    const escapedName = product.name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const msg = `<b>${escapedName}</b> @ <b>${formatPrice(priceNum)}</b>.\n\n<b>Buy Link</b> : <a href="${escapedLink}">View in App</a>`;
    sendTelegramAlert(msg, product.image);
  };

  // Comparison store links
  const comparisonStores = [
    {
      name: "Amazon India",
      url: `https://www.amazon.in/s?k=${encodeURIComponent(product.name)}`,
      color: "from-yellow-500 to-amber-600",
    },
    {
      name: "Flipkart",
      url: `https://www.flipkart.com/search?q=${encodeURIComponent(product.name)}`,
      color: "from-blue-500 to-indigo-600",
    },
    {
      name: "Croma",
      url: `https://www.croma.com/search/?text=${encodeURIComponent(product.name)}`,
      color: "from-teal-500 to-emerald-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#111827] text-white p-6 md:p-12">
      {/* Header / Back Navigation */}
      <div className="max-w-7xl mx-auto mb-8">
        <button
          onClick={() => navigate(-1)}
          className="bg-white/10 hover:bg-white/20 border border-white/10 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 transition cursor-pointer"
        >
          <FaArrowLeft />
          Back to Dashboard
        </button>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Image and store comparison */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-2xl overflow-hidden group">
            <img
              src={product.image}
              alt={product.name}
              className="rounded-2xl w-full h-[380px] md:h-[450px] object-cover hover:scale-105 transition duration-500"
            />
          </div>

          {/* Compare Prices Links */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FaShoppingCart className="text-purple-400" />
              Compare Prices Across Stores
            </h3>
            <div className="space-y-3">
              {comparisonStores.map((store, idx) => (
                <a
                  key={idx}
                  href={store.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block text-center bg-gradient-to-r ${store.color} text-white font-bold py-3 px-4 rounded-xl hover:scale-102 transition shadow-md hover:shadow-lg flex items-center justify-between px-6`}
                >
                  <span>Search on {store.name}</span>
                  <FaExternalLinkAlt className="text-sm" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Product Info & Pricing & Chart */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Info Card */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
            <div>
              <span className="bg-purple-600/20 text-purple-400 border border-purple-500/20 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                {product.category || "Deals"}
              </span>
              <h1 className="text-3xl md:text-5xl font-bold mt-4 tracking-tight">
                {product.name}
              </h1>
            </div>

            {/* Pricing Section */}
            <div className="flex flex-wrap items-center gap-6 p-4 rounded-2xl bg-white/5 border border-white/5">
              <div>
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Current Price</p>
                <p className="text-green-400 text-4xl md:text-5xl font-extrabold mt-1">
                  {formatPrice(priceNum)}
                </p>
              </div>
              <div className="border-l border-white/10 h-12 self-center hidden sm:block"></div>
              <div>
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Original Price</p>
                <p className="line-through text-gray-500 text-2xl font-bold mt-2">
                  {formatPrice(oldPriceNum)}
                </p>
              </div>
              <div className="sm:ml-auto">
                <span className="bg-rose-500 text-white font-extrabold text-lg px-4 py-2 rounded-2xl shadow-lg shadow-rose-500/20 block text-center animate-pulse">
                  {discountPercentage}% OFF
                </span>
                <p className="text-rose-400 text-xs mt-1 text-center font-bold">
                  Save {formatPrice(discountAmount)}
                </p>
              </div>
            </div>

            {/* Features / Details */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <FaInfoCircle className="text-blue-400" />
                Product Details & Features
              </h3>
              <p className="text-gray-300 bg-white/5 p-4 rounded-2xl border border-white/5 leading-relaxed">
                {product.features || "No specific technical details available. This product is currently being tracked for real-time price drops."}
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <a
                href={product.product_url && product.product_url !== "#" ? product.product_url : `https://www.google.com/search?q=${encodeURIComponent(product.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-black hover:bg-gray-200 font-extrabold py-4 px-6 rounded-2xl shadow-xl flex items-center justify-center gap-2 text-lg transition hover:scale-102"
              >
                <FaShoppingCart />
                Buy Product Now
              </a>

              <button
                onClick={handleSendTelegram}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-extrabold py-4 px-6 rounded-2xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 text-lg transition hover:scale-102 cursor-pointer"
              >
                <FaTelegramPlane />
                Send Alert to Telegram
              </button>
            </div>
          </div>

          {/* Price History Chart Card */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <FaChartLine className="text-green-400" />
                Price History Trend
              </h3>
              {/* Interval Buttons */}
              <div className="flex bg-[#0f172a] p-1.5 rounded-xl border border-white/10 gap-1">
                {[
                  { label: "1 Week", val: "1W" },
                  { label: "1 Month", val: "1M" },
                  { label: "All History", val: "ALL" },
                ].map((tab) => (
                  <button
                    key={tab.val}
                    onClick={() => setGraphInterval(tab.val)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                      graphInterval === tab.val
                        ? "bg-purple-600 text-white shadow-md"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Recharts Chart Container */}
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={graphData}>
                  <defs>
                    <linearGradient id="detailPriceColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
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
                      backgroundColor: "#0f172a",
                      borderColor: "rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                    formatter={(value) => [`₹${value.toLocaleString("en-IN")}`, "Price"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="#a855f7"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#detailPriceColor)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}