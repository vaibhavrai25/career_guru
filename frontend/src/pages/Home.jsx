import { useContext } from "react";
import { Link, Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";
import {
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  Code2,
  FileText,
  Github,
  GraduationCap,
  Moon,
  Rocket,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  Trophy,
  Zap,
} from "lucide-react";

const Home = () => {
  const { user, loading } = useContext(AuthContext);
  const { darkMode, toggleTheme } = useContext(ThemeContext);

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--app-text)] overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-[var(--app-accent)]/10 blur-3xl" />
        <div className="absolute top-20 -right-40 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-emerald-500/5 blur-3xl" />
      </div>

      <nav className="relative z-10 border-b border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-bg)_86%,transparent)] backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-5 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[var(--app-accent)] text-zinc-950 flex items-center justify-center font-black shadow-sm">
              CG
            </div>

            <div>
              <p className="text-base font-black tracking-tight leading-none">
                Career Guru
              </p>
              <p className="text-[10px] text-[var(--app-faint)] font-bold uppercase tracking-[0.18em] mt-1">
                AI Career OS
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="h-10 w-10 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-surface-2)] transition-all flex items-center justify-center"
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            <Link
              to="/login"
              className="hidden sm:inline-flex app-btn-secondary px-4 py-2 text-xs uppercase tracking-widest"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="app-btn-primary px-4 py-2 text-xs uppercase tracking-widest"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        <section className="mx-auto max-w-7xl px-5 pt-16 pb-10 lg:pt-24 lg:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--app-muted)] mb-6">
                <Sparkles size={14} className="text-[var(--app-accent)]" />
                Built for SDE Internship Preparation
              </div>

              <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.95] mb-6">
                Your personal{" "}
                <span className="text-[var(--app-accent)]">career command center</span>
                .
              </h1>

              <p className="text-lg md:text-xl text-[var(--app-muted)] leading-9 max-w-3xl mb-8">
                Career Guru brings coding analytics, AI study planning, resume intelligence,
                GitHub project insights, and public portfolio sharing into one clean workspace.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <Link
                  to="/register"
                  className="app-btn-primary px-6 py-4 text-sm uppercase tracking-widest"
                >
                  Start Free
                  <ArrowRight size={17} />
                </Link>

                <Link
                  to="/login"
                  className="app-btn-secondary px-6 py-4 text-sm uppercase tracking-widest"
                >
                  Login
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl">
                <HeroStat label="Coding Data" value="Live" />
                <HeroStat label="AI Plans" value="Smart" />
                <HeroStat label="Resume ATS" value="Deep" />
                <HeroStat label="Portfolio" value="Public" />
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="app-card p-5 md:p-6 relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-[var(--app-accent)]/10 rounded-full blur-3xl" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <div>
                      <p className="text-[10px] text-[var(--app-faint)] font-black uppercase tracking-[0.22em]">
                        Readiness Snapshot
                      </p>
                      <h2 className="text-2xl font-black tracking-tight mt-1">
                        SDE Intern Mode
                      </h2>
                    </div>

                    <div className="h-12 w-12 rounded-2xl bg-[var(--app-accent)]/10 border border-[var(--app-accent)]/20 flex items-center justify-center">
                      <Brain size={22} className="text-[var(--app-accent)]" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <PreviewRow
                      icon={Code2}
                      title="Coding Analytics"
                      value="LeetCode · CF · CodeChef"
                      progress={78}
                    />
                    <PreviewRow
                      icon={GraduationCap}
                      title="AI Study Mission"
                      value="Connected tasks, not random lists"
                      progress={66}
                    />
                    <PreviewRow
                      icon={FileText}
                      title="Resume Intelligence"
                      value="ATS + JD fit + exact rewrites"
                      progress={72}
                    />
                    <PreviewRow
                      icon={Github}
                      title="Project Portfolio"
                      value="GitHub projects + public profile"
                      progress={61}
                    />
                  </div>

                  <div className="mt-6 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-2)] p-4">
                    <div className="flex items-start gap-3">
                      <Zap size={18} className="text-[var(--app-accent)] shrink-0 mt-1" />
                      <p className="text-sm text-[var(--app-muted)] leading-6">
                        AI converts weak topics, contests, resume gaps, and project signals into
                        one practical preparation path.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <FeatureCard
              icon={BarChart3}
              title="Coding Intelligence"
              text="Sync coding platforms, show solved distribution, streaks, ratings, heatmaps, topic weakness, and contest signals."
            />
            <FeatureCard
              icon={Rocket}
              title="AI Study Planner"
              text="Generate compact connected study missions with theory, practice links, revision steps, and success criteria."
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Resume Analysis"
              text="Upload resumes for different companies and roles. Get ATS score, readiness, gap matrix, and exact bullet rewrites."
            />
            <FeatureCard
              icon={Trophy}
              title="Public Portfolio"
              text="Share a public profile with coding stats, contest ratings, GitHub projects, topics, and Career Guru summary."
            />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-10">
          <div className="app-card p-6 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div>
                <p className="text-[10px] text-[var(--app-accent)] font-black uppercase tracking-[0.25em] mb-3">
                  Why Career Guru?
                </p>
                <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
                  Not a to-do app. A preparation system.
                </h2>
                <p className="text-[var(--app-muted)] leading-7">
                  Most students track DSA, resume, projects, and applications separately.
                  Career Guru connects them into one measurable preparation dashboard.
                </p>
              </div>

              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Benefit text="Find weak DSA topics from real platform data." />
                <Benefit text="Generate fewer but connected AI study tasks." />
                <Benefit text="Turn resume feedback into concrete improvements." />
                <Benefit text="Share one public portfolio link with recruiters." />
                <Benefit text="Track platform rating and contest growth." />
                <Benefit text="Show GitHub projects with clean public presentation." />
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-12 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-5">
              Build your internship profile like a product.
            </h2>
            <p className="text-[var(--app-muted)] leading-8 mb-7">
              Create your workspace, connect profiles, upload resume, generate study missions,
              and share your public portfolio.
            </p>

            <Link
              to="/register"
              className="app-btn-primary px-7 py-4 text-sm uppercase tracking-widest"
            >
              Create Account
              <ArrowRight size={17} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-[var(--app-border)]">
        <div className="mx-auto max-w-7xl px-5 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-[var(--app-muted)]">
          <p>Career Guru © 2026</p>
          <p>AI-powered SDE preparation workspace</p>
        </div>
      </footer>
    </div>
  );
};

const HeroStat = ({ label, value }) => (
  <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
    <p className="text-xl font-black tracking-tight">{value}</p>
    <p className="text-[10px] text-[var(--app-muted)] font-black uppercase tracking-widest mt-1">
      {label}
    </p>
  </div>
);

const PreviewRow = ({ icon: Icon, title, value, progress }) => (
  <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-2)] p-4">
    <div className="flex items-center gap-3 mb-3">
      <div className="h-9 w-9 rounded-xl bg-[var(--app-surface)] border border-[var(--app-border)] flex items-center justify-center">
        <Icon size={16} className="text-[var(--app-accent)]" />
      </div>

      <div className="min-w-0">
        <p className="font-black truncate">{title}</p>
        <p className="text-xs text-[var(--app-muted)] truncate">{value}</p>
      </div>
    </div>

    <div className="h-2 rounded-full bg-[var(--app-surface)] border border-[var(--app-border)] overflow-hidden">
      <div
        className="h-full bg-[var(--app-accent)] rounded-full"
        style={{ width: `${progress}%` }}
      />
    </div>
  </div>
);

const FeatureCard = ({ icon: Icon, title, text }) => (
  <div className="app-card p-6 hover:border-[var(--app-accent)] transition-all">
    <div className="h-12 w-12 rounded-2xl bg-[var(--app-accent)]/10 border border-[var(--app-accent)]/20 flex items-center justify-center mb-5">
      <Icon size={22} className="text-[var(--app-accent)]" />
    </div>

    <h3 className="text-lg font-black tracking-tight mb-3">{title}</h3>
    <p className="text-sm text-[var(--app-muted)] leading-7">{text}</p>
  </div>
);

const Benefit = ({ text }) => (
  <div className="flex items-start gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-2)] p-4">
    <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
    <p className="text-sm text-[var(--app-muted)] leading-6">{text}</p>
  </div>
);

export default Home;