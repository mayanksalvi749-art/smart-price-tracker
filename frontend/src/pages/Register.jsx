import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaTag, FaEye, FaEyeSlash, FaPhone, FaCamera, FaUser } from "react-icons/fa";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [avatar, setAvatar] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      setError("Please fill in all required fields.");
      return;
    }
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const emailExists = users.some(
      (user) => user.email.toLowerCase() === form.email.toLowerCase()
    );
    if (emailExists) {
      setError("An account with this email already exists.");
      return;
    }
    const newUser = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      password: form.password,
      address: "",
      avatar: avatar || null,
      orders: [],
    };
    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("currentUser", JSON.stringify(newUser));
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex" style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #1d4ed8 100%)" }}>
      {/* Left illustration */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white"
              style={{ width: `${80 + i * 40}px`, height: `${80 + i * 40}px`, top: `${8 + i * 12}%`, left: `${5 + i * 8}%`, opacity: 0.3 - i * 0.03 }} />
          ))}
        </div>
        <div className="relative text-center text-white max-w-md">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <FaTag className="text-4xl text-white" />
          </div>
          <h1 className="text-5xl font-extrabold mb-4 leading-tight">
            Start <span className="text-green-400">Saving</span><br />Today
          </h1>
          <p className="text-blue-200 text-lg">Join thousands of smart shoppers who never pay full price.</p>
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[["Free", "Forever"], ["Real-time", "Alerts"], ["AI", "Powered"]].map(([val, label]) => (
              <div key={label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <p className="text-xl font-extrabold text-white">{val}</p>
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
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <FaTag className="text-white text-sm" />
            </div>
            <span className="text-2xl font-extrabold text-gray-900">
              Smart<span className="text-blue-600">Price</span>
            </span>
          </div>

          <h2 className="text-3xl font-extrabold text-gray-900 mb-1">Create account</h2>
          <p className="text-gray-400 text-sm mb-6">Start tracking deals in seconds</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm text-center font-medium">
              {error}
            </div>
          )}

          {/* Avatar upload */}
          <div className="flex justify-center mb-6">
            <label htmlFor="avatar-upload" className="relative cursor-pointer group">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                {avatar ? (
                  <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <FaUser className="text-3xl text-blue-400" />
                )}
              </div>
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white shadow group-hover:scale-110 transition">
                <FaCamera className="text-white text-[9px]" />
              </div>
              <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Full Name *</label>
              <input
                type="text" name="name" placeholder="John Doe"
                value={form.name} onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email Address *</label>
              <input
                type="email" name="email" placeholder="john@example.com"
                value={form.email} onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
              />
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
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Password *</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"} name="password" placeholder="Min. 6 characters"
                  value={form.password} onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm pr-12"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition cursor-pointer">
                  {showPass ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-200 transition duration-200 cursor-pointer text-sm mt-2"
            >
              Create Account →
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{" "}
            <Link to="/" className="text-blue-600 hover:underline font-bold">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}