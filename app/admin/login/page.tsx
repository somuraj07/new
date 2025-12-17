"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }

    const session = await getSession();

    if (!session?.user) {
      setError("Something went wrong");
      setLoading(false);
      return;
    }

    switch (session.user.role) {
      case "SUPERADMIN":
        router.push("/admin/super");
        break;
      case "SCHOOLADMIN":
        router.push("/admin/school");
        break;
      case "TEACHER":
      case "STUDENT":
        router.push("/student");
        break;
      default:
        router.push("/unauthorized");
    }

    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-green-50">
      <motion.form
        onSubmit={handleLogin}
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white shadow-xl p-10 rounded-2xl w-96 relative overflow-hidden"
      >
        <h2 className="text-3xl font-bold mb-6 text-center text-black">
          Login
        </h2>

        {error && (
          <p className="text-red-600 mb-4 text-center animate-pulse">{error}</p>
        )}

        {/* Email Input */}
        <div className="mb-4 relative">
          <input
            type="email"
            placeholder="Email"
            className="w-full border border-green-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 transition text-black placeholder-black"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {/* Password Input */}
        <div className="mb-6 relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="w-full border border-green-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 transition pr-12 text-black placeholder-black"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-black font-semibold"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold shadow-md hover:bg-green-700 transition"
        >
          {loading ? "Logging in..." : "Login"}
        </motion.button>

        {/* Extra Animation */}
        <motion.div
          className="absolute -top-10 -right-10 w-32 h-32 bg-green-200 rounded-full opacity-30 animate-pulse"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        ></motion.div>
        <motion.div
          className="absolute -bottom-10 -left-10 w-40 h-40 bg-green-300 rounded-full opacity-20 animate-pulse"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 3 }}
        ></motion.div>
      </motion.form>
    </div>
  );
}
