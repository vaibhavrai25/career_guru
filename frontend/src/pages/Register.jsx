import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api/auth";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";
import { AlertCircle, ArrowLeft, Loader2, Lock, Mail, Moon, Sun, User, Layers, ShieldCheck, Target } from "lucide-react";

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
      if (!res?.token || !res?.user) throw new Error("Invalid registration response");

      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      localStorage.setItem("onboardingPending", "true");

      login(res.user, res.token);
      navigate("/onboarding", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--app-text)] font-sans selection:bg-[var(--app-accent)]/30 flex items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[var(--app-accent)]/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-blue-500/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        <div className="hidden lg:block order-2">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--app-muted)] hover:text-[var(--app-text)] mb-10 transition-colors">
            <ArrowLeft size={16} /> Back to home
          </Link>
          <div className="h-10 w-10 rounded-xl bg-[var(--app-accent)] text-zinc-950 flex items-center justify-center font-bold mb-6 shadow-sm">CG</div>
          <h1 className="text-4xl font-bold text-[var(--app-text)] tracking-tight leading-tight mb-4">
            Build your engineering profile.
          </h1>
          <p className="text-[var(--app-muted)] text-lg mb-8 leading-relaxed max-w-md">
            Create an account to track your problem-solving, test your resumes, and build a public portfolio.
          </p>
          <div className="space-y-3 max-w-sm">
            <InfoCard icon={Layers} title="Unified Task Board" />
            <InfoCard icon={ShieldCheck} title="Resume ATS Analysis" />
            <InfoCard icon={Target} title="Goal-Oriented Planning" />
          </div>
        </div>

        <div className="app-card w-full max-w-md mx-auto p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-[var(--app-text)] tracking-tight">Create Account</h2>
            <button onClick={toggleTheme} className="p-2 rounded-lg text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-surface-2)] transition-colors">
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-[var(--app-danger)]/20 bg-[var(--app-danger)]/10 p-4 text-sm text-[var(--app-danger)] flex items-center gap-2">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Field label="Full Name" icon={User} type="text" value={form.name} onChange={(val) => setForm({ ...form, name: val })} placeholder="e.g., Vaibhav Rai" required />
            <Field label="Email Address" icon={Mail} type="email" value={form.email} onChange={(val) => setForm({ ...form, email: val })} placeholder="name@example.com" required />
            <Field label="Password" icon={Lock} type="password" value={form.password} onChange={(val) => setForm({ ...form, password: val })} placeholder="Minimum 6 characters" required minLength={6} />
            
            <button type="submit" disabled={loading} className="app-btn-primary w-full py-3.5 mt-2">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : "Create Account"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm font-medium text-[var(--app-muted)]">
            Already have an account? <Link to="/login" className="text-[var(--app-accent)] hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const InfoCard = ({ icon: Icon, title }) => (
  <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-2)] p-4 flex items-center gap-3">
    <div className="p-2 bg-[var(--app-surface)] rounded-lg border border-[var(--app-border)]">
      <Icon size={18} className="text-[var(--app-accent)]" />
    </div>
    <p className="text-sm font-medium text-[var(--app-text)]">{title}</p>
  </div>
);

const Field = ({ label, icon: Icon, type, value, onChange, placeholder, required, minLength }) => (
  <div>
    <label className="text-xs font-semibold text-[var(--app-muted)] mb-2 block">{label}</label>
    <div className="relative">
      <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--app-faint)]" />
      <input type={type} value={value} required={required} minLength={minLength} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="app-input py-2.5 pl-11 text-sm" />
    </div>
  </div>
);

export default Register;