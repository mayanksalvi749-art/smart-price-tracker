import "./PriceComparePage.css";
import { useState, useRef, useEffect } from "react";
import {
  FaSearch, FaExternalLinkAlt, FaArrowDown, FaBolt,
  FaShoppingCart, FaChartLine, FaStore, FaCheckCircle,
  FaExclamationTriangle, FaStar, FaHistory, FaTag,
  FaAngleDown, FaAngleUp, FaTrophy, FaFire, FaSpinner,
} from "react-icons/fa";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from "recharts";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ─── Store logos/colors ───────────────────────────────────────────────────────
const STORE_META = {
  Amazon:           { color: "#FF9900", bg: "#FFF8EE", logo: "🔶", label: "Amazon.in" },
  Flipkart:         { color: "#2874F0", bg: "#EEF5FF", logo: "🛒", label: "Flipkart" },
  Smartprix:        { color: "#E64A19", bg: "#FFF3EF", logo: "📊", label: "Smartprix" },
  Croma:            { color: "#00A99D", bg: "#EEFAFA", logo: "🏪", label: "Croma" },
  "Reliance Digital": { color: "#C62828", bg: "#FFF0F0", logo: "⚡", label: "Reliance Digital" },
};

function getStoreMeta(store) {
  return STORE_META[store] || { color: "#6366f1", bg: "#F0F0FF", logo: "🏬", label: store };
}

// ─── Formatters ───────────────────────────────────────────────────────────────
function fmt(price) {
  if (!price && price !== 0) return "N/A";
  return `₹${Math.round(price).toLocaleString("en-IN")}`;
}

function fmtDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// ─── Components ──────────────────────────────────────────────────────────────

function LoadingAnimation() {
  return (
    <div className="compare-loading">
      <div className="compare-loading-inner">
        <div className="scanning-ring" />
        <div className="scanning-icon">
          <FaSearch size={28} color="#6366f1" />
        </div>
      </div>
      <h3>Scanning 5 stores in real-time…</h3>
      <div className="store-pills">
        {["Smartprix", "Amazon", "Flipkart", "Croma", "Reliance Digital"].map((s, i) => (
          <span key={s} className="store-pill" style={{ animationDelay: `${i * 0.3}s` }}>
            {getStoreMeta(s).logo} {s}
          </span>
        ))}
      </div>
    </div>
  );
}

function LowestPriceBanner({ store }) {
  if (!store) return null;
  const meta = getStoreMeta(store.store);
  const disc = store.discount_percentage;
  return (
    <div className="lowest-banner">
      <div className="lowest-banner-left">
        <div className="trophy-wrap">
          <FaTrophy size={28} color="#FFD700" />
        </div>
        <div>
          <div className="lowest-label">🔥 Best Price Found</div>
          <div className="lowest-store" style={{ color: meta.color }}>
            {meta.logo} {store.store}
          </div>
          <div className="lowest-title">{store.product_title?.slice(0, 80)}</div>
        </div>
      </div>
      <div className="lowest-banner-right">
        <div className="lowest-price">{fmt(store.price)}</div>
        {store.original_price > store.price && (
          <div className="lowest-orig">
            <span className="strike">{fmt(store.original_price)}</span>
            {disc && <span className="disc-badge">{disc}% OFF</span>}
          </div>
        )}
        {store.savings > 0 && (
          <div className="savings-note">You save {fmt(store.savings)}</div>
        )}
        <a
          href={store.product_url}
          target="_blank"
          rel="noopener noreferrer"
          className="buy-btn-cta"
        >
          Buy Now <FaExternalLinkAlt size={12} />
        </a>
      </div>
    </div>
  );
}

function StoreCard({ item, rank, isLowest }) {
  const meta = getStoreMeta(item.store);
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className={`store-card ${isLowest ? "store-card--best" : ""}`}
      style={{ "--accent": meta.color }}
    >
      {isLowest && (
        <div className="best-badge">
          <FaBolt size={10} /> BEST PRICE
        </div>
      )}
      <div className="store-card-header">
        <div className="rank-circle" style={{ background: isLowest ? "#FFD700" : "#e5e7eb", color: isLowest ? "#000" : "#555" }}>
          #{rank}
        </div>
        <div className="store-logo-wrap" style={{ background: meta.bg }}>
          <span className="store-logo-emoji">{meta.logo}</span>
          <span className="store-name-label" style={{ color: meta.color }}>{meta.label}</span>
        </div>
        <div className="avail-chip" style={{ background: item.availability === "In Stock" ? "#dcfce7" : "#fee2e2", color: item.availability === "In Stock" ? "#166534" : "#991b1b" }}>
          {item.availability === "In Stock" ? <FaCheckCircle size={10} /> : <FaExclamationTriangle size={10} />}
          {item.availability}
        </div>
      </div>

      <div className="store-card-title">{item.product_title?.slice(0, 70)}</div>

      <div className="store-card-price-row">
        <span className="store-price" style={{ color: meta.color }}>{fmt(item.price)}</span>
        {item.original_price > item.price && (
          <span className="store-orig-price">{fmt(item.original_price)}</span>
        )}
        {item.discount_percentage && (
          <span className="store-disc">{item.discount_percentage}% off</span>
        )}
      </div>

      {item.rating && (
        <div className="store-rating">
          <FaStar size={11} color="#f59e0b" />
          <span>{item.rating?.toFixed(1)}</span>
        </div>
      )}

      <div className="store-card-actions">
        <a
          href={item.product_url}
          target="_blank"
          rel="noopener noreferrer"
          className="view-btn"
          style={{ background: meta.color }}
        >
          View Deal <FaExternalLinkAlt size={10} />
        </a>
        <button className="expand-btn" onClick={() => setExpanded(!expanded)}>
          {expanded ? <FaAngleUp /> : <FaAngleDown />}
        </button>
      </div>

      {expanded && (
        <div className="store-card-expanded">
          <div className="exp-row"><span>Seller</span><span>{item.seller}</span></div>
          <div className="exp-row"><span>Last checked</span><span>{item.last_updated?.replace("T", " ").slice(0, 19)} UTC</span></div>
          {item.savings > 0 && <div className="exp-row savings"><span>You save</span><span>{fmt(item.savings)}</span></div>}
          <div className="exp-row url-row">
            <a href={item.product_url} target="_blank" rel="noopener noreferrer">
              Open product page ↗
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function PriceHistoryChart({ history }) {
  if (!history || history.length === 0) {
    return (
      <div className="no-history">
        <FaHistory size={32} color="#d1d5db" />
        <p>No 3-month price history available in database yet.</p>
        <p className="hint">Price history builds up as products are tracked over time.</p>
      </div>
    );
  }

  // Group by date, pick lowest per date
  const byDate = {};
  history.forEach(h => {
    if (!byDate[h.date] || h.price < byDate[h.date].price) {
      byDate[h.date] = h;
    }
  });
  const chartData = Object.values(byDate).map(h => ({
    date: fmtDate(h.date),
    price: h.price,
    store: h.store,
  }));

  const minPrice = Math.min(...chartData.map(d => d.price));
  const maxPrice = Math.max(...chartData.map(d => d.price));

  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
          <YAxis
            tick={{ fontSize: 11 }}
            stroke="#9ca3af"
            tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`}
            domain={[Math.floor(minPrice * 0.95), Math.ceil(maxPrice * 1.05)]}
          />
          <Tooltip
            formatter={(v) => [fmt(v), "Price"]}
            labelStyle={{ color: "#111" }}
            contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
          />
          <ReferenceLine y={minPrice} stroke="#22c55e" strokeDasharray="4 4" label={{ value: "Lowest", fill: "#22c55e", fontSize: 10 }} />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#6366f1"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#6366f1" }}
            activeDot={{ r: 7, fill: "#4f46e5" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function SummaryStats({ summary }) {
  if (!summary) return null;
  const items = [
    { label: "Lowest Price", value: fmt(summary.lowest), icon: <FaArrowDown />, color: "#22c55e" },
    { label: "Highest Price", value: fmt(summary.highest), icon: <FaChartLine />, color: "#ef4444" },
    { label: "Average Price", value: fmt(summary.average), icon: <FaTag />, color: "#6366f1" },
    {
      label: "Max Savings",
      value: summary.highest && summary.lowest ? fmt(summary.highest - summary.lowest) : "N/A",
      icon: <FaFire />,
      color: "#f59e0b",
    },
  ];
  return (
    <div className="summary-grid">
      {items.map(it => (
        <div key={it.label} className="summary-card">
          <span className="summary-icon" style={{ color: it.color }}>{it.icon}</span>
          <div className="summary-value" style={{ color: it.color }}>{it.value}</div>
          <div className="summary-label">{it.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PriceComparePage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("stores");
  const inputRef = useRef(null);

  const popularSearches = [
    "iPhone 15 Pro", "Samsung Galaxy S24", "MacBook Air M3",
    "Sony WH-1000XM5", "OnePlus 12", "iPad Pro",
  ];

  async function handleSearch(e) {
    e && e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setResult(null);
    setError("");
    setActiveTab("stores");
    try {
      const resp = await fetch(`${BACKEND_URL}/api/compare?q=${encodeURIComponent(q)}&limit=5`);
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.detail || `Server error ${resp.status}`);
      }
      const data = await resp.json();
      setResult(data);
    } catch (err) {
      setError(err.message || "Failed to compare prices. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="compare-page">
      {/* ── Hero search bar ── */}
      <div className="compare-hero">
        <div className="compare-hero-badge">
          <FaBolt size={12} color="#fff" /> LIVE PRICE COMPARISON
        </div>
        <h1 className="compare-hero-title">Find the Best Price<br /><span>Instantly</span></h1>
        <p className="compare-hero-sub">
          We scan <strong>Smartprix, Amazon, Flipkart, Croma</strong> &amp; <strong>Reliance Digital</strong> in real-time.
        </p>

        <form onSubmit={handleSearch} className="compare-search-form">
          <div className="compare-search-box">
            <FaSearch className="compare-search-icon" />
            <input
              ref={inputRef}
              type="text"
              id="compare-search-input"
              placeholder='Try "iPhone 15 Pro" or "Sony WH-1000XM5"…'
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="compare-search-input"
            />
            {query && (
              <button type="button" className="compare-search-clear" onClick={() => { setQuery(""); setResult(null); }}>
                ×
              </button>
            )}
          </div>
          <button type="submit" className="compare-search-btn" disabled={loading || !query.trim()}>
            {loading ? <FaSpinner className="spin" /> : <><FaSearch /> Compare Prices</>}
          </button>
        </form>

        <div className="popular-chips">
          <span className="popular-label">Try:</span>
          {popularSearches.map(s => (
            <button
              key={s}
              className="popular-chip"
              onClick={() => { setQuery(s); }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && <LoadingAnimation />}

      {/* ── Error ── */}
      {error && (
        <div className="compare-error">
          <FaExclamationTriangle color="#ef4444" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Results ── */}
      {result && !loading && (
        <div className="compare-results">
          {/* Meta bar */}
          <div className="compare-meta">
            <span><FaStore size={12} /> {result.total_results} results from {result.stores_checked?.length} stores</span>
            <span>Scraped at {result.scraped_at?.replace("T", " ").slice(0, 19)} UTC</span>
          </div>

          {/* Lowest price banner */}
          <LowestPriceBanner store={result.lowest_price?.store ? {
            store: result.lowest_price.store,
            price: result.lowest_price.price,
            product_title: result.lowest_price.product_title,
            product_url: result.lowest_price.product_url,
            image_url: result.lowest_price.image_url,
            original_price: result.price_summary?.highest,
            discount_percentage: result.price_summary?.highest && result.lowest_price.price
              ? Math.round(((result.price_summary.highest - result.lowest_price.price) / result.price_summary.highest) * 100)
              : null,
            savings: result.price_summary?.highest && result.lowest_price.price
              ? result.price_summary.highest - result.lowest_price.price
              : 0,
          } : null} />

          {/* Price summary stats */}
          <SummaryStats summary={result.price_summary} />

          {/* Tabs */}
          <div className="compare-tabs">
            <button
              className={`compare-tab ${activeTab === "stores" ? "active" : ""}`}
              onClick={() => setActiveTab("stores")}
            >
              <FaStore /> Store Prices ({result.store_prices?.length})
            </button>
            <button
              className={`compare-tab ${activeTab === "history" ? "active" : ""}`}
              onClick={() => setActiveTab("history")}
            >
              <FaChartLine /> Price History (3M)
            </button>
          </div>

          {/* Store prices */}
          {activeTab === "stores" && (
            <div className="store-cards-grid">
              {(result.store_prices || []).map((item, i) => (
                <StoreCard
                  key={`${item.store}-${i}`}
                  item={item}
                  rank={i + 1}
                  isLowest={i === 0}
                />
              ))}
              {result.store_prices?.length === 0 && (
                <div className="no-results">
                  <FaExclamationTriangle color="#f59e0b" size={32} />
                  <p>No results found. Try a different product name.</p>
                </div>
              )}
            </div>
          )}

          {/* Price history chart */}
          {activeTab === "history" && (
            <div className="history-wrap">
              <div className="history-header">
                <h3>3-Month Price History</h3>
                <p>Historical prices tracked from your Supabase database</p>
              </div>
              <PriceHistoryChart history={result.price_history_3m} />
            </div>
          )}

          {/* Errors / warnings */}
          {result.errors?.length > 0 && (
            <div className="compare-warnings">
              <FaExclamationTriangle size={14} color="#f59e0b" />
              <span>Some stores had issues: {result.errors.join(" | ")}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
