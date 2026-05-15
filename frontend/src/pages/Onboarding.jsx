import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import {
  syncLeetCode,
  syncCodeforces,
  syncCodechef,
  syncGitHub,
} from "../api/stats";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Code2,
  ExternalLink,
  Github,
  Loader2,
  RefreshCw,
  ShieldCheck,
  SkipForward,
  Sparkles,
  Trophy,
  UserCheck,
  Utensils,
  Zap,
} from "lucide-react";

const platforms = [
  {
    key: "leetcode",
    label: "LeetCode",
    field: "leetcodeHandle",
    placeholder: "leetcode_username",
    icon: Code2,
    sync: syncLeetCode,
    profileUrl: (handle) => `https://leetcode.com/u/${handle}/`,
    tone: "text-[var(--app-accent)]",
  },
  {
    key: "codeforces",
    label: "Codeforces",
    field: "codeforcesHandle",
    placeholder: "codeforces_handle",
    icon: Trophy,
    sync: syncCodeforces,
    profileUrl: (handle) => `https://codeforces.com/profile/${handle}`,
    tone: "text-blue-500",
  },
  {
    key: "codechef",
    label: "CodeChef",
    field: "codechefHandle",
    placeholder: "codechef_handle",
    icon: Utensils,
    sync: syncCodechef,
    profileUrl: (handle) => `https://www.codechef.com/users/${handle}`,
    tone: "text-orange-500",
  },
  {
    key: "github",
    label: "GitHub",
    field: "githubHandle",
    placeholder: "github_username",
    icon: Github,
    sync: syncGitHub,
    profileUrl: (handle) => `https://github.com/${handle}`,
    tone: "text-[var(--app-text)]",
  },
];

const initialHandles = platforms.reduce((acc, platform) => {
  acc[platform.key] = "";
  return acc;
}, {});

const Onboarding = () => {
  const navigate = useNavigate();

  const [handles, setHandles] = useState(initialHandles);
  const [status, setStatus] = useState({});
  const [saving, setSaving] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const filledPlatforms = useMemo(() => {
    return platforms.filter((platform) => handles[platform.key]?.trim());
  }, [handles]);

  const completedCount = useMemo(() => {
    return Object.values(status).filter((item) => item?.state === "synced")
      .length;
  }, [status]);

  const setPlatformStatus = (platformKey, nextStatus) => {
    setStatus((prev) => ({
      ...prev,
      [platformKey]: {
        ...(prev[platformKey] || {}),
        ...nextStatus,
      },
    }));
  };

  const updateHandle = (platformKey, value) => {
    setHandles((prev) => ({
      ...prev,
      [platformKey]: value,
    }));

    setStatus((prev) => ({
      ...prev,
      [platformKey]: undefined,
    }));

    setNotice("");
    setError("");
  };

  const validateHandle = async (platform) => {
    const handle = handles[platform.key]?.trim();

    if (!handle) {
      setPlatformStatus(platform.key, {
        state: "idle",
        message: "Enter username first.",
      });
      return false;
    }

    setPlatformStatus(platform.key, {
      state: "validating",
      message: "Checking username...",
    });

    try {
      const res = await api.get("/profile/validate", {
        params: {
          platform: platform.key,
          handle,
        },
      });

      const isValid =
        res.data?.valid === true ||
        res.data?.exists === true ||
        res.data?.success === true ||
        res.data?.status === "valid" ||
        res.data?.status === "Linked";

      if (!isValid) {
        throw new Error(
          res.data?.message || `${platform.label} username not found.`
        );
      }

      setPlatformStatus(platform.key, {
        state: "valid",
        message: "Username verified.",
      });

      return true;
    } catch (err) {
      setPlatformStatus(platform.key, {
        state: "error",
        message:
          err.response?.data?.message ||
          err.message ||
          `${platform.label} validation failed.`,
      });

      return false;
    }
  };

  const saveHandlesToProfile = async () => {
    const payload = {};

    platforms.forEach((platform) => {
      const handle = handles[platform.key]?.trim();

      if (handle) {
        payload[platform.field] = handle;
      }
    });

    if (Object.keys(payload).length === 0) {
      return false;
    }

    await api.post("/profile", payload);
    return true;
  };

  const syncPlatform = async (platform) => {
    const handle = handles[platform.key]?.trim();

    if (!handle) {
      setPlatformStatus(platform.key, {
        state: "idle",
        message: "Enter username first.",
      });
      return;
    }

    setError("");
    setNotice("");

    const valid = await validateHandle(platform);

    if (!valid) return;

    setPlatformStatus(platform.key, {
      state: "saving",
      message: "Saving username...",
    });

    try {
      await api.post("/profile", {
        [platform.field]: handle,
      });

      setPlatformStatus(platform.key, {
        state: "syncing",
        message: "Syncing stats...",
      });

      await platform.sync();

      setPlatformStatus(platform.key, {
        state: "synced",
        message: "Linked and synced.",
      });

      setNotice(`${platform.label} linked successfully.`);
    } catch (err) {
      setPlatformStatus(platform.key, {
        state: "error",
        message:
          err.response?.data?.message ||
          err.message ||
          `${platform.label} sync failed.`,
      });
    }
  };

  const validateAll = async () => {
    setError("");
    setNotice("");

    if (filledPlatforms.length === 0) {
      setError("Enter at least one username or skip this step.");
      return;
    }

    for (const platform of filledPlatforms) {
      await validateHandle(platform);
    }
  };

  const syncAllEntered = async () => {
    setError("");
    setNotice("");

    if (filledPlatforms.length === 0) {
      setError("Enter at least one username or skip this step.");
      return;
    }

    setSyncingAll(true);

    try {
      await saveHandlesToProfile();

      for (const platform of filledPlatforms) {
        await syncPlatform(platform);
      }

      setNotice(
        "Selected platforms synced. You can add more later from Profile Settings."
      );
    } finally {
      setSyncingAll(false);
    }
  };

  const continueToDashboard = async () => {
    setSaving(true);
    setError("");

    try {
      if (filledPlatforms.length > 0) {
        await saveHandlesToProfile();
      }

      localStorage.removeItem("onboardingPending");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Could not save onboarding data.");
    } finally {
      setSaving(false);
    }
  };

  const skipOnboarding = () => {
    localStorage.removeItem("onboardingPending");
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--app-text)] relative overflow-hidden">
      <div className="absolute -top-44 -left-44 h-96 w-96 rounded-full bg-[var(--app-accent)]/10 blur-3xl" />
      <div className="absolute -bottom-44 -right-44 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-5 md:py-8">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[var(--app-accent)] text-zinc-950 flex items-center justify-center font-black text-sm shadow-sm">
              CG
            </div>

            <div>
              <p className="text-sm font-black tracking-tight leading-none">
                Career Guru
              </p>
              <p className="text-[9px] text-[var(--app-faint)] font-bold uppercase tracking-[0.16em] mt-1">
                Onboarding
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={skipOnboarding}
            className="app-btn-secondary px-3 py-2 text-[10px] uppercase tracking-widest"
          >
            <SkipForward size={12} />
            Skip
          </button>
        </div>

        <section className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          <div className="xl:col-span-4 space-y-4">
            <div className="app-card p-5 md:p-6 overflow-hidden relative">
              <div className="absolute -top-20 -right-20 h-52 w-52 rounded-full bg-[var(--app-accent)]/10 blur-3xl" />

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-[var(--app-surface-2)] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-[var(--app-muted)] mb-4">
                  <Sparkles size={12} className="text-[var(--app-accent)]" />
                  Flexible Setup
                </div>

                <h1 className="text-3xl md:text-4xl font-black tracking-tighter leading-none mb-4">
                  Connect your coding profiles.
                </h1>

                <p className="text-sm text-[var(--app-muted)] leading-6 mb-4">
                  Add usernames for the platforms you use. Career Guru will
                  validate and sync your stats for dashboards, AI planning, and
                  public portfolio.
                </p>

                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3 flex items-start gap-2.5">
                  <ShieldCheck size={15} className="text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-[var(--app-muted)] leading-5">
                    This step is optional. You can skip now and sync platforms
                    later from Profile Settings.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <SmallStat label="Entered" value={filledPlatforms.length} />
              <SmallStat label="Synced" value={completedCount} />
              <SmallStat label="Total" value={platforms.length} />
            </div>

            <div className="app-card p-4">
              <h2 className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--app-muted)] mb-3">
                What this unlocks
              </h2>

              <div className="space-y-2.5">
                <Benefit text="Live coding analytics." />
                <Benefit text="Weak topic detection." />
                <Benefit text="Contest and rating tracking." />
                <Benefit text="Public portfolio platform links." />
              </div>
            </div>
          </div>

          <div className="xl:col-span-8">
            <div className="app-card p-4 md:p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
                <div>
                  <p className="text-[9px] text-[var(--app-accent)] font-black uppercase tracking-[0.2em] mb-1.5">
                    Platform Setup
                  </p>
                  <h2 className="text-xl md:text-2xl font-black tracking-tight">
                    Validate and Sync Usernames
                  </h2>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={validateAll}
                    disabled={syncingAll || saving}
                    className="app-btn-secondary px-3 py-2 text-[10px] uppercase tracking-widest"
                  >
                    <UserCheck size={12} />
                    Validate All
                  </button>

                  <button
                    type="button"
                    onClick={syncAllEntered}
                    disabled={syncingAll || saving}
                    className="app-btn-primary px-3 py-2 text-[10px] uppercase tracking-widest"
                  >
                    {syncingAll ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        Syncing
                      </>
                    ) : (
                      <>
                        <RefreshCw size={12} />
                        Sync Entered
                      </>
                    )}
                  </button>
                </div>
              </div>

              {notice && (
                <div className="mb-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-500 flex items-center gap-2">
                  <CheckCircle2 size={14} />
                  {notice}
                </div>
              )}

              {error && (
                <div className="mb-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-500 flex items-center gap-2">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <div className="space-y-3">
                {platforms.map((platform) => (
                  <PlatformInputCard
                    key={platform.key}
                    platform={platform}
                    handle={handles[platform.key]}
                    status={status[platform.key]}
                    onChange={(value) => updateHandle(platform.key, value)}
                    onValidate={() => validateHandle(platform)}
                    onSync={() => syncPlatform(platform)}
                  />
                ))}
              </div>

              <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[var(--app-border)] pt-4">
                <p className="text-xs text-[var(--app-muted)] leading-5">
                  Not ready with your handles? Skip now and complete setup later.
                </p>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={skipOnboarding}
                    className="app-btn-secondary px-4 py-2.5 text-[10px] uppercase tracking-widest"
                  >
                    Skip for Now
                  </button>

                  <button
                    type="button"
                    onClick={continueToDashboard}
                    disabled={saving || syncingAll}
                    className="app-btn-primary px-4 py-2.5 text-[10px] uppercase tracking-widest"
                  >
                    {saving ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        Saving
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight size={12} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

const PlatformInputCard = ({
  platform,
  handle,
  status,
  onChange,
  onValidate,
  onSync,
}) => {
  const Icon = platform.icon;
  const currentState = status?.state || "idle";
  const isBusy = ["validating", "saving", "syncing"].includes(currentState);
  const profileLink = handle?.trim() ? platform.profileUrl(handle.trim()) : "";

  return (
    <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-2)] p-3">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="flex items-center gap-2.5 min-w-0 lg:w-40">
          <div className="h-9 w-9 rounded-xl bg-[var(--app-surface)] border border-[var(--app-border)] flex items-center justify-center shrink-0">
            <Icon size={15} className={platform.tone} />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-black truncate">{platform.label}</p>
            <p className="text-[9px] text-[var(--app-faint)] font-bold uppercase tracking-widest">
              Username
            </p>
          </div>
        </div>

        <div className="flex-1">
          <input
            value={handle}
            onChange={(e) => onChange(e.target.value)}
            placeholder={platform.placeholder}
            className="app-input px-3 py-2.5 text-xs"
          />

          {status?.message && (
            <p
              className={`text-[11px] mt-1.5 ${
                currentState === "error"
                  ? "text-red-500"
                  : currentState === "synced"
                  ? "text-emerald-500"
                  : "text-[var(--app-muted)]"
              }`}
            >
              {status.message}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 lg:w-56 lg:justify-end">
          {profileLink && (
            <a
              href={profileLink}
              target="_blank"
              rel="noreferrer"
              className="h-9 w-9 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-muted)] hover:text-[var(--app-text)] flex items-center justify-center"
              title={`Open ${platform.label}`}
            >
              <ExternalLink size={13} />
            </a>
          )}

          <button
            type="button"
            onClick={onValidate}
            disabled={isBusy}
            className="app-btn-secondary px-3 py-2 text-[10px] uppercase tracking-widest"
          >
            {currentState === "validating" ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <UserCheck size={12} />
            )}
            Validate
          </button>

          <button
            type="button"
            onClick={onSync}
            disabled={isBusy}
            className="app-btn-primary px-3 py-2 text-[10px] uppercase tracking-widest"
          >
            {currentState === "syncing" || currentState === "saving" ? (
              <Loader2 size={12} className="animate-spin" />
            ) : currentState === "synced" ? (
              <CheckCircle2 size={12} />
            ) : (
              <RefreshCw size={12} />
            )}
            {currentState === "synced" ? "Synced" : "Sync"}
          </button>
        </div>
      </div>
    </div>
  );
};

const SmallStat = ({ label, value }) => (
  <div className="app-card p-3">
    <p className="text-xl font-black tracking-tight">{value}</p>
    <p className="text-[9px] text-[var(--app-muted)] font-black uppercase tracking-widest mt-0.5">
      {label}
    </p>
  </div>
);

const Benefit = ({ text }) => (
  <div className="flex items-start gap-2">
    <Zap size={12} className="text-[var(--app-accent)] shrink-0 mt-1" />
    <p className="text-xs text-[var(--app-muted)] leading-5">{text}</p>
  </div>
);

export default Onboarding;