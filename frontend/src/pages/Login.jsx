import { useContext, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { loginUser } from "../api/auth";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";
import { AlertCircle, ArrowLeft, ArrowRight, Brain, Loader2, Lock, Mail, Moon, ShieldCheck, Sun,
} from "lucide-react";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const { darkMode, toggleTheme } = useContext(ThemeContext);

  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await loginUser(form);
      login(response.user, response.token);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--app-text)] flex items-center justify-center px-4 py-8 relative overflow-hidden">
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-[var(--app-accent)]/10 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="hidden lg:block">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-[var(--app-muted)] hover:text-[var(--app-text)] mb-8"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>

          <div className="mb-8">
            <div className="h-12 w-12 rounded-2xl bg-[var(--app-accent)] text-zinc-950 flex items-center justify-center font-black mb-6">
              CG
            </div>

            <h1 className="text-5xl font-black tracking-tighter leading-none mb-5">
              Continue your preparation workspace.
            </h1>

            <p className="text-lg text-[var(--app-muted)] leading-8 max-w-xl">
              Login to access your coding analytics, resume intelligence, AI study missions,
              and public portfolio builder.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 max-w-md">
            <InfoCard icon={Brain} title="AI Study Plans" />
            <InfoCard icon={ShieldCheck} title="Resume + Portfolio Intelligence" />
          </div>
        </div>

        <div className="app-card p-6 md:p-8 w-full max-w-md mx-auto">
          <div className="flex items-center justify-between mb-7">
            <Link to="/" className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[var(--app-accent)] text-zinc-950 flex items-center justify-center font-black">
                CG
              </div>
              <div>
                <p className="font-black leading-none">Career Guru</p>
                <p className="text-[10px] text-[var(--app-faint)] font-bold uppercase tracking-widest mt-1">
                  Login
                </p>
              </div>
            </Link>

            <button
              type="button"
              onClick={toggleTheme}
              className="h-10 w-10 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-2)] text-[var(--app-muted)] hover:text-[var(--app-text)] transition-all flex items-center justify-center"
            >
              {darkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>

          <h2 className="text-3xl font-black tracking-tight mb-2">
            Welcome back
          </h2>
          <p className="text-sm text-[var(--app-muted)] mb-6">
            Enter your credentials to open your command center.
          </p>

          {error && (
            <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500 flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field
              label="Email Address"
              icon={Mail}
              type="email"
              value={form.email}
              onChange={(value) => setForm({ ...form, email: value })}
              placeholder="you@example.com"
              required
            />

            <Field
              label="Password"
              icon={Lock}
              type="password"
              value={form.password}
              onChange={(value) => setForm({ ...form, password: value })}
              placeholder="••••••••"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="app-btn-primary w-full px-5 py-3.5 text-xs uppercase tracking-widest"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing in
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-[var(--app-muted)]">
            Don&apos;t have an account?{" "}
            <Link
              to="/register"
              className="font-black text-[var(--app-accent)] hover:underline"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const InfoCard = ({ icon: Icon, title }) => (
  <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 flex items-center gap-3">
    <div className="h-10 w-10 rounded-xl bg-[var(--app-accent)]/10 border border-[var(--app-accent)]/20 flex items-center justify-center">
      <Icon size={18} className="text-[var(--app-accent)]" />
    </div>
    <p className="font-bold">{title}</p>
  </div>
);

const Field = ({
  label, icon: Icon, type, value, onChange, placeholder, required,
}) => (
  <div>
    <label className="text-[10px] text-[var(--app-muted)] font-black uppercase tracking-widest mb-2 block">
      {label}
    </label>

    <div className="relative">
      <Icon
        size={16}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--app-faint)]"
      />

      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="app-input px-4 py-3 pl-11 text-sm"
      />
    </div>
  </div>
);

export default Login;