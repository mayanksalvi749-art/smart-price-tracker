import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../supabase";
import {
  resolveProductGallery,
  IMAGE_NOT_AVAILABLE,
} from "../utils/productImages";
import { triggerIngestion } from "../services/api";
import { sendTelegramAlert } from "../telegram";
import {
  FaShoppingCart, FaSearch, FaBell, FaCog, FaHeart, FaFire,
  FaHome, FaUser, FaMapMarkerAlt, FaSignOutAlt, FaSyncAlt,
  FaTag, FaPercent, FaRupeeSign, FaMobileAlt, FaLaptop,
  FaTshirt, FaSprayCan, FaBolt, FaCamera, FaMicrophone,
  FaPhone, FaTimes, FaPaperPlane, FaRobot, FaImage,
  FaStop, FaVolumeUp, FaVolumeMute, FaPlus, FaTrash, FaEdit, FaSave, FaCheck,
} from "react-icons/fa";

// ─── Product mapping helpers ─────────────────────────────────────────────────

// Map any DB/legacy category label → UI filter category
const UI_CATEGORIES = ["Mobiles", "Electronics", "Fashion", "Beauty"];
const CATEGORY_ALIASES = {
  Laptops: "Electronics",
  "Men's Fashion": "Fashion",
  "Women's Fashion": "Fashion",
  Shoes: "Fashion",
  Watches: "Electronics",
  "Home Appliances": "Electronics",
  General: "Electronics",
  Tracked: "Electronics",
};

function normalizeCategory(cat) {
  if (!cat) return "Electronics";
  if (UI_CATEGORIES.includes(cat)) return cat;
  return CATEGORY_ALIASES[cat] || cat;
}

function parseNumPrice(val) {
  if (typeof val === "number") return val;
  return parseFloat(String(val ?? "0").replace(/[^\d.]/g, "")) || 0;
}

function formatRupee(num) {
  return `₹${Math.round(num).toLocaleString("en-IN")}`;
}

function mapDbProduct(p) {
  const numPrice = parseNumPrice(p.price);
  const numOrig = p.original_price != null
    ? parseNumPrice(p.original_price)
    : (p.discount > 0 && numPrice > 0
      ? Math.round(numPrice / (1 - Number(p.discount) / 100))
      : (numPrice > 0 ? Math.round(numPrice * 1.2) : 0));
  const disc = p.discount != null
    ? Number(p.discount)
    : (numOrig > numPrice && numOrig > 0 ? Math.round(((numOrig - numPrice) / numOrig) * 100) : 0);
  const category = normalizeCategory(p.category);
  const base = {
    id: `db-${p.id}`,
    name: (p.name && String(p.name).trim()) ? String(p.name).trim() : "Unnamed Product",
    brand: p.brand || "",
    price: numPrice > 0 ? formatRupee(numPrice) : "₹0",
    oldPrice: numOrig > numPrice ? formatRupee(numOrig) : "",
    features: p.description || p.features || "",
    image: p.primary_image || p.image || "",
    primary_image: p.primary_image || p.image || "",
    image_2: p.image_2 || "",
    image_3: p.image_3 || "",
    product_url: p.product_url || "#",
    category,
    platform: p.source || "",
    discount: disc,
    discountPercentage: disc > 0 ? `${disc}% OFF` : "",
    rating: p.rating != null ? Number(p.rating) : 4.0,
    reviewCount: p.review_count ?? p.reviewCount ?? 0,
    deliveryETA: p.delivery_eta || p.deliveryETA || "Get it in 2 days",
    isFromDb: true,
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
    imageField: "image",
    fallbackImg: imgs.fallbackImg,
  };
}


const hotDeals   = [99, 199, 299, 399, 499, 599, 799, 999];
const discounts  = [40, 50, 60, 70];
const categories = [
  { label: "Premium Smartphones", sub: "Starting from", price: "₹34,999", icon: "📱", accent: "#e11d48", filterCat: "Mobiles",     bg: "from-rose-50 to-pink-100" },
  { label: "Mid-Range Smartphones", sub: "Under",       price: "₹14,999", icon: "📲", accent: "#0284c7", filterCat: "Mobiles",     bg: "from-sky-50 to-blue-100" },
  { label: "Budget Laptops",        sub: "Under",       price: "₹34,999", icon: "💻", accent: "#d97706", filterCat: "Electronics", bg: "from-orange-50 to-amber-100" },
  { label: "Fashion & Apparel",     sub: "Starting from", price: "₹999",  icon: "👕", accent: "#7c3aed", filterCat: "Fashion",     bg: "from-violet-50 to-purple-100" },
  { label: "Beauty Products",       sub: "Starting from", price: "₹299",  icon: "✨", accent: "#059669", filterCat: "Beauty",      bg: "from-emerald-50 to-green-100" },
  { label: "Smart Watches",         sub: "Under",       price: "₹4,999",  icon: "⌚", accent: "#0d9488", filterCat: "Electronics", bg: "from-cyan-50 to-teal-100" },
];

// ─── AI Chat helpers ───────────────────────────────────────────────────────
function getAIResponse(message, products) {
  const msg = message.toLowerCase().trim();

  // Price queries
  if (msg.includes("cheapest") || msg.includes("lowest price") || msg.includes("budget")) {
    const sorted = [...products].sort((a, b) =>
      Number(a.price.replace(/[₹,]/g, "")) - Number(b.price.replace(/[₹,]/g, ""))
    );
    const top3 = sorted.slice(0, 3).map(p => `• ${p.name} – ${p.price}`).join("\n");
    return `Here are the cheapest products right now:\n\n${top3}\n\nWould you like more details on any of them? 😊`;
  }
  if (msg.includes("deal") || msg.includes("offer") || msg.includes("discount") || msg.includes("sale")) {
    const deals = products.filter(p => {
      const old = Number(p.oldPrice.replace(/[₹,]/g, ""));
      const cur = Number(p.price.replace(/[₹,]/g, ""));
      return old > cur && ((old - cur) / old) >= 0.3;
    }).slice(0, 3);
    if (deals.length === 0) return "No major deals found right now, but check the Hot Deals section! 🔥";
    return `🔥 Top deals with 30%+ off:\n\n${deals.map(p => {
      const disc = Math.round((1 - Number(p.price.replace(/[₹,]/g, "")) / Number(p.oldPrice.replace(/[₹,]/g, ""))) * 100);
      return `• ${p.name} – ${p.price} (${disc}% off)`;
    }).join("\n")}\n\nWant me to show you more? 🛍️`;
  }
  if (msg.includes("mobile") || msg.includes("phone") || msg.includes("smartphone")) {
    const mobiles = products.filter(p => p.category === "Mobiles").slice(0, 3);
    return `📱 Top Mobiles available:\n\n${mobiles.map(p => `• ${p.name} – ${p.price}`).join("\n")}\n\nWant to filter by budget?`;
  }
  if (msg.includes("laptop") || msg.includes("computer") || msg.includes("macbook")) {
    const laptops = products.filter(p => p.category === "Electronics" && p.name.toLowerCase().includes("laptop") || p.name.toLowerCase().includes("macbook")).slice(0, 3);
    return `💻 Top Laptops:\n\n${laptops.length ? laptops.map(p => `• ${p.name} – ${p.price}`).join("\n") : "No laptops found"}\n\nNeed help comparing specs?`;
  }
  if (msg.includes("fashion") || msg.includes("clothes") || msg.includes("shoes") || msg.includes("hoodie")) {
    const fashion = products.filter(p => p.category === "Fashion").slice(0, 3);
    return `👗 Trending Fashion picks:\n\n${fashion.map(p => `• ${p.name} – ${p.price}`).join("\n")}\n\nAnything specific you're looking for?`;
  }
  if (msg.includes("under") || msg.includes("below") || msg.includes("₹") || /\d{3,}/.test(msg)) {
    const match = msg.match(/\d{3,}/);
    if (match) {
      const budget = parseInt(match[0]);
      const filtered = products.filter(p => Number(p.price.replace(/[₹,]/g, "")) <= budget).slice(0, 4);
      return filtered.length
        ? `💰 Products under ₹${budget.toLocaleString("en-IN")}:\n\n${filtered.map(p => `• ${p.name} – ${p.price}`).join("\n")}\n\nGreat choices! Want to add any to cart?`
        : `😕 No products found under ₹${budget.toLocaleString("en-IN")} right now. Try a higher budget?`;
    }
  }
  if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey")) {
    return "Hello! 👋 I'm your SmartPrice AI Assistant.\n\nI can help you:\n• Find the best deals 🔥\n• Search by budget 💰\n• Compare products 📊\n• Track price drops 📉\n\nWhat are you looking for today?";
  }
  if (msg.includes("help") || msg.includes("what can you do")) {
    return "Here's what I can do for you:\n\n🔍 **Find Products** – tell me what you're looking for\n💰 **Budget Search** – \"show me phones under ₹20000\"\n🔥 **Best Deals** – ask for top discounts\n📊 **Compare** – \"compare iPhone and Samsung\"\n🛒 **Cart Help** – I'll guide you to checkout\n\nJust ask me anything!";
  }
  if (msg.includes("compare")) {
    return "Sure! To compare products, just tell me which two items you'd like to compare. For example:\n\"Compare iPhone 15 and Samsung S24\"\n\nI'll show you specs, prices, and which is the better deal! 📊";
  }
  if (msg.includes("iphone")) {
    const iphone = products.find(p => p.name.toLowerCase().includes("iphone"));
    return iphone
      ? `🍎 iPhone 15 Details:\n\n• Price: ${iphone.price}\n• Was: ${iphone.oldPrice}\n• Features: ${iphone.features}\n\nGreat choice! Want me to add it to your cart?`
      : "iPhone not found in current listings. Try searching directly!";
  }
  if (msg.includes("samsung")) {
    const sam = products.find(p => p.name.toLowerCase().includes("samsung"));
    return sam
      ? `📱 Samsung S24 Details:\n\n• Price: ${sam.price}\n• Was: ${sam.oldPrice}\n• Features: ${sam.features}\n\nExcellent mid-range option! 🌟`
      : "Samsung not found right now. Browse the Mobiles section!";
  }
  if (msg.includes("thank")) {
    return "You're welcome! 😊 Happy shopping! Don't forget to check the Hot Deals section for the latest price drops! 🔥🛍️";
  }
  if (msg.includes("price drop") || msg.includes("alert")) {
    return "📉 Price Drop Alerts are active!\n\nYou'll get notified automatically when:\n• Products you view drop in price\n• New deals hit 30%+ off\n• Flash sales go live\n\nEnable Telegram alerts in Settings for instant notifications! 🔔";
  }

  // Default
  const suggestions = ["best deals", "mobiles under ₹20000", "laptops", "fashion discounts"];
  const rand = suggestions[Math.floor(Math.random() * suggestions.length)];
  return `🤔 I'm not sure about that, but I can help you find great deals!\n\nTry asking me:\n• "${rand}"\n• "show cheapest products"\n• "what's on sale today?"\n\nWhat would you like to explore? 🛍️`;
}

// ─── Main Dashboard ────────────────────────────────────────────────────────
export default function Dashboard({ addToCart, cart }) {
  const navigate  = useNavigate();
  const [search,           setSearch]           = useState("");
  const [activePage,       setActivePage]       = useState("home");
  const [activeCategory,   setActiveCategory]   = useState("All");
  const [products,         setProducts]         = useState([]);
  const [productsLoading,  setProductsLoading]  = useState(true);
  const [ingestStatus,     setIngestStatus]     = useState("idle"); // idle | syncing | error
  const [ingestMessage,    setIngestMessage]    = useState("");
  const [currentUser,      setCurrentUser]      = useState(null);
  const [addressInput,     setAddressInput]     = useState("");
  const [phoneInput,       setPhoneInput]       = useState("");
  const [appHostLink,      setAppHostLink]      = useState("");
  const [showNotifications,setShowNotifications]= useState(false);
  const [priceFilter,      setPriceFilter]      = useState(null);
  const [discountFilter,   setDiscountFilter]   = useState(null);
  const [mobileMenuOpen,   setMobileMenuOpen]   = useState(false);
  const [currentPage,      setCurrentPage]      = useState(1);
  const ITEMS_PER_PAGE = 24;

  // Profile image
  const [profileImage,     setProfileImage]     = useState(null);

  // Camera / Image search
  const [cameraImage,      setCameraImage]      = useState(null);
  const [showCameraSearch, setShowCameraSearch] = useState(false);
  const cameraInputRef = useRef(null);

  // ── Edit Product Modal ────────────────────────────────────────────────────
  const [editingProduct,  setEditingProduct]  = useState(null); // the product being edited
  const [editName,        setEditName]        = useState("");
  const [editImage,       setEditImage]       = useState("");
  const [editSaving,      setEditSaving]      = useState(false);
  const [editSuccess,     setEditSuccess]     = useState(false);
  const [imgPreviewErr,   setImgPreviewErr]   = useState(false);

  // AI Chat
  const [showChat,   setShowChat]   = useState(false);
  const [chatInput,  setChatInput]  = useState("");
  const [chatMessages, setChatMessages] = useState([
    { role: "ai", text: "👋 Hi! I'm your SmartPrice AI Assistant.\n\nI can find deals, compare products, and help you save money. What are you looking for today? 🛍️" }
  ]);
  const [chatLoading,  setChatLoading]  = useState(false);
  const chatEndRef = useRef(null);

  // Voice / STT
  const [isListening,  setIsListening]  = useState(false);
  const [isSpeaking,   setIsSpeaking]   = useState(false);
  const recognitionRef = useRef(null);
  const notifRef       = useRef(null);

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    if (!user) { navigate("/"); return; }
    setCurrentUser(user);
    setAddressInput(user.address || "");
    setPhoneInput(user.phone || "");
    setProfileImage(user.avatar || null);
    setAppHostLink(localStorage.getItem("appHostLink") || window.location.origin);
    const saved = sessionStorage.getItem("activePage");
    if (saved) { setActivePage(saved); sessionStorage.removeItem("activePage"); }
  }, [navigate]);

  useEffect(() => { fetchProducts(); }, []);
  useEffect(() => {
    const iv = setInterval(fetchProducts, 30000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, showChat]);

  useEffect(() => { setCurrentPage(1); }, [search, activeCategory, priceFilter, discountFilter]);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  async function fetchProducts() {
    setProductsLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("last_synced_at", { ascending: false, nullsFirst: false });

      if (error) throw error;

      const rows = data || [];
      setProducts(rows);

      if (rows.length > 0) {
        setIngestStatus("idle");
        checkAutomaticAlerts(rows.map(mapDbProduct));
      } else if (ingestStatus !== "syncing") {
        await startIngestion();
      }
    } catch (err) {
      console.error("Failed to fetch products:", err.message);
      setIngestMessage(err.message);
      setIngestStatus("error");
    } finally {
      setProductsLoading(false);
    }
  }

  async function startIngestion() {
    setIngestStatus("syncing");
    setIngestMessage("Fetching live prices from Amazon, Flipkart, Croma & Reliance Digital…");
    try {
      await triggerIngestion();
      const poll = async (attempt = 0) => {
        const { data } = await supabase
          .from("products")
          .select("id")
          .order("last_synced_at", { ascending: false })
          .limit(1);
        if (data?.length > 0) {
          await fetchProducts();
          setIngestMessage("");
          return;
        }
        if (attempt < 24) {
          setTimeout(() => poll(attempt + 1), 5000);
        } else {
          setIngestStatus("error");
          setIngestMessage("Ingestion is still running. Click Refresh to check again.");
        }
      };
      setTimeout(() => poll(0), 4000);
    } catch (err) {
      setIngestStatus("error");
      setIngestMessage(err.message || "Could not reach ingestion API. Start backend: uvicorn app:app --port 8000");
    }
  }

  async function handleManualRefresh() {
    setIngestStatus("syncing");
    setIngestMessage("Refreshing live product data…");
    try {
      await triggerIngestion();
      setTimeout(fetchProducts, 6000);
    } catch (err) {
      setIngestStatus("error");
      setIngestMessage(err.message);
    }
  }

  // ── Edit product handlers ─────────────────────────────────────────────────
  const handleEditOpen = (product, e) => {
    e.stopPropagation();
    setEditingProduct(product);
    setEditName(product.name || "");
    setEditImage(product.image || "");
    setEditSuccess(false);
    setImgPreviewErr(false);
  };

  const handleSaveEdit = async () => {
    if (!editingProduct || editSaving) return;
    setEditSaving(true);
    const trimName  = editName.trim();
    const trimImage = editImage.trim();

    if (editingProduct.isFromDb) {
      // ── Update Supabase ──
      const numId = String(editingProduct.id).replace("db-", "");
      const { error } = await supabase
        .from("products")
        .update({ name: trimName, image: trimImage })
        .eq("id", numId);
      if (!error) {
        setProducts(prev =>
          prev.map(p => String(p.id) === numId ? { ...p, name: trimName, image: trimImage } : p)
        );
      } else {
        console.error("Supabase update error:", error.message);
      }
    } else {
      setProducts(prev =>
        prev.map(p => String(p.id) === String(editingProduct.id).replace("db-", "")
          ? { ...p, name: trimName, image: trimImage, primary_image: trimImage }
          : p)
      );
    }

    setEditSaving(false);
    setEditSuccess(true);
    setTimeout(() => {
      setEditingProduct(null);
      setEditSuccess(false);
    }, 1200);
  };

  function checkAutomaticAlerts(list) {
    list.forEach(product => {
      const cur = Number(product.price.replace(/[₹,]/g, ""));
      const old = Number(product.oldPrice.replace(/[₹,]/g, ""));
      if (cur > 0 && old > 0 && cur < old) {
        const key = `alert_${product.name.replace(/\s+/g, "_")}_${cur}`;
        if (!localStorage.getItem(key)) {
          const origin = localStorage.getItem("appHostLink") || window.location.origin;
          const link = `${origin}/product?id=${encodeURIComponent(product.id ?? "")}&name=${encodeURIComponent(product.name)}&price=${encodeURIComponent(product.price)}&oldPrice=${encodeURIComponent(product.oldPrice)}&image=${encodeURIComponent(product.image)}&features=${encodeURIComponent(product.features || "")}&category=${encodeURIComponent(product.category || "")}&product_url=${encodeURIComponent(product.product_url || "#")}`;
          sendTelegramAlert(`<b>🚨 PRICE DROP!</b>\n\n<b>${product.name}</b> @ <b>${product.price}</b> (Was <s>${product.oldPrice}</s>)\n\n<a href="${link}">View in App</a>`, product.image);
          localStorage.setItem(key, "true");
        }
      }
    });
  }

  // ── Profile helpers ───────────────────────────────────────────────────────
  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = reader.result;
      setProfileImage(img);
      const updatedUser = { ...currentUser, avatar: img };
      setCurrentUser(updatedUser);
      persistUser(updatedUser);
    };
    reader.readAsDataURL(file);
  };

  const persistUser = (user) => {
    localStorage.setItem("currentUser", JSON.stringify(user));
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    localStorage.setItem("users", JSON.stringify(users.map(u => u.email === user.email ? user : u)));
  };

  const handleSaveProfile = () => {
    if (!currentUser) return;
    const updated = { ...currentUser, address: addressInput, phone: phoneInput };
    setCurrentUser(updated);
    persistUser(updated);
    alert("Profile saved! ✅");
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  // ── Camera / Image search ─────────────────────────────────────────────────
  const handleCameraImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCameraImage(reader.result);
      setShowCameraSearch(true);
      // Simulate image search → show all products with a banner
      setSearch("");
      setPriceFilter(null);
      setDiscountFilter(null);
      setActiveCategory("All");
      setActivePage("products");
    };
    reader.readAsDataURL(file);
  };

  // ── AI Chat ────────────────────────────────────────────────────────────────
  const mergedForAI = products.map(p => mapDbProduct(p));

  const sendChatMessage = useCallback(() => {
    const text = chatInput.trim();
    if (!text) return;
    const userMsg = { role: "user", text };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);
    setTimeout(() => {
      const reply = getAIResponse(text, mergedForAI);
      setChatMessages(prev => [...prev, { role: "ai", text: reply }]);
      setChatLoading(false);
      // TTS
      if ("speechSynthesis" in window) {
        const utter = new SpeechSynthesisUtterance(reply.replace(/[*_•]/g, ""));
        utter.rate = 1; utter.pitch = 1;
        utter.onstart  = () => setIsSpeaking(true);
        utter.onend    = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utter);
      }
    }, 600 + Math.random() * 400);
  }, [chatInput, mergedForAI]);

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  };

  // ── Voice input (STT) ─────────────────────────────────────────────────────
  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Speech recognition not supported in this browser."); return; }
    const rec = new SR();
    rec.lang = "en-IN";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setChatInput(transcript);
      setIsListening(false);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend   = () => setIsListening(false);
    recognitionRef.current = rec;
    rec.start();
    setIsListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  // Voice search from hero
  const startHeroVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Speech recognition not supported."); return; }
    const rec = new SR();
    rec.lang = "en-IN";
    rec.onresult = (e) => {
      const t = e.results[0][0].transcript;
      setSearch(t);
      setActivePage("products");
    };
    rec.onerror = () => {};
    rec.start();
  };

  // ── Product helpers ───────────────────────────────────────────────────────
  const deduplicatedProducts = products.filter(p => p && p.id != null).map(mapDbProduct);

  const getNumericPrice = (s) => parseNumPrice(s);
  const getDiscount = (p) => {
    if (p.discount != null && Number(p.discount) > 0) return Number(p.discount);
    const old = getNumericPrice(p.oldPrice), cur = getNumericPrice(p.price);
    if (!old || !cur || old <= cur) return 0;
    return Math.round(((old - cur) / old) * 100);
  };

  let displayedProducts = deduplicatedProducts;
  if (search) {
    const q = search.toLowerCase();
    displayedProducts = displayedProducts.filter(p =>
      (p.name || "").toLowerCase().includes(q) ||
      (p.brand || "").toLowerCase().includes(q) ||
      (p.category || "").toLowerCase().includes(q)
    );
  }
  if (activeCategory !== "All") {
    displayedProducts = displayedProducts.filter(p => normalizeCategory(p.category) === activeCategory);
  }
  if (priceFilter)     displayedProducts = displayedProducts.filter(p => getNumericPrice(p.price) <= priceFilter);
  if (discountFilter)  displayedProducts = displayedProducts.filter(p => getDiscount(p) >= discountFilter);

  const totalPages = Math.ceil(displayedProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = displayedProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // ── Reusable sub-components ───────────────────────────────────────────────
  const SectionHeader = ({ title, subtitle }) => (
    <div className="text-center mb-8">
      <h2 className="text-3xl font-extrabold text-gray-900">{title}</h2>
      <div className="inline-flex items-center gap-1.5 mt-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-1">
        <span className="text-amber-500 text-xs">✦</span>
        <span className="text-xs font-semibold text-amber-700">{subtitle}</span>
      </div>
    </div>
  );

  const navLinks = [
    { label: "Home",     page: "home",     icon: FaHome  },
    { label: "Deals",    page: "deals",    icon: FaFire  },
    { label: "Wishlist", page: "wishlist", icon: FaHeart },
    { label: "Settings", page: "settings", icon: FaCog   },
    { label: "Profile",  page: "profile",  icon: FaUser  },
  ];

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 font-sans">

      {/* ══════════════════════════════ NAVBAR ══════════════════════════════ */}
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-4">

            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer flex-shrink-0" onClick={() => setActivePage("home")}>
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                <FaTag className="text-white text-sm" />
              </div>
              <span className="text-xl font-extrabold text-gray-900 hidden sm:block">
                Smart<span className="text-blue-600">Price</span>
              </span>
            </div>

            {/* Nav links */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(link => (
                <button key={link.page} onClick={() => setActivePage(link.page)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activePage === link.page ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}>
                  <link.icon className="text-xs" /> {link.label}
                </button>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <button onClick={handleManualRefresh} title="Refresh live prices"
                className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-2 rounded-xl text-sm font-semibold transition cursor-pointer">
                <FaSyncAlt className={ingestStatus === "syncing" ? "animate-spin" : ""} />
                <span className="hidden sm:inline">Sync</span>
              </button>

              {/* Cart */}
              <button onClick={() => navigate("/cart")}
                className="relative flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl text-sm font-semibold transition cursor-pointer">
                <FaShoppingCart />
                <span className="hidden sm:inline">Cart</span>
                {cart.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{cart.length}</span>
                )}
              </button>

              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button onClick={() => setShowNotifications(!showNotifications)}
                  className="relative bg-gray-100 hover:bg-gray-200 text-gray-700 p-2.5 rounded-xl transition cursor-pointer">
                  <FaBell />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">3</span>
                </button>
                {showNotifications && (
                  <div className="absolute right-0 top-12 w-80 bg-white border border-gray-100 rounded-2xl shadow-2xl p-5 z-[9999]">
                    <h3 className="text-base font-bold text-gray-900 mb-4">🔔 Notifications</h3>
                    <div className="space-y-3">
                      {deduplicatedProducts
                        .filter(p => p.oldPrice && p.price !== p.oldPrice)
                        .slice(0, 3)
                        .map((p, i) => (
                          <div key={i} className="flex items-start gap-3 bg-blue-50 p-3 rounded-xl">
                            <span className="text-lg">🔥</span>
                            <p className="text-sm text-gray-700 font-medium line-clamp-2">
                              {p.name} — now {p.price} on {p.platform || "store"}
                            </p>
                          </div>
                        ))}
                      {deduplicatedProducts.length === 0 && (
                        <p className="text-sm text-gray-500">Price alerts appear when live products sync.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile button with avatar */}
              <button onClick={() => setActivePage("profile")}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl text-sm font-bold transition cursor-pointer shadow-md shadow-blue-200 hidden sm:flex">
                {profileImage
                  ? <img src={profileImage} alt="avatar" className="w-6 h-6 rounded-full object-cover border border-white/50" />
                  : <FaUser className="text-xs" />
                }
                <span>{currentUser?.name?.split(" ")[0] || "Account"}</span>
              </button>

              {/* Mobile menu toggle */}
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg bg-gray-100 text-gray-600">
                <div className="w-5 h-0.5 bg-current mb-1" /><div className="w-5 h-0.5 bg-current mb-1" /><div className="w-5 h-0.5 bg-current" />
              </button>
            </div>
          </div>

          {/* Mobile nav */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 border-t border-gray-100 mt-2 pt-3 flex flex-wrap gap-2">
              {navLinks.map(link => (
                <button key={link.page} onClick={() => { setActivePage(link.page); setMobileMenuOpen(false); }}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 cursor-pointer ${
                    activePage === link.page ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
                  }`}>
                  <link.icon className="text-xs" />{link.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* ══════════════════════════════ HOME ════════════════════════════════ */}
      {activePage === "home" && (
        <>
          {/* HERO */}
          <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg,#3b0fa8 0%,#4f46e5 40%,#2563eb 70%,#1d4ed8 100%)", minHeight: "420px" }}>
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute left-[-20px] bottom-0 opacity-20 text-[130px]">🛒</div>
              <div className="absolute right-[-20px] bottom-0 opacity-20 text-[130px]">🛒</div>
              {[{ top:"15%",left:"8%",s:40 },{ top:"60%",left:"12%",s:24 },{ top:"30%",right:"10%",s:32 },{ top:"70%",right:"15%",s:20 },{ top:"20%",left:"45%",s:16 }].map((b,i) => (
                <div key={i} className="absolute rounded-full bg-white/20" style={{ top:b.top,left:b.left,right:b.right,width:b.s,height:b.s }} />
              ))}
            </div>

            <div className="relative max-w-3xl mx-auto px-6 py-16 text-center text-white">
              <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-1.5 mb-6 text-sm font-semibold">
                <span className="text-yellow-300">✦</span> Price History &amp; Tracker
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-4">
                Find <span className="text-green-400">Real Deals</span><br />Skip the Fake Ones
              </h1>
              <p className="text-blue-100 text-lg mb-10 max-w-xl mx-auto">
                Track genuine price drops, compare across stores, and shop smarter every day
              </p>

              {/* Search bar with camera + voice */}
              <div className="flex items-center gap-2 bg-white rounded-2xl shadow-2xl p-2 max-w-2xl mx-auto">
                <FaSearch className="text-gray-400 ml-2 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search products, brands, categories..."
                  className="flex-1 outline-none text-gray-800 text-sm placeholder-gray-400 bg-transparent min-w-0"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); if (e.target.value) setActivePage("products"); }}
                  onKeyDown={(e) => { if (e.key === "Enter" && search) setActivePage("products"); }}
                />

                {/* Camera / Image search */}
                <label className="flex-shrink-0 cursor-pointer p-2 hover:bg-gray-100 rounded-xl transition group" title="Search by image">
                  <FaCamera className="text-gray-400 group-hover:text-blue-500 transition text-sm" />
                  <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={handleCameraImage} />
                </label>

                {/* Voice search */}
                <button onClick={startHeroVoice} title="Voice search"
                  className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-xl transition group cursor-pointer">
                  <FaMicrophone className="text-gray-400 group-hover:text-blue-500 transition text-sm" />
                </button>

                <button
                  onClick={() => { if (search) setActivePage("products"); }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition cursor-pointer flex-shrink-0">
                  Search
                </button>
              </div>

              {/* Camera image preview */}
              {cameraImage && showCameraSearch && (
                <div className="mt-4 inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/30">
                  <img src={cameraImage} alt="search" className="w-10 h-10 rounded-xl object-cover" />
                  <span className="text-sm text-white font-medium">Searching by image…</span>
                  <button onClick={() => { setCameraImage(null); setShowCameraSearch(false); }} className="text-white/70 hover:text-white cursor-pointer">
                    <FaTimes className="text-xs" />
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Marquee strip */}
          <div className="bg-gray-900 text-white py-3">
            <div className="flex gap-10 items-center justify-center flex-wrap px-4">
              <span className="text-sm font-semibold flex items-center gap-2"><span className="text-blue-400">🎯</span> Magic Trick for Online Shopping</span>
              <span className="text-sm text-gray-300">Track prices &amp; never miss a deal!</span>
              <span className="text-sm font-semibold text-yellow-400 flex items-center gap-2">⚡ Live Price Tracking Active</span>
            </div>
          </div>

          {/* HOT DEALS */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
            <SectionHeader title="Hot Deals" subtitle="Powered by Smart Deal Scanner" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {hotDeals.map(price => (
                <button key={price} onClick={() => { setPriceFilter(price); setDiscountFilter(null); setActivePage("products"); }}
                  className={`group relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer border-2 ${priceFilter === price ? "border-blue-500 shadow-lg" : "border-transparent"}`}
                  style={{ background: "linear-gradient(135deg,#eef2ff 0%,#e0e7ff 100%)" }}>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: "linear-gradient(135deg,#dde4ff 0%,#c7d2fe 100%)" }} />
                  <div className="relative z-10">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-blue-700 mb-1">Deals Under</p>
                    <p className="text-3xl font-extrabold text-indigo-700">₹{price}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* BEST DISCOUNTS */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-14">
            <SectionHeader title="Best Discounts" subtitle="Powered by Smart Deal Scanner" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {discounts.map(pct => (
                <button key={pct} onClick={() => { setDiscountFilter(pct); setPriceFilter(null); setActivePage("products"); }}
                  className={`group relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer border-2 ${discountFilter === pct ? "border-rose-400 shadow-lg" : "border-transparent"}`}
                  style={{ background: "linear-gradient(135deg,#fff1f2 0%,#ffe4e6 100%)" }}>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: "linear-gradient(135deg,#ffd7db 0%,#ffc4c8 100%)" }} />
                  <div className="relative z-10">
                    <p className="text-sm text-rose-600 font-medium mb-1">Min.</p>
                    <p className="text-4xl font-extrabold text-rose-700">{pct}%</p>
                    <p className="text-sm text-rose-600 font-medium mt-0.5">off</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* CATEGORIES */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
            <SectionHeader title="Shop by Categories" subtitle="Powered by Smart Deal Scanner" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(cat => (
                <button key={cat.label} onClick={() => { setActiveCategory(cat.filterCat); setPriceFilter(null); setDiscountFilter(null); setActivePage("products"); }}
                  className="group relative overflow-hidden rounded-2xl p-5 flex items-center justify-between transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer border-2 border-transparent text-left"
                  style={{ background: `linear-gradient(135deg, var(--tw-gradient-stops))` }}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${cat.bg} rounded-2xl`} />
                  <div className="relative z-10">
                    <p className="text-xs font-semibold text-gray-500 mb-1">{cat.sub}</p>
                    <p className="text-2xl font-extrabold" style={{ color: cat.accent }}>{cat.price}</p>
                    <p className="text-sm font-bold text-gray-700 mt-1">{cat.label}</p>
                  </div>
                  <div className="h-20 w-20 flex items-center justify-center text-4xl rounded-xl bg-white shadow-md flex-shrink-0 group-hover:scale-110 transition-transform duration-300 relative z-10">
                    {cat.icon}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Live ingest status */}
          {(ingestStatus === "syncing" || ingestMessage) && (
            <div className={`max-w-7xl mx-auto px-4 sm:px-6 mb-6 p-4 rounded-2xl border text-sm font-medium ${
              ingestStatus === "error" ? "bg-red-50 border-red-200 text-red-700" : "bg-blue-50 border-blue-200 text-blue-800"
            }`}>
              {ingestStatus === "syncing" && <FaSyncAlt className="inline animate-spin mr-2" />}
              {ingestMessage || "Syncing live products from Amazon, Flipkart, Croma & Reliance Digital…"}
            </div>
          )}

          {/* TRENDING PRODUCTS */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-900">Trending Products</h2>
                <p className="text-gray-500 text-sm mt-1">
                  {deduplicatedProducts.length} live products · Amazon · Flipkart · Croma · Reliance Digital
                </p>
              </div>
              <button onClick={() => { setActivePage("products"); setActiveCategory("All"); }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition cursor-pointer shadow-md shadow-blue-100">
                View All →
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {productsLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-200 h-72 animate-pulse" />
                ))
              ) : (
                deduplicatedProducts.slice(0, 8).map(product => (
                  <ProductCard key={product.id} product={product} navigate={navigate} addToCart={addToCart} getDiscount={getDiscount} onEdit={handleEditOpen} />
                ))
              )}
            </div>
          </section>
        </>
      )}

      {/* ══════════════════════════ PRODUCTS PAGE ═══════════════════════════ */}
      {activePage === "products" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          {cameraImage && (
            <div className="mb-6 flex items-center gap-4 bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <img src={cameraImage} alt="search" className="w-16 h-16 rounded-xl object-cover shadow" />
              <div className="flex-1">
                <p className="font-bold text-blue-700">📸 Image Search Active</p>
                <p className="text-sm text-blue-500">Showing all products — image AI matching coming soon!</p>
              </div>
              <button onClick={() => { setCameraImage(null); setShowCameraSearch(false); }} className="text-blue-400 hover:text-blue-700 cursor-pointer"><FaTimes /></button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="flex items-center bg-white border border-gray-200 rounded-xl px-4 py-2.5 gap-2 flex-1 min-w-[200px] shadow-sm">
              <FaSearch className="text-gray-400 flex-shrink-0" />
              <input type="text" placeholder="Search products..." className="outline-none text-sm text-gray-700 w-full bg-transparent"
                value={search} onChange={(e) => setSearch(e.target.value)} />
              {/* Camera inline */}
              <label className="cursor-pointer p-1 hover:bg-gray-100 rounded-lg transition" title="Image search">
                <FaCamera className="text-gray-400 hover:text-blue-500 transition text-xs" />
                <input type="file" accept="image/*" className="hidden" onChange={handleCameraImage} />
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              {["All","Mobiles","Electronics","Fashion","Beauty"].map(cat => (
                <button key={cat} onClick={() => { setActiveCategory(cat); setPriceFilter(null); setDiscountFilter(null); }}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
                    activeCategory === cat && !priceFilter && !discountFilter ? "bg-blue-600 text-white shadow-md" : "bg-white border border-gray-200 text-gray-600 hover:bg-blue-50"
                  }`}>{cat}</button>
              ))}
              {(priceFilter || discountFilter) && (
                <button onClick={() => { setPriceFilter(null); setDiscountFilter(null); setActiveCategory("All"); }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 cursor-pointer">
                  ✕ Clear
                </button>
              )}
            </div>
          </div>

          <div className="mb-5">
            <h2 className="text-2xl font-extrabold text-gray-900">
              {priceFilter ? `Deals Under ₹${priceFilter}` : discountFilter ? `Min ${discountFilter}% Off` : activeCategory === "All" ? "All Products" : activeCategory}
            </h2>
            <p className="text-gray-400 text-sm mt-1">{displayedProducts.length} products found</p>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 h-72 animate-pulse" />
              ))}
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-gray-700">No products found</h3>
              <p className="text-gray-400 mt-2 text-sm">Try a different search term or category</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {paginatedProducts.map(product => (
                  <ProductCard key={product.id} product={product} navigate={navigate} addToCart={addToCart} getDiscount={getDiscount} onEdit={handleEditOpen} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10 pb-4 flex-wrap">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                    className="px-4 py-2 rounded-xl text-sm font-bold bg-white border border-gray-200 text-gray-600 hover:bg-blue-50 disabled:opacity-40 transition cursor-pointer shadow-sm">
                    ← Prev
                  </button>
                  {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                    let pg;
                    if (totalPages <= 7) pg = i + 1;
                    else if (currentPage <= 4) pg = i + 1;
                    else if (currentPage >= totalPages - 3) pg = totalPages - 6 + i;
                    else pg = currentPage - 3 + i;
                    return (
                      <button key={pg} onClick={() => setCurrentPage(pg)}
                        className={`w-10 h-10 rounded-xl text-sm font-bold transition cursor-pointer shadow-sm ${
                          currentPage === pg ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-700 hover:bg-blue-50"
                        }`}>
                        {pg}
                      </button>
                    );
                  })}
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-xl text-sm font-bold bg-white border border-gray-200 text-gray-600 hover:bg-blue-50 disabled:opacity-40 transition cursor-pointer shadow-sm">
                    Next →
                  </button>
                  <span className="text-xs text-gray-400 w-full text-center mt-1">
                    Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, displayedProducts.length)}–{Math.min(currentPage * ITEMS_PER_PAGE, displayedProducts.length)} of {displayedProducts.length} products
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════ DEALS PAGE ══════════════════════════════ */}
      {activePage === "deals" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">🔥 Trending Deals</h2>
          <p className="text-gray-500 text-sm mb-8">Best price drops right now</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {deduplicatedProducts.filter(p => getDiscount(p) > 0).sort((a,b) => getDiscount(b)-getDiscount(a)).map(product => (
              <ProductCard key={product.id} product={product} navigate={navigate} addToCart={addToCart} getDiscount={getDiscount} onEdit={handleEditOpen} />
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════ WISHLIST ════════════════════════════════ */}
      {activePage === "wishlist" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">❤️ Wishlist</h2>
          <p className="text-gray-500 text-sm mb-8">Your saved products</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {deduplicatedProducts.slice(2, 10).map(product => (
              <ProductCard key={product.id} product={product} navigate={navigate} addToCart={addToCart} getDiscount={getDiscount} onEdit={handleEditOpen} />
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════ SETTINGS ════════════════════════════════ */}
      {activePage === "settings" && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-8">⚙️ Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { title:"🔔 Notifications", desc:"View all notifications instantly", action:"Open Notifications", fn:()=>setShowNotifications(true), color:"bg-emerald-600 hover:bg-emerald-700" },
              { title:"📱 Telegram Alerts", desc:"Send instant alert to your Telegram", action:"Send Test Alert", fn:()=>sendTelegramAlert("🚀 Smart Tracker Test Alert"), color:"bg-purple-600 hover:bg-purple-700" },
              { title:"👤 Profile", desc:"Manage your account & address", action:"Open Profile", fn:()=>setActivePage("profile"), color:"bg-orange-500 hover:bg-orange-600" },
              { title:"🤖 AI Assistant", desc:"Chat with your smart shopping assistant", action:"Open AI Chat", fn:()=>setShowChat(true), color:"bg-blue-600 hover:bg-blue-700" },
            ].map((s,i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900">{s.title}</h3>
                <p className="text-gray-400 text-sm mt-1.5 mb-5">{s.desc}</p>
                <button onClick={s.fn} className={`${s.color} text-white font-bold px-5 py-2.5 rounded-xl text-sm transition cursor-pointer`}>{s.action}</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════ PROFILE ═════════════════════════════════ */}
      {activePage === "profile" && currentUser && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900">Your Profile 👤</h2>
              <p className="text-gray-400 text-sm mt-1">Manage your account, addresses &amp; orders</p>
            </div>
            <button onClick={() => setActivePage("home")} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 py-2.5 rounded-xl text-sm transition cursor-pointer">
              ← Back to Home
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Account card */}
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                <h3 className="text-base font-bold text-orange-500 flex items-center gap-2 pb-3 border-b border-gray-100">
                  <FaUser /> Account Details
                </h3>

                {/* Profile image */}
                <div className="flex flex-col items-center gap-3">
                  <label htmlFor="profile-img-upload" className="relative cursor-pointer group">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                      {profileImage
                        ? <img src={profileImage} alt="profile" className="w-full h-full object-cover" />
                        : <FaUser className="text-4xl text-blue-400" />
                      }
                    </div>
                    <div className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white shadow group-hover:scale-110 transition cursor-pointer">
                      <FaCamera className="text-white text-[10px]" />
                    </div>
                    <input id="profile-img-upload" type="file" accept="image/*" className="hidden" onChange={handleProfileImageChange} />
                  </label>
                  <div className="text-center">
                    <p className="font-extrabold text-gray-900 text-lg">{currentUser.name}</p>
                    <p className="text-xs text-gray-400">{currentUser.email}</p>
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Phone Number</label>
                  <div className="relative">
                    <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                    <input type="tel" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} placeholder="+91 98765 43210"
                      className="w-full bg-gray-50 border border-gray-200 text-gray-800 pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition" />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Shipping Address</label>
                  <textarea value={addressInput} onChange={(e) => setAddressInput(e.target.value)} placeholder="Enter your shipping address..."
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" rows="3" />
                </div>

                {/* Save */}
                <button onClick={handleSaveProfile}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl text-sm transition cursor-pointer">
                  💾 Save Profile
                </button>

                {/* Logout */}
                <button onClick={handleLogout}
                  className="w-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm transition cursor-pointer shadow-md shadow-red-100">
                  <FaSignOutAlt /> Sign Out
                </button>
              </div>
            </div>

            {/* Orders */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 min-h-[400px]">
                <h3 className="text-base font-bold text-indigo-600 flex items-center gap-2 pb-3 border-b border-gray-100 mb-5">
                  <FaMapMarkerAlt /> Booked Orders History
                </h3>
                {(!currentUser.orders || currentUser.orders.length === 0) ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <div className="text-5xl mb-4">📦</div>
                    <h4 className="text-base font-bold text-gray-700">No Orders Yet</h4>
                    <p className="text-sm text-gray-400 mt-1 max-w-xs">Go to cart and checkout to book products!</p>
                    <button onClick={() => setActivePage("home")} className="mt-5 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer">
                      Explore Products
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                    {currentUser.orders.map((order) => (
                      <div key={order.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="text-indigo-600 font-mono font-bold text-sm">{order.id}</span>
                            <p className="text-xs text-gray-400">Booked: {order.date}</p>
                          </div>
                          <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold">{order.status}</span>
                        </div>
                        <div className="space-y-2">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                              <img src={item.image} alt={item.name} className="h-10 w-10 object-cover rounded-lg" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-800 truncate">{item.name}</p>
                                <p className="text-xs text-gray-400">Qty: {item.quantity} × {item.price}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between items-center">
                          <span className="text-xs text-gray-400">Total</span>
                          <span className="text-emerald-600 font-extrabold">₹{order.total.toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════ EDIT PRODUCT MODAL ══════════════════════ */}
      {editingProduct && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
          onClick={() => setEditingProduct(null)}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100"
              style={{ background: "linear-gradient(135deg,#4f46e5,#2563eb)" }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                  <FaEdit className="text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Edit Product</p>
                  <p className="text-blue-200 text-xs truncate max-w-[200px]">{editingProduct.name}</p>
                </div>
              </div>
              <button onClick={() => setEditingProduct(null)}
                className="text-white/70 hover:text-white transition cursor-pointer">
                <FaTimes />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-5 space-y-4">
              {/* Source badge */}
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
                style={editingProduct.isFromDb
                  ? { background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }
                  : { background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }}
              >
                {editingProduct.isFromDb ? "🔗 Live tracked product" : "✏️ Edit product"}
              </div>

              {/* Product Name */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Product Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Enter product name..."
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Image URL
                </label>
                <input
                  type="text"
                  value={editImage}
                  onChange={e => { setEditImage(e.target.value); setImgPreviewErr(false); }}
                  placeholder="https://example.com/image.jpg"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                />
              </div>

              {/* Image Preview */}
              {editImage && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Preview</p>
                  <div className="relative bg-gray-50 rounded-xl border border-gray-200 overflow-hidden flex items-center justify-center" style={{ height: "140px" }}>
                    {!imgPreviewErr ? (
                      <img
                        src={editImage}
                        alt="preview"
                        onError={() => setImgPreviewErr(true)}
                        className="max-h-full max-w-full object-contain p-2"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <FaImage className="text-3xl" />
                        <p className="text-xs">Invalid image URL</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-1">
                <button onClick={() => setEditingProduct(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-sm transition cursor-pointer">
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={editSaving || !editName.trim()}
                  className="flex-1 font-bold py-2.5 rounded-xl text-sm transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  style={editSuccess
                    ? { background: "#16a34a", color: "#fff" }
                    : { background: "linear-gradient(135deg,#4f46e5,#2563eb)", color: "#fff" }}
                >
                  {editSuccess ? (
                    <><FaCheck /> Saved!</>
                  ) : editSaving ? (
                    <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving…</>
                  ) : (
                    <><FaSave /> Save Changes</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════ FOOTER ══════════════════════════════════ */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-6 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <FaTag className="text-white text-xs" />
            </div>
            <span className="text-white font-extrabold text-lg">Smart<span className="text-blue-400">Price</span></span>
          </div>
          <p className="text-sm text-center">Track prices. Find deals. Shop smart. © {new Date().getFullYear()}</p>
          <div className="flex items-center gap-4 text-sm">
            <span className="cursor-pointer hover:text-white transition">Privacy</span>
            <span className="cursor-pointer hover:text-white transition">Terms</span>
            <span className="cursor-pointer hover:text-white transition">Contact</span>
          </div>
        </div>
      </footer>

      {/* ══════════════════════════ AI CHAT BUBBLE ══════════════════════════ */}
      {/* Floating button */}
      <button
        onClick={() => setShowChat(!showChat)}
        className="fixed bottom-6 right-6 z-[9998] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95"
        style={{ background: "linear-gradient(135deg,#4f46e5,#2563eb)" }}
        title="AI Shopping Assistant"
      >
        {showChat
          ? <FaTimes className="text-white text-xl" />
          : <FaRobot className="text-white text-xl" />
        }
        {!showChat && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      {/* Chat window */}
      {showChat && (
        <div className="fixed bottom-24 right-6 z-[9997] w-[360px] max-h-[550px] flex flex-col bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden"
          style={{ boxShadow: "0 25px 60px rgba(0,0,0,0.15)" }}>

          {/* Chat header */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-100" style={{ background: "linear-gradient(135deg,#4f46e5,#2563eb)" }}>
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <FaRobot className="text-white text-lg" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm">SmartPrice AI</p>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <p className="text-blue-200 text-xs">Always online · Powered by AI</p>
              </div>
            </div>
            {isSpeaking && (
              <button onClick={stopSpeaking} className="text-white/70 hover:text-white transition cursor-pointer" title="Stop speaking">
                <FaVolumeMute className="text-sm" />
              </button>
            )}
            <button onClick={() => setShowChat(false)} className="text-white/70 hover:text-white transition cursor-pointer">
              <FaTimes />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50" style={{ maxHeight: "360px" }}>
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                {msg.role === "ai" && (
                  <div className="w-7 h-7 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                    <FaRobot className="text-white text-[10px]" />
                  </div>
                )}
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-tr-sm"
                    : "bg-white text-gray-700 rounded-tl-sm shadow-sm border border-gray-100"
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FaRobot className="text-white text-[10px]" />
                </div>
                <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100 flex gap-1.5 items-center">
                  {[0,1,2].map(d => (
                    <div key={d} className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${d*0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick replies */}
          <div className="px-4 pt-3 pb-2 flex gap-2 overflow-x-auto bg-white border-t border-gray-50">
            {["Best deals 🔥","Phones under ₹20K","Top laptops","Fashion sale"].map(q => (
              <button key={q} onClick={() => { setChatInput(q); setTimeout(() => { setChatInput(""); sendChatMessage(); }, 0);
                setChatMessages(prev => {
                  const msgs = [...prev, { role: "user", text: q }];
                  setTimeout(() => {
                    const reply = getAIResponse(q, mergedForAI);
                    setChatMessages(p => [...p, { role: "ai", text: reply }]);
                    if ("speechSynthesis" in window) {
                      const u = new SpeechSynthesisUtterance(reply.replace(/[*_•]/g,""));
                      u.onstart = () => setIsSpeaking(true);
                      u.onend   = () => setIsSpeaking(false);
                      window.speechSynthesis.speak(u);
                    }
                  }, 700);
                  return msgs;
                });
              }}
              className="flex-shrink-0 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-3 py-1.5 rounded-full cursor-pointer transition border border-blue-100 whitespace-nowrap">
              {q}
            </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-100">
            <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-4 py-2 border border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition">
              <input
                type="text"
                placeholder="Ask me anything…"
                className="flex-1 text-sm text-gray-700 bg-transparent outline-none placeholder-gray-400"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") sendChatMessage(); }}
              />

              {/* Voice input */}
              <button
                onClick={isListening ? stopListening : startListening}
                title={isListening ? "Stop listening" : "Voice input"}
                className={`p-1.5 rounded-xl transition cursor-pointer flex-shrink-0 ${
                  isListening ? "bg-red-100 text-red-500 animate-pulse" : "text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
                }`}>
                {isListening ? <FaStop className="text-xs" /> : <FaMicrophone className="text-xs" />}
              </button>

              {/* Send */}
              <button onClick={sendChatMessage} disabled={!chatInput.trim()}
                className="p-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition cursor-pointer flex-shrink-0">
                <FaPaperPlane className="text-xs" />
              </button>
            </div>
            {isListening && (
              <div className="mt-2 flex items-center gap-2 text-xs text-red-500 font-medium">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Listening… speak now
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Reusable Product Card ─────────────────────────────────────────────────
function ProductCard({ product, navigate, addToCart, getDiscount, onEdit }) {
  const discount = product.discount != null ? Number(product.discount) : getDiscount(product);
  const rating = product.rating != null ? Number(product.rating) : 4.0;
  const ratingStars = Math.round(Math.min(5, Math.max(0, rating)));
  const reviewCount = product.reviewCount ?? 0;

  const imageUrl = product.image || product.primary_image || IMAGE_NOT_AVAILABLE;
  const [imgSrc, setImgSrc] = useState(imageUrl);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgSrc(product.image || product.primary_image || IMAGE_NOT_AVAILABLE);
    setImgFailed(false);
  }, [product.id, product.image, product.primary_image, product.name]);

  const goToDetails = (e) => {
    if (e?.target?.closest?.("button")) return;
    const id = encodeURIComponent(product.id ?? "");
    navigate(`/product?id=${id}`, { state: product });
  };

  const handleImgErr = () => {
    if (!imgFailed) {
      setImgFailed(true);
      setImgSrc(IMAGE_NOT_AVAILABLE);
    }
  };

  return (
    <div
      onClick={goToDetails}
      className="group bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden cursor-pointer hover:shadow-xl hover:border-blue-200 hover:-translate-y-0.5 transition-all duration-300 flex flex-col"
    >
      <div className="relative bg-white flex items-center justify-center overflow-hidden flex-shrink-0 border-b border-gray-100" style={{ height: "180px" }}>
        <img
          src={imgSrc}
          alt={product.name}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={handleImgErr}
          className="max-h-[88%] max-w-[88%] object-contain p-2 group-hover:scale-105 transition-transform duration-500"
        />
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-rose-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-lg shadow">
            -{discount}% OFF
          </span>
        )}
        {product.category && (
          <span className="absolute bottom-2 left-2 bg-gray-900/75 text-white text-[9px] font-semibold px-2 py-0.5 rounded-md">
            {product.category}
          </span>
        )}
        {product.platform && (
          <span className="absolute top-2 right-10 bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow">
            {product.platform}
          </span>
        )}
        <button
          onClick={(e) => e.stopPropagation()}
          className="absolute top-2 right-2 bg-white/90 text-gray-300 p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:text-rose-500 transition shadow"
        >
          <FaHeart className="text-xs" />
        </button>
        {onEdit && (
          <button
            onClick={(e) => onEdit(product, e)}
            title="Edit name & image"
            className="absolute bottom-2 right-2 bg-indigo-600 hover:bg-indigo-700 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg"
          >
            <FaEdit className="text-xs" />
          </button>
        )}
      </div>

      <div className="p-3 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-1.5 gap-1">
          {product.brand && (
            <span className="text-[10px] font-semibold text-blue-600 truncate">{product.brand}</span>
          )}
          <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full ml-auto flex-shrink-0">
            {"★".repeat(ratingStars)}{"☆".repeat(5 - ratingStars)} {rating.toFixed(1)}
            {reviewCount > 0 && <span className="text-amber-600/70 font-normal">({reviewCount.toLocaleString("en-IN")})</span>}
          </span>
        </div>

        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug flex-1 min-h-[2.5rem]">
          {product.name || "Unnamed Product"}
        </h3>

        <div className="mt-2 flex items-baseline gap-2 flex-wrap">
          <span className="text-base font-extrabold text-gray-900">{product.price}</span>
          {product.oldPrice && product.oldPrice !== product.price && (
            <span className="text-xs text-gray-400 line-through">{product.oldPrice}</span>
          )}
        </div>

        {product.deliveryETA && (
          <p className="text-[10px] text-emerald-600 font-medium mt-1">{product.deliveryETA}</p>
        )}

        <div className="flex gap-1.5 mt-3">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/product?id=${encodeURIComponent(product.id ?? "")}`, { state: product }); }}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-xl transition cursor-pointer"
          >
            View Details
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); addToCart(product); }}
            className="flex-1 bg-amber-400 hover:bg-amber-500 text-gray-900 text-xs font-bold py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
          >
            <FaShoppingCart className="text-[9px]" /> Cart
          </button>
        </div>
      </div>
    </div>
  );
}