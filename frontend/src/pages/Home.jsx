import { useContext } from "react";
import { Link, Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";
import { 
  ArrowRight, BarChart3, CheckCircle2, Code2, FileText, Github, 
  GraduationCap, Moon, ShieldCheck, Sun, Trophy, Activity, Target, Layers
} from "lucide-react";

const Home = () => {
  const { user, loading } = useContext(AuthContext);
  const { darkMode, toggleTheme } = useContext(ThemeContext);

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--app-text)] font-sans selection:bg-[var(--app-accent)]/30 overflow-hidden">
      
      {/* Background Glow (Kept subtle for professional feel) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-[var(--app-accent)]/5 blur-3xl" />
        <div className="absolute top-20 -right-40 h-96 w-96 rounded-full bg-[var(--app-accent)]/5 blur-3xl" />
      </div>

      <nav className="relative z-50 border-b border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-bg)_86%,transparent)] backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-[var(--app-accent)] text-zinc-950 flex items-center justify-center font-bold shadow-sm">
              CG
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight text-[var(--app-text)] leading-none">
                Career Guru
              </p>
              <p className="text-xs text-[var(--app-muted)] font-medium mt-1">
                Career Operating System
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-surface-2)] transition-colors"
              title="Toggle theme"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link
              to="/login"
              className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-[var(--app-muted)] hover:text-[var(--app-text)] transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="app-btn-primary px-4 py-2 text-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        <section className="mx-auto max-w-7xl px-6 pt-20 pb-16 lg:pt-32 lg:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--app-accent)]/20 bg-[var(--app-accent)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--app-accent)] mb-6">
                <Target size={14} />
                Built for Software Engineering Prep
              </div>

              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-[var(--app-text)] leading-tight mb-6">
                Your personal engineering <br/>
                <span className="text-[var(--app-accent)]">command center.</span>
              </h1>

              <p className="text-lg text-[var(--app-muted)] leading-relaxed max-w-2xl mb-8">
                Career Guru unifies your coding analytics, study planning, resume tracking,
                GitHub insights, and public portfolio into one professional workspace.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link
                  to="/register"
                  className="app-btn-primary px-6 py-3.5 text-sm"
                >
                  Start for free
                  <ArrowRight size={18} />
                </Link>
                <Link
                  to="/login"
                  className="app-btn-secondary px-6 py-3.5 text-sm"
                >
                  Sign in to workspace
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl">
                <HeroStat label="Analytics" value="Live" />
                <HeroStat label="Task Board" value="Curated" />
                <HeroStat label="Resume Vault" value="Scored" />
                <HeroStat label="Portfolio" value="Public" />
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="app-card p-6">
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-[var(--app-text)] tracking-tight">
                      Platform Overview
                    </h2>
                    <p className="text-sm text-[var(--app-muted)] font-medium mt-1">
                      Everything you need in one place
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--app-surface-2)] border border-[var(--app-border)]">
                    <Layers size={20} className="text-[var(--app-accent)]" />
                  </div>
                </div>

                <div className="space-y-3">
                  <PreviewRow icon={Code2} title="Coding Analytics" value="LeetCode, Codeforces, CodeChef" progress={85} />
                  <PreviewRow icon={GraduationCap} title="Study Board" value="Track actionable tasks & progress" progress={65} />
                  <PreviewRow icon={FileText} title="Resume Reports" value="ATS scoring and role alignment" progress={75} />
                  <PreviewRow icon={Github} title="Project Showcase" value="GitHub stats and public profile" progress={50} />
                </div>

                <div className="mt-6 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-2)] p-4 flex items-start gap-3">
                  <Activity size={18} className="text-[var(--app-accent)] shrink-0 mt-0.5" />
                  <p className="text-sm text-[var(--app-muted)] leading-relaxed font-medium">
                    Convert weak topics, coding activity, and resume gaps into a clear, structured preparation roadmap.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 border-t border-[var(--app-border)]">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <FeatureCard
              icon={BarChart3}
              title="Coding Intelligence"
              text="Sync coding platforms to visualize problem distribution, streaks, heatmaps, and rating trends."
            />
            <FeatureCard
              icon={Layers}
              title="Study Board"
              text="Manage a clear task backlog and generate actionable learning paths for complex topics."
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Resume Vault"
              text="Upload PDFs to test ATS compatibility, role alignment, and receive actionable formatting advice."
            />
            <FeatureCard
              icon={Trophy}
              title="Public Portfolio"
              text="Share a professional link highlighting your aggregate coding stats, GitHub repositories, and overall readiness."
            />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 border-t border-[var(--app-border)]">
          <div className="app-card p-8 md:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-[var(--app-text)] tracking-tight mb-4">
                  A structured approach to preparation.
                </h2>
                <p className="text-[var(--app-muted)] leading-relaxed text-lg">
                  Stop tracking your DSA progress, resumes, and projects across scattered spreadsheets. 
                  Career Guru unites your data to give you a clear, measurable roadmap to your next role.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Benefit text="Identify weak topics from live data" />
                <Benefit text="Generate targeted study plans" />
                <Benefit text="Score your resume against JDs" />
                <Benefit text="Consolidate your public portfolio" />
                <Benefit text="Track rating & contest growth" />
                <Benefit text="Showcase GitHub projects cleanly" />
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 py-24 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--app-text)] tracking-tight mb-6">
            Ready to build your profile?
          </h2>
          <p className="text-lg text-[var(--app-muted)] mb-8">
            Create an account, connect your handles, and start tracking your preparation.
          </p>
          <Link
            to="/register"
            className="app-btn-primary px-8 py-3.5 text-base"
          >
            Create an Account
            <ArrowRight size={18} />
          </Link>
        </section>
      </main>

      <footer className="border-t border-[var(--app-border)] bg-[var(--app-bg)] relative z-10">
        <div className="mx-auto max-w-7xl px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[var(--app-faint)] font-medium">
          <p>© {new Date().getFullYear()} Career Guru.</p>
          <p>Professional engineering preparation workspace.</p>
        </div>
      </footer>
    </div>
  );
};

const HeroStat = ({ label, value }) => (
  <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 text-center">
    <p className="text-xl font-bold text-[var(--app-text)] tracking-tight mb-1">{value}</p>
    <p className="text-xs text-[var(--app-muted)] font-semibold uppercase tracking-wider">
      {label}
    </p>
  </div>
);

const PreviewRow = ({ icon: Icon, title, value, progress }) => (
  <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-2)] p-4">
    <div className="flex items-center gap-3 mb-3">
      <div className="p-2 rounded-lg bg-[var(--app-surface)] border border-[var(--app-border)]">
        <Icon size={16} className="text-[var(--app-accent)]" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-[var(--app-text)] truncate">{title}</p>
        <p className="text-xs text-[var(--app-muted)] font-medium truncate">{value}</p>
      </div>
    </div>
    <div className="h-1.5 rounded-full bg-[var(--app-surface)] overflow-hidden border border-[var(--app-border)]">
      <div className="h-full bg-[var(--app-accent)] rounded-full" style={{ width: `${progress}%` }} />
    </div>
  </div>
);

const FeatureCard = ({ icon: Icon, title, text }) => (
  <div className="app-card p-6 hover:border-[var(--app-accent)] transition-colors">
    <div className="w-10 h-10 rounded-lg bg-[var(--app-accent)]/10 border border-[var(--app-accent)]/20 flex items-center justify-center mb-5">
      <Icon size={20} className="text-[var(--app-accent)]" />
    </div>
    <h3 className="text-base font-bold text-[var(--app-text)] tracking-tight mb-2">{title}</h3>
    <p className="text-sm text-[var(--app-muted)] leading-relaxed font-medium">{text}</p>
  </div>
);

const Benefit = ({ text }) => (
  <div className="flex items-start gap-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-2)] p-4">
    <CheckCircle2 size={18} className="text-[var(--app-success)] shrink-0 mt-0.5" />
    <p className="text-sm text-[var(--app-text)] font-medium">{text}</p>
  </div>
);

export default Home;