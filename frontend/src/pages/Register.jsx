import { useState, useContext } from "react";
import { registerUser } from "../api/auth";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Register = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await registerUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      if (!res?.token || !res?.user) {
        throw new Error("Invalid registration response from server");
      }

      login(res.user, res.token);
      navigate("/onboarding", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 transition-colors px-4">
      <div className="bg-gray-900 p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-gray-800 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 h-40 w-40 bg-blue-600/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <h2 className="text-4xl font-black mb-2 text-white italic">
            CREATE <span className="text-blue-500">ACCOUNT</span>
          </h2>
          <p className="text-gray-500 text-sm mb-8 font-medium">
            Start your coding intelligence journey.
          </p>

          {error && (
            <p className="text-red-400 text-sm mb-4 bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
                Full Name
              </label>
              <input
                type="text"
                required
                className="w-full p-3 rounded-xl bg-gray-950 border border-gray-800 text-white outline-none focus:border-blue-500 transition-all"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Vaibhav Rai"
              />
            </div>

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
                minLength="6"
                className="w-full p-3 rounded-xl bg-gray-950 border border-gray-800 text-white outline-none focus:border-blue-500 transition-all"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Minimum 6 characters"
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
              {loading ? "CREATING..." : "JOIN NOW"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-400 font-medium">
            Already a member?{" "}
            <Link
              to="/login"
              className="text-blue-500 font-bold hover:underline ml-1"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;