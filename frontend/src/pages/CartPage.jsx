import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { FaTrash, FaArrowLeft, FaShoppingCart, FaMapMarkerAlt, FaCheckCircle } from "react-icons/fa";
import { IMAGE_NOT_AVAILABLE } from "../utils/productImages";

export default function Cart({
  cart,
  removeFromCart,
  increaseQty,
  decreaseQty,
  checkoutCart,
}) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(() => {
    const user = localStorage.getItem("currentUser");
    return user ? JSON.parse(user) : null;
  });
  const [shippingAddress, setShippingAddress] = useState(() => {
    const user = localStorage.getItem("currentUser");
    return user ? (JSON.parse(user).address || "No address set yet.") : "";
  });
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  const totalPrice = cart.reduce((total, item) => {
    const numericPrice = Number(item.price.replace(/[₹,]/g, ""));
    return total + numericPrice * item.quantity;
  }, 0);

  const handleCheckoutSubmit = () => {
    if (!currentUser) {
      alert("Please login first to complete checkout.");
      navigate("/");
      return;
    }

    // Save updated address back if it changed
    if (shippingAddress !== currentUser.address) {
      const updatedUser = { ...currentUser, address: shippingAddress };
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));
      
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const updatedUsers = users.map((u) => u.email === updatedUser.email ? updatedUser : u);
      localStorage.setItem("users", JSON.stringify(updatedUsers));
    }

    // Call checkoutCart logic
    const success = checkoutCart();
    if (success) {
      alert("🎉 Order placed successfully! You can view it under your Profile > Booked Orders.");
      // Navigate to dashboard and set profile tab active (we'll save profile state in sessionStorage or check state in Dashboard)
      sessionStorage.setItem("activePage", "profile");
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#111827] text-white p-6 md:p-12">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-8 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="bg-white/10 hover:bg-white/20 border border-white/10 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 transition cursor-pointer"
        >
          <FaArrowLeft />
          Back to Dashboard
        </button>
        <div className="text-right">
          <h1 className="text-3xl font-extrabold flex items-center gap-3 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent">
            <FaShoppingCart className="text-indigo-400 text-2xl" />
            Your Shopping Cart
          </h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        {cart.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center shadow-2xl">
            <div className="text-6xl mb-4 text-indigo-400">🛒</div>
            <h2 className="text-2xl font-bold">Your Cart is Empty</h2>
            <p className="text-gray-400 mt-2 mb-6">Looks like you haven't tracked and added any deals yet!</p>
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Cart Items List */}
            <div className="lg:col-span-7 space-y-4">
              {cart.map((item) => {
                const itemImage = item.image || item.primary_image || IMAGE_NOT_AVAILABLE;
                return (
                  <div
                    key={item.id}
                    className="bg-white/10 backdrop-blur-md border border-white/5 p-5 rounded-3xl shadow-xl flex gap-5 items-center hover:border-white/10 transition"
                  >
                    <img
                      src={itemImage}
                      alt={item.name}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      onError={(e) => { e.currentTarget.src = IMAGE_NOT_AVAILABLE; }}
                      className="h-28 w-28 object-contain bg-white rounded-2xl p-1"
                    />

                    <div className="flex-1">
                      <h2 className="text-lg font-bold line-clamp-1">{item.name}</h2>
                      <p className="text-gray-400 text-xs mt-1 line-clamp-1">{item.features}</p>
                      <p className="text-green-400 font-extrabold mt-2 text-lg">{item.price}</p>

                      <div className="flex gap-2.5 items-center mt-3">
                        <button
                          onClick={() => decreaseQty(item.id)}
                          className="bg-white/10 hover:bg-white/20 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg"
                        >
                          -
                        </button>
                        <span className="text-base font-extrabold w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => increaseQty(item.id)}
                          className="bg-white/10 hover:bg-white/20 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 p-3 rounded-xl transition"
                      title="Remove Item"
                    >
                      <FaTrash />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Cart Summary & Checkout Details */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl space-y-5">
                <h2 className="text-2xl font-bold">Summary</h2>
                
                <div className="border-t border-white/10 pt-4 space-y-3">
                  <div className="flex justify-between text-gray-400">
                    <span>Total items:</span>
                    <span className="font-semibold text-white">{cart.reduce((s, i) => s + i.quantity, 0)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Shipping:</span>
                    <span className="text-emerald-400 font-bold">FREE</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold border-t border-white/10 pt-4 text-white">
                    <span>Grand Total:</span>
                    <span className="text-green-400 font-extrabold">₹{totalPrice.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {isCheckingOut ? (
                  <div className="border-t border-white/10 pt-4 space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-indigo-400">
                      <FaMapMarkerAlt /> Confirm Delivery Address
                    </h3>

                    {isEditingAddress ? (
                      <div>
                        <textarea
                          className="w-full bg-slate-900 border border-white/10 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-white"
                          rows="3"
                          value={shippingAddress}
                          onChange={(e) => setShippingAddress(e.target.value)}
                        />
                        <button
                          onClick={() => setIsEditingAddress(false)}
                          className="mt-2 text-xs font-bold text-blue-400 hover:underline"
                        >
                          Confirm Temp Address
                        </button>
                      </div>
                    ) : (
                      <div className="bg-white/5 p-4 border border-white/5 rounded-2xl">
                        <p className="text-sm text-gray-300 leading-relaxed">{shippingAddress}</p>
                        <button
                          onClick={() => setIsEditingAddress(true)}
                          className="mt-2 text-xs font-bold text-indigo-400 hover:underline"
                        >
                          Change Address
                        </button>
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => setIsCheckingOut(false)}
                        className="w-1/2 bg-white/10 hover:bg-white/20 border border-white/10 py-3 rounded-xl font-semibold text-sm transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCheckoutSubmit}
                        className="w-1/2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 py-3 rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
                      >
                        <FaCheckCircle /> Book Order
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      if (!currentUser) {
                        alert("Please register or login first to checkout.");
                        navigate("/");
                      } else {
                        setIsCheckingOut(true);
                      }
                    }}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-extrabold py-4 rounded-2xl shadow-lg shadow-blue-500/20 text-lg hover:scale-102 transition duration-200 cursor-pointer"
                  >
                    Proceed to Checkout
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}