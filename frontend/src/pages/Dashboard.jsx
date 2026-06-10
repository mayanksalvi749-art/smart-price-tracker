import { useNavigate } from "react-router-dom";

import logo from "../assets/logo.png";
import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import {
  sendTelegramAlert,
} from "../telegram";
import {
  FaShoppingCart,
  FaSearch,
  FaBell,
  FaCog,
  FaHeart,
  FaFire,
  FaHome,
  FaPlus,
  FaTrash,
  FaUser,
  FaKey,
  FaMapMarkerAlt,
  FaSignOutAlt,
  FaCopy,
  FaSyncAlt,
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

const allProducts = [

  {
    id: 1,
    category: "Mobiles",
    name: "iPhone 15",
    oldPrice: "₹85,000",
    price: "₹73,500",
    features: "128GB | A16 Bionic",
    image:
      "https://images.unsplash.com/photo-1695048133142-1a20484d2569",
  },

  {
    id: 2,
    category: "Electronics",
    name: "Macbook Air",
    oldPrice: "₹1,10,000",
    price: "₹89,000",
    features: "M2 Chip | 16GB RAM",
    image:
      "https://images.unsplash.com/photo-1517336714739-489689fd1ca8",
  },

  {
    id: 3,
    category: "Fashion",
    name: "Nike Shoes",
    oldPrice: "₹5,999",
    price: "₹2,999",
    features: "Running Shoes",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
  },

  {
    id: 4,
    category: "Electronics",
    name: "Gaming Laptop",
    oldPrice: "₹1,20,000",
    price: "₹95,000",
    features: "RTX 4060 | i7",
    image:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853",
  },

  {
    id: 5,
    category: "Mobiles",
    name: "Samsung S24",
    oldPrice: "₹72,000",
    price: "₹66,000",
    features: "256GB | AMOLED",
    image:
      "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf",
  },

  {
    id: 6,
    category: "Beauty",
    name: "Perfume",
    oldPrice: "₹2,999",
    price: "₹999",
    features: "Long Lasting",
    image:
      "https://images.unsplash.com/photo-1541643600914-78b084683601",
  },

  {
    id: 7,
    category: "Fashion",
    name: "Hoodie",
    oldPrice: "₹2,999",
    price: "₹1,199",
    features: "Winter Wear",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
  },

  {
    id: 8,
    category: "Electronics",
    name: "Smart Watch",
    oldPrice: "₹6,999",
    price: "₹3,499",
    features: "AMOLED Display",
    image:
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12",
  },
  {
    id: 9,
    category: "Electronics",
    name: "Boat Headphones",
    oldPrice: "₹4,999",
    price: "₹1,999",
    features: "Noise Cancellation",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
  },

  {
    id: 10,
    category: "Mobiles",
    name: "Redmi Note 13",
    oldPrice: "₹22,000",
    price: "₹18,999",
    features: "5000mAh | AMOLED",
    image:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9",
  },

  {
    id: 11,
    category: "Electronics",
    name: "Sony Camera",
    oldPrice: "₹75,000",
    price: "₹62,999",
    features: "4K Video | 24MP",
    image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32",
  },

  {
    id: 12,
    category: "Mobiles",
    name: "OnePlus 12",
    oldPrice: "₹69,999",
    price: "₹58,999",
    features: "16GB RAM | Snapdragon",
    image:
      "https://images.unsplash.com/photo-1598327105666-5b89351aff97",
  },

  {
    id: 13,
    category: "Fashion",
    name: "Leather Jacket",
    oldPrice: "₹7,999",
    price: "₹4,499",
    features: "Premium Leather",
    image:
      "https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504",
  },

  {
    id: 14,
    category: "Electronics",
    name: "Dell Monitor",
    oldPrice: "₹25,000",
    price: "₹18,999",
    features: "144Hz | Full HD",
    image:
      "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf",
  },

  {
    id: 15,
    category: "Beauty",
    name: "Skin Care Kit",
    oldPrice: "₹4,999",
    price: "₹2,499",
    features: "Organic Products",
    image:
      "https://images.unsplash.com/photo-1556228578-8c89e6adf883",
  },

  {
    id: 16,
    category: "Electronics",
    name: "Mechanical Keyboard",
    oldPrice: "₹8,999",
    price: "₹5,499",
    features: "RGB Lights | Gaming",
    image:
      "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae",
  },

  {
    id: 17,
    category: "Mobiles",
    name: "Google Pixel 8",
    oldPrice: "₹82,000",
    price: "₹71,999",
    features: "Best AI Camera",
    image:
      "https://images.unsplash.com/photo-1592750475338-74b7b21085ab",
  },

  {
    id: 18,
    category: "Fashion",
    name: "Sneakers",
    oldPrice: "₹6,999",
    price: "₹3,299",
    features: "Comfort Fit",
    image:
      "https://images.unsplash.com/photo-1549298916-b41d501d3772",
  },

  {
    id: 19,
    category: "Electronics",
    name: "iPad Air",
    oldPrice: "₹68,000",
    price: "₹57,999",
    features: "M1 Chip | Retina Display",
    image:
      "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0",
  },

  {
    id: 20,
    category: "Beauty",
    name: "Hair Dryer",
    oldPrice: "₹3,999",
    price: "₹1,999",
    features: "Fast Dry Technology",
    image:
      "https://images.unsplash.com/photo-1522338140262-f46f5913618a",
  },

];


const data = [
  { day: "Mon", price: 72000 },
  { day: "Tue", price: 71000 },
  { day: "Wed", price: 69000 },
  { day: "Thu", price: 67000 },
  { day: "Fri", price: 73500 },
  { day: "Sat", price: 70000 },
  { day: "Sun", price: 68000 },
];

export default function Dashboard({
  addToCart,
  cart,
}) {

  const navigate = useNavigate();

  const [search, setSearch] =
    useState("");

  const [darkMode, setDarkMode] = useState(false);

  const [activePage, setActivePage] = 
    useState("dashboard");

  const [products, setProducts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [addressInput, setAddressInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [appHostLink, setAppHostLink] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    if (!user) {
      navigate("/");
    } else {
      setCurrentUser(user);
      setAddressInput(user.address || "");
    }

    setAppHostLink(localStorage.getItem("appHostLink") || window.location.origin);

    // Sync activePage if saved in sessionStorage
    const savedActiveTab = sessionStorage.getItem("activePage");
    if (savedActiveTab) {
      setActivePage(savedActiveTab);
      sessionStorage.removeItem("activePage");
    }
  }, [navigate]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSaveAddress = () => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, address: addressInput };
    setCurrentUser(updatedUser);
    localStorage.setItem("currentUser", JSON.stringify(updatedUser));

    // Update users database list in localStorage
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const updatedUsers = users.map((u) => u.email === updatedUser.email ? updatedUser : u);
    localStorage.setItem("users", JSON.stringify(updatedUsers));
    
    alert("Address saved successfully! 🏠");
  };

  const handleRegenerateToken = () => {
    if (!currentUser) return;
    const newToken = "spt_tok_" + Math.random().toString(36).substring(2, 11) + Math.random().toString(36).substring(2, 11);
    const updatedUser = { ...currentUser, token: newToken };
    setCurrentUser(updatedUser);
    localStorage.setItem("currentUser", JSON.stringify(updatedUser));

    // Update users list in localStorage
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const updatedUsers = users.map((u) => u.email === updatedUser.email ? updatedUser : u);
    localStorage.setItem("users", JSON.stringify(updatedUsers));

    alert("Access Token regenerated successfully! ⚡");
  };

  const handleCopyToken = () => {
    if (!currentUser) return;
    navigator.clipboard.writeText(currentUser.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    alert("Logged out successfully! See you again soon. 👋");
    navigate("/");
  };

  const checkAutomaticAlerts = (list) => {
    list.forEach((product) => {
      const numericPrice = Number(product.price.replace(/[₹,]/g, ""));
      const numericOldPrice = Number(product.oldPrice.replace(/[₹,]/g, ""));

      if (numericPrice > 0 && numericOldPrice > 0 && numericPrice < numericOldPrice) {
        const alertedKey = `alert_${product.name.replace(/\s+/g, '_')}_${numericPrice}`;
        if (!localStorage.getItem(alertedKey)) {
          const origin = localStorage.getItem("appHostLink") || window.location.origin;
          const appLink = `${origin}/product?name=${encodeURIComponent(product.name)}&price=${encodeURIComponent(product.price)}&oldPrice=${encodeURIComponent(product.oldPrice)}&image=${encodeURIComponent(product.image)}&features=${encodeURIComponent(product.features || "")}&category=${encodeURIComponent(product.category || "")}&product_url=${encodeURIComponent(product.product_url || "#")}`;

          const escapedLink = appLink.replace(/&/g, "&amp;");
          const escapedName = product.name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

          const msg = `<b>🚨 AUTOMATIC PRICE DROP ALERT! 🚨</b>\n\n<b>${escapedName}</b> @ <b>${product.price}</b> (Was <s>${product.oldPrice}</s>).\n\n<b>Buy Link</b> : <a href="${escapedLink}">View in App</a>`;
          
          sendTelegramAlert(msg, product.image);
          localStorage.setItem(alertedKey, "true");
        }
      }
    });
  };

  useEffect(() => {
    // Poll Supabase products every 30 seconds to look for price drop updates
    const interval = setInterval(() => {
      fetchProducts();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  async function fetchProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("*");

    if (error) {
      console.log(error);
    } else {
      setProducts(data);
      // Run automatic alert check
      const dbProductsMerged = data.map((p) => ({
        id: `db-${p.id}`,
        name: p.name,
        price: typeof p.price === 'number' ? `₹${p.price.toLocaleString('en-IN')}` : (p.price.startsWith('₹') ? p.price : `₹${p.price}`),
        oldPrice: p.oldPrice || `₹${Math.round((parseFloat(String(p.price).replace(/[^\d.]/g, '')) || 0) * 1.15).toLocaleString('en-IN')}`,
        features: p.features || `Source: ${p.source || "Supabase"}`,
        image: p.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
        product_url: p.product_url || "#",
        category: p.category || "Tracked",
        isFromDb: true,
      }));
      const fullMergedList = [...dbProductsMerged, ...allProducts];
      checkAutomaticAlerts(fullMergedList);
    }
  }

  const [showNotifications, setShowNotifications] =
    useState(false);

  // States for Batch Product Insertion
  const [rows, setRows] = useState([
    { name: "", price: "", image: "", source: "", product_url: "" }
  ]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleRowChange = (index, field, value) => {
    const updated = [...rows];
    updated[index][field] = value;
    setRows(updated);
  };

  const addRow = () => {
    setRows([...rows, { name: "", price: "", image: "", source: "", product_url: "" }]);
  };

  const removeRow = (index) => {
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    // Validate
    const invalid = rows.some(r => !r.name || !r.price);
    if (invalid) {
      setMessage({ type: "error", text: "Please fill in Name and Price for all rows!" });
      setLoading(false);
      return;
    }

    // Format fields
    const formattedRows = rows.map(r => ({
      name: r.name.trim(),
      price: parseInt(r.price.toString().replace(/[^\d]/g, ''), 10) || 0,
      image: r.image.trim() || null,
      source: r.source.trim() || "Web",
      product_url: r.product_url.trim() || null
    }));

    try {
      const { data, error } = await supabase
        .from("products")
        .insert(formattedRows)
        .select();

      if (error) throw error;

      setMessage({
        type: "success",
        text: `Successfully added ${formattedRows.length} products to Supabase! 🎉`
      });
      setRows([{ name: "", price: "", image: "", source: "", product_url: "" }]);
      fetchProducts(); // Refresh list
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err.message || "Failed to add products." });
    } finally {
      setLoading(false);
    }
  };

  // Merge Supabase products with local products
  const mergedProducts = [
    ...products.map((p) => ({
      id: `db-${p.id}`,
      name: p.name,
      price: typeof p.price === 'number' ? `₹${p.price.toLocaleString('en-IN')}` : (p.price.startsWith('₹') ? p.price : `₹${p.price}`),
      oldPrice: p.oldPrice || `₹${Math.round((parseFloat(String(p.price).replace(/[^\d.]/g, '')) || 0) * 1.15).toLocaleString('en-IN')}`,
      features: p.features || `Source: ${p.source || "Supabase"}`,
      image: p.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
      product_url: p.product_url || "#",
      category: p.category || "Tracked",
      isFromDb: true,
    })),
    ...allProducts,
  ];

  const filteredProducts =
    mergedProducts.filter((product) =>
      product.name
        .toLowerCase()
        .includes(search.toLowerCase())
    );

  const deduplicatedProducts = [];
  const seenNames = new Set();
  for (const p of filteredProducts) {
    const normName = p.name.toLowerCase().trim();
    if (!seenNames.has(normName)) {
      seenNames.add(normName);
      deduplicatedProducts.push(p);
    }
  }

  return (
    <div
      className={`min-h-screen flex ${
        darkMode
          ? "bg-slate-950 text-white"
          : "bg-slate-50 text-slate-900"
      }`}
    >

      {/* Sidebar */}

   <div
  className={`p-2 md:p-6 min-h-screen sticky top-0 overflow-y-hidden border-r transition-all duration-300 ${
    darkMode
      ? "bg-slate-900 border-white/10 text-white"
      : "bg-white border-slate-200 text-slate-800"
  } w-16 md:w-64`}
>



        <h1
  className={`text-3xl font-bold mb-10 text-center md:text-left ${
    darkMode ? "text-blue-400" : "text-blue-600"
  }`}
></h1>

        <div className="space-y-4">

          <button
            onClick={() =>
              setActivePage("dashboard")
            }
           className={`w-full p-3 md:p-4 rounded-2xl flex items-center justify-center md:justify-start gap-3 transition cursor-pointer ${
             activePage === "dashboard"
               ? "bg-blue-600 text-white font-bold"
               : darkMode
               ? "bg-white/5 hover:bg-blue-600 text-white"
               : "bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600"
           }`}
          >
            <FaHome className="text-xl" />
            <span className="hidden md:inline">Dashboard</span>
          </button>

          <button
            onClick={() =>
              setActivePage("deals")
            }
            className={`w-full p-3 md:p-4 rounded-2xl flex items-center justify-center md:justify-start gap-3 transition cursor-pointer ${
              activePage === "deals"
                ? "bg-orange-500 text-white font-bold"
                : darkMode
                ? "bg-white/5 hover:bg-orange-500 text-white"
                : "bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-600"
            }`}
          >
            <FaFire className="text-xl" />
            <span className="hidden md:inline">Deals</span>
          </button>

          <button
            onClick={() =>
              setActivePage("wishlist")
            }
            className={`w-full p-3 md:p-4 rounded-2xl flex items-center justify-center md:justify-start gap-3 transition cursor-pointer ${
              activePage === "wishlist"
                ? "bg-pink-500 text-white font-bold"
                : darkMode
                ? "bg-white/5 hover:bg-pink-500 text-white"
                : "bg-slate-100 hover:bg-pink-50 text-slate-700 hover:text-pink-600"
            }`}
          >
            <FaHeart className="text-xl" />
            <span className="hidden md:inline">Wishlist</span>
          </button>

          <button
            onClick={() =>
              navigate("/cart")
            }
            className={`w-full p-3 md:p-4 rounded-2xl flex items-center justify-center md:justify-start gap-3 transition cursor-pointer ${
              darkMode
                ? "bg-white/5 hover:bg-green-600 text-white"
                : "bg-slate-100 hover:bg-green-50 text-slate-700 hover:text-green-600"
            }`}
          >
            <FaShoppingCart className="text-xl" />
            <span className="hidden md:inline">Cart ({cart.length})</span>
          </button>




          <button
            onClick={() =>
              setActivePage("profile")
            }
            className={`w-full p-3 md:p-4 rounded-2xl flex items-center justify-center md:justify-start gap-3 transition cursor-pointer ${
              activePage === "profile"
                ? "bg-indigo-600 text-white font-bold"
                : darkMode
                ? "bg-white/5 hover:bg-indigo-600 text-white"
                : "bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600"
            }`}
          >
            <FaUser className="text-xl" />
            <span className="hidden md:inline">Profile</span>
          </button>

          <button
            onClick={() =>
              setActivePage("settings")
            }
            className={`w-full p-3 md:p-4 rounded-2xl flex items-center justify-center md:justify-start gap-3 transition cursor-pointer ${
              activePage === "settings"
                ? "bg-amber-500 text-white font-bold"
                : darkMode
                ? "bg-white/5 hover:bg-amber-500 text-white"
                : "bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-600"
            }`}
          >
            <FaCog className="text-xl" />
            <span className="hidden md:inline">Settings</span>
          </button>

        </div>

      </div>

      {/* Main Content */}

      <div className="flex-1 p-5">

        {/* Navbar */}

        <div className={`flex items-center justify-between p-4 rounded-3xl border relative z-[100] transition-colors ${
          darkMode
            ? "bg-slate-900/80 border-white/10 text-white"
            : "bg-white border-slate-200 text-slate-900 shadow-sm"
        }`}>

          <div>

            <h2 className="text-3xl font-bold">
              Smart Price Tracker 🚀
            </h2>

            <p className="text-gray-300 text-sm mt-1">
              AI Powered Deal Finder
            </p>

          </div>

          <div className="flex items-center gap-4">

            <div className={`flex items-center px-4 py-2 rounded-full w-[280px] border transition-colors ${
              darkMode ? "bg-slate-950 border-white/5 text-white" : "bg-slate-100 border-slate-200 text-slate-800"
            }`}>

              <FaSearch className="text-gray-400" />

              <input
                type="text"
                placeholder="Search products..."
                className="bg-transparent outline-none px-3 w-full"
                style={{ color: "inherit" }}
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
              />

            </div>

            {/* Notifications */}

            <div className="relative z-[9999]">

              <div
                onClick={() =>
                  setShowNotifications(
                    !showNotifications
                  )
                }
                className="relative cursor-pointer"
              >

                <FaBell className="text-2xl hover:text-blue-400 transition" />

                <span className="absolute -top-2 -right-2 bg-red-500 text-[10px] h-5 w-5 flex items-center justify-center rounded-full">
                  3
                </span>

              </div>

              {showNotifications && (

                <div className="absolute right-0 top-12 w-80 bg-[#0f172a] border border-white/10 rounded-3xl shadow-2xl p-5">

                  <h2 className="text-xl font-bold mb-5">
                    🔔 Notifications
                  </h2>
                  

                  <div className="space-y-4">

                    <div className="bg-white/10 p-4 rounded-2xl">
                      🔥 iPhone price dropped by ₹5,000
                    </div>

                    <div className="bg-white/10 p-4 rounded-2xl">
                      ⚡ Flash sale started on Macbook
                    </div>

                    <div className="bg-white/10 p-4 rounded-2xl">
                      🛒 New fashion products added
                    </div>

                  </div>

                </div>

              )}

            </div>

          </div>

        </div>

        {/* Dashboard */}

        {activePage === "dashboard" && (

          <>
            <div className="mt-8">

  <button
    onClick={() =>
      sendTelegramAlert(
        "🔥 Test Alert From Smart Tracker"
      )
    }
    className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 rounded-2xl font-bold hover:scale-105 transition"
  >
    Send Telegram Alert 🚀
  </button>

</div>

            {/* Products */}

            <div className="mt-12">

              <h2 className="text-4xl font-bold mb-8">
                Trending Products
              </h2>
              <p className="mb-4">
  Total Products: {products.length}
</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">

                {deduplicatedProducts.map(
                  (product) => (

                    <div
                      key={product.id}
                      onClick={(e) => {
                        if (e.target.closest("button")) return;
                        navigate("/product", { state: product });
                      }}
                      className={`overflow-hidden hover:scale-105 transition duration-300 shadow-xl cursor-pointer rounded-3xl border ${
                        darkMode
                          ? "bg-slate-900/50 border-white/10 text-white hover:border-blue-500/50 shadow-2xl"
                          : "bg-white border-slate-200 text-slate-800 hover:border-slate-300 shadow-md"
                      }`}
                    >

                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-52 w-full object-cover"
                      />

                      <div className="p-4">

                        <h3 className="text-xl font-bold">
                          {product.name}
                        </h3>

                        <p className={`text-sm mt-2 ${darkMode ? "text-gray-300" : "text-slate-500"}`}>
                          {product.features}
                        </p>

                        <div className="mt-4">

                          <p className={`line-through ${darkMode ? "text-gray-500" : "text-slate-400"}`}>
                            {product.oldPrice}
                          </p>

                          <p className={`text-2xl font-bold ${darkMode ? "text-green-400" : "text-emerald-600"}`}>
                            {product.price}
                          </p>

                        </div>

                        <div className="flex gap-2 mt-5">

                          <button
                            onClick={() => {
                              navigate("/product", { state: product });
                            }}
                            className={`px-3 py-2 rounded-xl w-full font-bold cursor-pointer transition ${
                              darkMode ? "bg-white text-black hover:bg-gray-200" : "bg-slate-900 text-white hover:bg-slate-800"
                            }`}
                          >
                            Buy
                          </button>

                          <button
                            onClick={() =>
                              addToCart(
                                product
                              )
                            }
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl w-full font-bold flex items-center justify-center gap-2 cursor-pointer transition"
                          >

                            <FaShoppingCart />

                            Cart

                          </button>

                        </div>

                      </div>

                    </div>

                  )
                )}

              </div>

            </div>

          </>

        )}

        {/* Deals */}

        {activePage === "deals" && (

          <div className="mt-8">

            <h2 className="text-4xl font-bold mb-8">
              🔥 Trending Deals
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">

              {mergedProducts.slice(0, 6).map(
                (product) => (

                  <div
                    key={product.id}
                    onClick={() => navigate("/product", { state: product })}
                    className={`p-5 rounded-3xl border cursor-pointer hover:scale-105 transition duration-300 ${
                      darkMode
                        ? "bg-slate-900/50 border-white/10 text-white shadow-xl"
                        : "bg-white border-slate-200 text-slate-800 shadow-md"
                    }`}
                  >

                    <img
                      src={product.image}
                      className="h-48 w-full object-cover rounded-2xl"
                    />

                    <h3 className="text-2xl font-bold mt-4">
                      {product.name}
                    </h3>

                    <p className={`text-2xl font-bold mt-2 ${
                      darkMode ? "text-green-400" : "text-emerald-600"
                    }`}>
                      {product.price}
                    </p>

                  </div>

                )
              )}

            </div>

          </div>

        )}

        {/* Wishlist */}

        {activePage === "wishlist" && (

          <div className="mt-8">

            <h2 className="text-4xl font-bold mb-8">
              ❤️ Wishlist
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">

              {mergedProducts.slice(2, 5).map(
                (product) => (

                  <div
                    key={product.id}
                    onClick={() => navigate("/product", { state: product })}
                    className={`p-5 rounded-3xl border cursor-pointer hover:scale-105 transition duration-300 ${
                      darkMode
                        ? "bg-slate-900/50 border-white/10 text-white shadow-xl"
                        : "bg-white border-slate-200 text-slate-800 shadow-md"
                    }`}
                  >

                    <img
                      src={product.image}
                      className="h-48 w-full object-cover rounded-2xl"
                    />

                    <h3 className="text-2xl font-bold mt-4">
                      {product.name}
                    </h3>

                    <p className={`text-2xl font-bold mt-2 ${
                      darkMode ? "text-green-400" : "text-emerald-600"
                    }`}>
                      {product.price}
                    </p>

                  </div>

                )
              )}

            </div>

          </div>

        )}

        {/* Settings */}

       {activePage === "settings" && (
  <div className="mt-8">

    <h2 className="text-4xl font-bold mb-8">
      ⚙ Settings
    </h2>

     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      {/* Theme */}

      <div className={`p-6 rounded-3xl border transition-all duration-300 ${
        darkMode
          ? "bg-slate-900/50 border-white/10 text-white shadow-xl"
          : "bg-white border-slate-200 text-slate-800 shadow-md"
      }`}>
        <h3 className="text-2xl font-bold">
          🎨 Theme Settings
        </h3>

        <p className="mt-3">
          Current Theme:
          <span className="font-bold ml-2">
            {darkMode ? "Dark Mode 🌙" : "Light Mode ☀️"}
          </span>
        </p>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl cursor-pointer"
        >
          Switch Theme
        </button>
      </div>

      {/* Notifications */}

      <div className={`p-6 rounded-3xl border transition-all duration-300 ${
        darkMode
          ? "bg-slate-900/50 border-white/10 text-white shadow-xl"
          : "bg-white border-slate-200 text-slate-800 shadow-md"
      }`}>
        <h3 className="text-2xl font-bold">
          🔔 Notifications
        </h3>

        <p className="mt-3">
          View all notifications instantly.
        </p>

        <button
          onClick={() => setShowNotifications(true)}
          className="mt-4 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl cursor-pointer"
        >
          Open Notifications
        </button>
      </div>

      {/* Telegram */}

      <div className={`p-6 rounded-3xl border transition-all duration-300 ${
        darkMode
          ? "bg-slate-900/50 border-white/10 text-white shadow-xl"
          : "bg-white border-slate-200 text-slate-800 shadow-md"
      }`}>
        <h3 className="text-2xl font-bold">
          📱 Telegram Alerts
        </h3>

        <p className="mt-3">
          Send instant alert to Telegram.
        </p>

        <button
          onClick={() =>
            sendTelegramAlert(
              "🚀 Smart Tracker Test Alert"
            )
          }
          className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-xl cursor-pointer"
        >
          Send Alert
        </button>
      </div>

      {/* Profile */}

      <div className={`p-6 rounded-3xl border transition-all duration-300 ${
        darkMode
          ? "bg-slate-900/50 border-white/10 text-white shadow-xl"
          : "bg-white border-slate-200 text-slate-800 shadow-md"
      }`}>
        <h3 className="text-2xl font-bold">
          👤 Profile
        </h3>

        <p className="mt-3">
          Manage your profile settings.
        </p>

        <button
          onClick={() =>
            setActivePage("profile")
          }
          className="mt-4 bg-orange-600 hover:bg-orange-700 text-white px-5 py-2 rounded-xl cursor-pointer"
        >
          Open Profile
        </button>
      </div>

    </div>
  </div>
)}



        {activePage === "profile" && currentUser && (
          <div className="mt-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-orange-400 via-pink-500 to-indigo-500 bg-clip-text text-transparent">
                  Your Profile 👤
                </h2>
                <p className={`mt-2 ${darkMode ? "text-gray-400" : "text-slate-500"}`}>
                  Manage your billing address, token keys, and view booking history.
                </p>
              </div>
              <button
                onClick={() => setActivePage("dashboard")}
                className={`border text-sm px-5 py-2.5 rounded-2xl flex items-center gap-2 transition cursor-pointer ${
                  darkMode
                    ? "bg-white/10 hover:bg-white/20 border-white/10 text-white"
                    : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800"
                }`}
              >
                Back to Dashboard
              </button>
            </div>

            {/* Profile Content Details */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Account Settings / Profile Card */}
              <div className="lg:col-span-5 space-y-6">
                <div className={`p-6 rounded-3xl border transition-all duration-300 space-y-6 ${
                  darkMode ? "bg-slate-900/50 border-white/10 text-white shadow-xl" : "bg-white border-slate-200 text-slate-800 shadow-md"
                }`}>
                  <h3 className="text-2xl font-bold border-b border-white/10 pb-4 text-orange-400 flex items-center gap-2">
                    <FaUser /> Account Details
                  </h3>

                  {/* Name field */}
                  <div>
                    <label className={`text-xs font-semibold uppercase tracking-wider block mb-1 ${darkMode ? "text-gray-400" : "text-slate-500"}`}>
                      Full Name
                    </label>
                    <p className={`text-lg font-bold px-4 py-2.5 rounded-xl border ${
                      darkMode ? "text-white bg-slate-950 border-white/5" : "text-slate-800 bg-slate-50 border-slate-200/60"
                    }`}>
                      {currentUser.name}
                    </p>
                  </div>

                  {/* Email field */}
                  <div>
                    <label className={`text-xs font-semibold uppercase tracking-wider block mb-1 ${darkMode ? "text-gray-400" : "text-slate-500"}`}>
                      Email Address
                    </label>
                    <p className={`text-lg font-bold px-4 py-2.5 rounded-xl border ${
                      darkMode ? "text-indigo-300 bg-slate-950 border-white/5" : "text-indigo-600 bg-slate-50 border-slate-200/60"
                    }`}>
                      {currentUser.email}
                    </p>
                  </div>

                  {/* Address field (editable) */}
                  <div className="flex flex-col gap-1.5">
                    <label className={`text-xs font-semibold uppercase tracking-wider block mb-1 ${darkMode ? "text-gray-400" : "text-slate-500"}`}>
                      Shipping / Delivery Address
                    </label>
                    <textarea
                      value={addressInput}
                      onChange={(e) => setAddressInput(e.target.value)}
                      className={`rounded-xl px-4 py-2.5 transition-all text-sm leading-relaxed border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        darkMode ? "bg-slate-950 border-white/10 text-white placeholder-gray-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                      }`}
                      rows="3"
                      placeholder="Enter your shipping address here..."
                    />
                    <button
                      onClick={handleSaveAddress}
                      className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 rounded-xl text-xs transition duration-200 cursor-pointer"
                    >
                      Save Address
                    </button>
                  </div>

                  {/* Token field */}
                  <div className="space-y-2">
                    <label className={`text-xs font-semibold uppercase tracking-wider block mb-1 ${darkMode ? "text-gray-400" : "text-slate-500"}`}>
                      API Access Token
                    </label>
                    <div className={`flex rounded-xl p-1 items-center justify-between border ${
                      darkMode ? "bg-slate-950 border-white/10" : "bg-slate-50 border-slate-200"
                    }`}>
                      <code className="text-xs text-yellow-500 font-mono px-3 py-1 bg-transparent truncate w-4/5">
                        {currentUser.token}
                      </code>
                      <button
                        onClick={handleCopyToken}
                        className={`p-2 rounded-lg transition flex items-center justify-center cursor-pointer ${
                          darkMode ? "bg-white/10 hover:bg-white/20 text-white" : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                        }`}
                        title={copied ? "Copied!" : "Copy Token"}
                      >
                        {copied ? <span className="text-xs text-green-600 dark:text-green-400 font-bold px-1">Copied!</span> : <FaCopy />}
                      </button>
                    </div>
                    <button
                      onClick={handleRegenerateToken}
                      className={`w-full font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition duration-200 cursor-pointer border ${
                        darkMode ? "bg-white/10 hover:bg-white/20 border-white/5 text-gray-300" : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600"
                      }`}
                    >
                      <FaSyncAlt className="text-[10px]" />
                      Regenerate Access Token
                    </button>
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="w-full bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-rose-500/10 flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <FaSignOutAlt />
                    Sign Out Account
                  </button>
                </div>
              </div>

              {/* Booked Orders column */}
              <div className="lg:col-span-7 space-y-6">
                <div className={`p-6 rounded-3xl border transition-all duration-300 min-h-[450px] ${
                  darkMode ? "bg-slate-900/50 border-white/10 text-white shadow-xl" : "bg-white border-slate-200 text-slate-800 shadow-md"
                }`}>
                  <h3 className="text-2xl font-bold border-b border-white/10 pb-4 text-indigo-400 flex items-center gap-2">
                    <FaMapMarkerAlt /> Booked Orders History
                  </h3>

                  {(!currentUser.orders || currentUser.orders.length === 0) ? (
                    <div className="flex flex-col items-center justify-center h-[350px] text-center">
                      <div className="text-5xl mb-4">📦</div>
                      <h4 className={`text-xl font-bold ${darkMode ? "text-gray-300" : "text-slate-700"}`}>No Orders Booked</h4>
                      <p className={`text-sm mt-1 max-w-sm ${darkMode ? "text-gray-400" : "text-slate-500"}`}>
                        You haven't booked any orders yet. Go to your cart to checkout and book tracked products!
                      </p>
                      <button
                        onClick={() => setActivePage("dashboard")}
                        className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Explore Trending Products
                      </button>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-4 max-h-[500px] overflow-y-auto pr-2">
                      {currentUser.orders.map((order) => (
                        <div
                          key={order.id}
                          className={`border rounded-2xl p-5 transition ${
                            darkMode ? "bg-slate-950 border-white/5 hover:border-indigo-500/20" : "bg-slate-50 border-slate-200/60 hover:border-indigo-500/35"
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between border-b border-white/5 pb-3 mb-3 gap-2">
                            <div>
                              <span className="text-indigo-500 dark:text-indigo-400 font-mono font-bold text-sm block">
                                {order.id}
                              </span>
                              <span className={`text-xs ${darkMode ? "text-gray-400" : "text-slate-500"}`}>
                                Booked on: {order.date}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold">
                                {order.status}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-3">
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="h-10 w-10 object-cover rounded-lg border border-slate-200/40"
                                />
                                <div className="flex-1 min-w-0">
                                  <h5 className={`text-sm font-bold truncate ${darkMode ? "text-gray-200" : "text-slate-800"}`}>
                                    {item.name}
                                  </h5>
                                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-slate-500"}`}>
                                    Qty: {item.quantity} × {item.price}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="border-t border-white/5 mt-3 pt-3 flex justify-between items-center">
                            <span className={`text-xs ${darkMode ? "text-gray-400" : "text-slate-500"}`}>Total Price:</span>
                            <span className="text-green-600 dark:text-green-400 font-extrabold text-lg">
                              ₹{order.total.toLocaleString("en-IN")}
                            </span>
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

       </div>

     </div>

   );
 }