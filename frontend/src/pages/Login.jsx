import { useState, useContext } from "react";
import { loginUser } from "../api/auth";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link, useLocation } from "react-router-dom";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await loginUser({
        email: form.email.trim(),
        password: form.password,
      });

      if (!response?.token || !response?.user) {
        throw new Error("Invalid login response from server");
      }

      login(response.user, response.token);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Invalid credentials. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 transition-colors px-4">
      <div className="bg-gray-900 p-8 rounded-[2rem] shadow-2xl w-full max-w-md border border-gray-800 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 h-40 w-40 bg-blue-600/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <h2 className="text-4xl font-black mb-2 text-white italic">
            LOGIN <span className="text-blue-500">CENTER</span>
          </h2>
          <p className="text-gray-500 text-sm mb-8 font-medium">
            Continue your coding intelligence workflow.
          </p>

          {error && (
            <p className="text-red-400 text-sm mb-4 bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
                Email Address
              </label>
              <input
                type="email"
                required
                className="w-full p-3 rounded-xl bg-gray-950 border border-gray-800 text-white outline-none focus:border-blue-500 transition-all"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
                Password
              </label>
              <input
                type="password"
                required
                className="w-full p-3 rounded-xl bg-gray-950 border border-gray-800 text-white outline-none focus:border-blue-500 transition-all"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white font-black py-4 rounded-2xl transition-all shadow-lg ${
                loading
                  ? "bg-gray-700 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-500 shadow-blue-900/20 active:scale-95"
              }`}
            >
              {loading ? "SIGNING IN..." : "SIGN IN"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-400 font-medium">
            Do not have an account?{" "}
            <Link
              to="/register"
              className="text-blue-500 font-bold hover:underline ml-1"
            >
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;