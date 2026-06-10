import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
    setError(""); // Clear error on change
  };

  const handleRegister = (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }

    // Retrieve existing users list from localStorage
    const users = JSON.parse(localStorage.getItem("users") || "[]");

    // Check if email already exists
    const emailExists = users.some(
      (user) => user.email.toLowerCase() === form.email.toLowerCase()
    );

    if (emailExists) {
      setError("An account with this email already exists.");
      return;
    }

    // Generate a secure mock session token
    const mockToken = "spt_tok_" + Math.random().toString(36).substring(2, 11) + Math.random().toString(36).substring(2, 11);

    // Create new user profile
    const newUser = {
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      address: "No address set yet. Update below.",
      token: mockToken,
      orders: [],
    };

    // Save user record
    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));

    // Log the user in
    localStorage.setItem("currentUser", JSON.stringify(newUser));

    navigate("/dashboard");
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#111827] text-white p-4">
      <form
        onSubmit={handleRegister}
        className="bg-white/10 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl w-full max-w-md"
      >
        <h1 className="text-4xl font-extrabold mb-2 text-center bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
          Smart Price Tracker
        </h1>

        <p className="text-center text-gray-400 mb-6 text-sm">
          Create your account to start tracking deals
        </p>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-xl mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
            Full Name
          </label>
          <input
            type="text"
            name="name"
            placeholder="e.g. John Doe"
            value={form.name}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-white/10 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white placeholder-gray-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            placeholder="e.g. john@example.com"
            value={form.email}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-white/10 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white placeholder-gray-500"
          />
        </div>

        <div className="mb-6">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
            Password
          </label>
          <input
            type="password"
            name="password"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-white/10 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white placeholder-gray-500"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold p-3.5 rounded-xl shadow-lg shadow-blue-500/20 hover:scale-102 transition duration-200 cursor-pointer"
        >
          Register
        </button>

        <p className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link
            to="/"
            className="text-blue-400 hover:underline font-semibold"
          >
            Sign In here
          </Link>
        </p>
      </form>
    </div>
  );
}