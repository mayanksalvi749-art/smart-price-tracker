import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaTag, FaEye, FaEyeSlash, FaPhone } from "react-icons/fa";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", phone: "" });
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const matchedUser = users.find(
      (user) =>
        user.email.toLowerCase() === form.email.toLowerCase() &&
        user.password === form.password
    );
    if (!matchedUser) {
      setError("Invalid email or password.");
      return;
    }
    // Update phone if provided
    const updatedUser = form.phone ? { ...matchedUser, phone: form.phone } : matchedUser;
    if (form.phone) {
      const updatedUsers = users.map((u) => u.email === updatedUser.email ? updatedUser : u);
      localStorage.setItem("users", JSON.stringify(updatedUsers));
    }
    localStorage.setItem("currentUser", JSON.stringify(updatedUser));
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex" style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #1d4ed8 100%)" }}>
      {/* Left illustration */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white"
              style={{ width: `${80 + i * 40}px`, height: `${80 + i * 40}px`, top: `${10 + i * 12}%`, left: `${5 + i * 8}%`, opacity: 0.3 - i * 0.03 }} />
          ))}
        </div>
        <div className="relative text-center text-white max-w-md">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <FaTag className="text-4xl text-white" />
          </div>
          <h1 className="text-5xl font-extrabold mb-4 leading-tight">
            Find Real <span className="text-green-400">Deals</span>
          </h1>
          <p className="text-blue-200 text-lg">Track prices, compare stores, and shop smarter every day.</p>
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[["₹50K+", "Saved"], ["10K+", "Products"], ["99%", "Accuracy"]].map(([val, label]) => (
              <div key={label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <p className="text-2xl font-extrabold text-white">{val}</p>
                <p className="text-blue-200 text-xs mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <FaTag className="text-white text-sm" />
            </div>
            <span className="text-2xl font-extrabold text-gray-900">
              Smart<span className="text-blue-600">Price</span>
            </span>
          </div>

          <h2 className="text-3xl font-extrabold text-gray-900 mb-1">Welcome back!</h2>
          <p className="text-gray-400 text-sm mb-7">Sign in to track the best deals</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-5 text-sm text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email Address</label>
              <input
                type="email" name="email" placeholder="john@example.com"
                value={form.email} onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"} name="password" placeholder="••••••••"
                  value={form.password} onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm pr-12"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition cursor-pointer">
                  {showPass ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Phone Number <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                <input
                  type="tel" name="phone" placeholder="+91 98765 43210"
                  value={form.phone} onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-200 transition duration-200 cursor-pointer text-sm mt-2"
            >
              Sign In →
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Don't have an account?{" "}
            <Link to="/register" className="text-blue-600 hover:underline font-bold">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
