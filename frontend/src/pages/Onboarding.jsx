import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { syncLeetCode, syncCodeforces, syncCodechef, syncGitHub } from "../api/stats";
import { AlertCircle, CheckCircle2, Code2, ExternalLink, Github, Loader2, RefreshCw, ShieldCheck, SkipForward, Trophy, UserCheck, Utensils, Layers } from "lucide-react";

const platforms = [
  { key: "leetcode", label: "LeetCode", field: "leetcodeHandle", placeholder: "username", icon: Code2, sync: syncLeetCode },
  { key: "codeforces", label: "Codeforces", field: "codeforcesHandle", placeholder: "handle", icon: Trophy, sync: syncCodeforces },
  { key: "codechef", label: "CodeChef", field: "codechefHandle", placeholder: "username", icon: Utensils, sync: syncCodechef },
  { key: "github", label: "GitHub", field: "githubHandle", placeholder: "username", icon: Github, sync: syncGitHub },
];

const initialHandles = platforms.reduce((acc, p) => ({ ...acc, [p.key]: "" }), {});

const Onboarding = () => {
  const navigate = useNavigate();
  const [handles, setHandles] = useState(initialHandles);
  const [status, setStatus] = useState({});
  const [saving, setSaving] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const filledPlatforms = useMemo(() => platforms.filter((p) => handles[p.key]?.trim()), [handles]);
  const completedCount = useMemo(() => Object.values(status).filter((s) => s?.state === "synced").length, [status]);

  const setPlatformStatus = (platformKey, nextStatus) => setStatus((prev) => ({ ...prev, [platformKey]: { ...prev[platformKey], ...nextStatus } }));

  const updateHandle = (platformKey, value) => {
    setHandles((prev) => ({ ...prev, [platformKey]: value }));
    setStatus((prev) => ({ ...prev, [platformKey]: undefined }));
    setNotice(""); setError("");
  };

  const validateHandle = async (platform) => {
    const handle = handles[platform.key]?.trim();
    if (!handle) { setPlatformStatus(platform.key, { state: "idle", message: "Enter username." }); return false; }

    setPlatformStatus(platform.key, { state: "validating", message: "Checking..." });
    try {
      const res = await api.get("/profile/validate", { params: { platform: platform.key, handle } });
      const isValid = res.data?.valid || res.data?.exists || res.data?.success || res.data?.status === "valid" || res.data?.status === "Linked";
      if (!isValid) throw new Error(res.data?.message || "Not found.");
      
      setPlatformStatus(platform.key, { state: "valid", message: "Verified." });
      return true;
    } catch (err) {
      setPlatformStatus(platform.key, { state: "error", message: "Validation failed." });
      return false;
    }
  };

  const saveHandlesToProfile = async () => {
    const payload = {};
    platforms.forEach((p) => { if (handles[p.key]?.trim()) payload[p.field] = handles[p.key].trim(); });
    if (Object.keys(payload).length === 0) return false;
    await api.post("/profile", payload);
    return true;
  };

  const syncPlatform = async (platform) => {
    const handle = handles[platform.key]?.trim();
    if (!handle) return;
    setError(""); setNotice("");

    const valid = await validateHandle(platform);
    if (!valid) return;

    setPlatformStatus(platform.key, { state: "saving", message: "Saving..." });
    try {
      // 1. Save handle first
      await api.post("/profile", { [platform.field]: handle });
      
      // 2. WAIT a moment for MongoDB to process the write
      await new Promise(resolve => setTimeout(resolve, 800)); 

      // 3. Now trigger sync
      setPlatformStatus(platform.key, { state: "syncing", message: "Syncing..." });
      await platform.sync();
      
      setPlatformStatus(platform.key, { state: "synced", message: "Linked." });
      setNotice(`${platform.label} linked successfully.`);
    } catch (err) {
      setPlatformStatus(platform.key, { state: "error", message: "Sync failed." });
    }
  };

  const validateAll = async () => {
    setError(""); setNotice("");
    if (filledPlatforms.length === 0) return setError("Enter at least one username.");
    for (const platform of filledPlatforms) await validateHandle(platform);
  };

  const syncAllEntered = async () => {
    setError(""); setNotice("");
    if (filledPlatforms.length === 0) return setError("Enter at least one username.");
    setSyncingAll(true);
    try {
      // 1. Bulk save
      await saveHandlesToProfile();
      
      // 2. WAIT for bulk write to settle
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 3. Sync one by one
      for (const platform of filledPlatforms) {
        await platform.sync();
        setPlatformStatus(platform.key, { state: "synced", message: "Linked." });
      }
      setNotice("Platforms synced. You can manage them later in settings.");
    } finally { setSyncingAll(false); }
  };

  const finishOnboarding = async () => {
    setSaving(true); setError("");
    try {
      if (filledPlatforms.length > 0) await saveHandlesToProfile();
      localStorage.removeItem("onboardingPending");
      navigate("/dashboard", { replace: true });
    } catch (err) { setError("Could not save onboarding data."); } 
    finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      <main className="max-w-5xl mx-auto px-6 py-10 md:py-16">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">CG</div>
            <div>
              <p className="text-sm font-bold text-white tracking-tight">Career Guru</p>
              <p className="text-xs text-zinc-500 font-medium">Workspace Setup</p>
            </div>
          </div>
          <button onClick={() => { localStorage.removeItem("onboardingPending"); navigate("/dashboard", { replace: true }); }} className="text-xs font-semibold text-zinc-500 hover:text-white flex items-center gap-1.5 transition-colors">
            Skip Setup <SkipForward size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight mb-3">Link Accounts</h1>
              <p className="text-sm text-zinc-400 leading-relaxed font-medium">
                Connect your platforms to generate coding metrics, task boards, and a unified public portfolio. 
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.04] bg-zinc-900/30 p-5 space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-white/[0.04]">
                <span className="text-sm font-medium text-zinc-400">Total Entered</span>
                <span className="text-base font-bold text-white">{filledPlatforms.length} / {platforms.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-zinc-400">Sync Complete</span>
                <span className="text-base font-bold text-emerald-400">{completedCount}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl border border-white/[0.04] bg-zinc-900/40 p-6 md:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-lg font-bold text-white">Platform Handles</h2>
                <div className="flex gap-2">
                  <button onClick={validateAll} disabled={syncingAll || saving} className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-semibold hover:bg-zinc-700 disabled:opacity-50">Validate</button>
                  <button onClick={syncAllEntered} disabled={syncingAll || saving} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 disabled:opacity-50 flex items-center gap-2">
                    {syncingAll ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Sync Selected
                  </button>
                </div>
              </div>

              {notice && <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-400 flex items-center gap-2"><CheckCircle2 size={16} />{notice}</div>}
              {error && <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400 flex items-center gap-2"><AlertCircle size={16} />{error}</div>}

              <div className="space-y-4">
                {platforms.map((platform) => (
                  <PlatformInputCard key={platform.key} platform={platform} handle={handles[platform.key]} status={status[platform.key]} onChange={(val) => updateHandle(platform.key, val)} onValidate={() => validateHandle(platform)} onSync={() => syncPlatform(platform)} />
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-white/[0.04] flex items-center justify-end">
                <button onClick={finishOnboarding} disabled={saving || syncingAll} className="px-6 py-3 rounded-xl bg-white text-zinc-950 text-sm font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50">
                  {saving ? "Saving..." : "Go to Dashboard"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const PlatformInputCard = ({ platform, handle, status, onChange, onValidate, onSync }) => {
  const Icon = platform.icon;
  const isBusy = ["validating", "saving", "syncing"].includes(status?.state);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-white/[0.04] bg-zinc-900/50 p-4">
      <div className="flex items-center gap-3 sm:w-40 shrink-0">
        <Icon size={18} className="text-zinc-400" />
        <p className="text-sm font-semibold text-zinc-200">{platform.label}</p>
      </div>
      <div className="flex-1">
        <input value={handle} onChange={(e) => onChange(e.target.value)} placeholder={platform.placeholder} className="w-full bg-zinc-950 border border-white/[0.05] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50 transition-colors" />
        {status?.message && (
          <p className={`text-xs mt-1.5 font-medium ${status.state === "error" ? "text-red-400" : status.state === "synced" ? "text-emerald-400" : "text-zinc-500"}`}>{status.message}</p>
        )}
      </div>
      <div className="flex items-center gap-2 sm:w-auto">
        <button onClick={onValidate} disabled={isBusy} className="px-3 py-2 rounded-lg bg-zinc-800 text-zinc-400 text-xs font-semibold hover:text-white transition-colors disabled:opacity-50">
           Validate
        </button>
        <button onClick={onSync} disabled={isBusy} className="px-3 py-2 rounded-lg bg-zinc-800 text-zinc-400 text-xs font-semibold hover:text-white transition-colors disabled:opacity-50">
          {status?.state === "synced" ? "Linked" : "Sync"}
        </button>
      </div>
    </div>
  );
};

export default Onboarding;