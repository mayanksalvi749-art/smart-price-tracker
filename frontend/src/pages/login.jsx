import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
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

    localStorage.setItem("currentUser", JSON.stringify(matchedUser));
    navigate("/dashboard");
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#111827] text-white p-4">
      <form
        onSubmit={handleLogin}
        className="bg-white/10 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl w-full max-w-md"
      >
        <h1 className="text-4xl font-extrabold mb-2 text-center bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
          Smart Price Tracker
        </h1>

        <p className="text-center text-gray-400 mb-6 text-sm">
          Sign in to your account to track the best deals
        </p>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-xl mb-4 text-sm text-center">
            {error}
          </div>
        )}

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
          Sign In
        </button>

        <p className="mt-6 text-center text-sm text-gray-400">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-blue-400 hover:underline font-semibold"
          >
            Register here
          </Link>
        </p>
      </form>
    </div>
  );
}
