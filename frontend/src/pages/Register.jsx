import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api/auth";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Brain,
  Loader2,
  Lock,
  Mail,
  Moon,
  ShieldCheck,
  Sun,
  User,
  Zap,
} from "lucide-react";

const Register = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const { darkMode, toggleTheme } = useContext(ThemeContext);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const res = await registerUser(form);

      if (!res?.token || !res?.user) {
        throw new Error("Invalid registration response from server");
      }

      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      localStorage.setItem("onboardingPending", "true");

      login(res.user, res.token);

      setTimeout(() => {
        navigate("/onboarding", { replace: true });
      }, 0);
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
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--app-text)] flex items-center justify-center px-4 py-8 relative overflow-hidden">
      <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[var(--app-accent)]/10 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="hidden lg:block order-2">
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
              Build a public-ready SDE profile.
            </h1>

            <p className="text-lg text-[var(--app-muted)] leading-8 max-w-xl">
              Create your workspace, connect coding profiles, upload resumes,
              generate study missions, and share your public portfolio.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 max-w-md">
            <InfoCard icon={Zap} title="Generate connected AI study missions" />
            <InfoCard icon={Brain} title="Analyze weak topics and readiness" />
            <InfoCard icon={ShieldCheck} title="Create a recruiter-facing portfolio" />
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
                  Register
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
            Create account
          </h2>
          <p className="text-sm text-[var(--app-muted)] mb-6">
            Start building your preparation workspace.
          </p>

          {error && (
            <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500 flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field
              label="Full Name"
              icon={User}
              type="text"
              value={form.name}
              onChange={(value) => setForm({ ...form, name: value })}
              placeholder="Vaibhav Rai"
              required
            />

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
              placeholder="Minimum 6 characters"
              required
              minLength={6}
            />

            <button
              type="submit"
              disabled={loading}
              className="app-btn-primary w-full px-5 py-3.5 text-xs uppercase tracking-widest"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-[var(--app-muted)]">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-black text-[var(--app-accent)] hover:underline"
            >
              Login
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
  label,
  icon: Icon,
  type,
  value,
  onChange,
  placeholder,
  required,
  minLength,
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
        minLength={minLength}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="app-input px-4 py-3 pl-11 text-sm"
      />
    </div>
  </div>
);

export default Register;