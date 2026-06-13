import { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import api from "../api/axios";
import { getDashboard, syncAllPlatforms } from "../api/stats";
import { CheckCircle, XCircle, RefreshCw, ExternalLink, User, Github, Code, Loader2, AlertCircle, Save } from "lucide-react";

const platformConfig = {
  github: { label: "GitHub", handleKey: "githubHandle", icon: <Github size={16} /> },
  leetcode: { label: "LeetCode", handleKey: "leetcodeHandle", icon: <Code size={16} /> },
  codeforces: { label: "Codeforces", handleKey: "codeforcesHandle", icon: <Code size={16} /> },
  codechef: { label: "CodeChef", handleKey: "codechefHandle", icon: <Code size={16} /> },
};

const emptyProfile = { name: "", username: "", bio: "", avatar: "", skills: [], leetcodeHandle: "", codeforcesHandle: "", githubHandle: "", codechefHandle: "", linkedinUrl: "", isPublic: false };

const Profile = () => {
  const [profile, setProfile] = useState(emptyProfile);
  const [originalHandles, setOriginalHandles] = useState({ github: "", leetcode: "", codeforces: "", codechef: "" });
  const [platformStatus, setPlatformStatus] = useState({ github: "Pending Sync", leetcode: "Pending Sync", codeforces: "Pending Sync", codechef: "Pending Sync" });
  const [platformErrors, setPlatformErrors] = useState({});
  const [validationStatus, setValidationStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState([]);
  const [notif, setNotif] = useState({ msg: "", type: "" });

  const showNotif = (msg, type = "success") => { setNotif({ msg, type }); setTimeout(() => setNotif({ msg: "", type: "" }), 3500); };
  const getHandlesFromProfile = (data) => ({ github: data?.githubHandle || "", leetcode: data?.leetcodeHandle || "", codeforces: data?.codeforcesHandle || "", codechef: data?.codechefHandle || "" });

  const loadProfileAndStatuses = async () => {
    try {
      const profileRes = await api.get("/profile");
      if (profileRes.data) {
        const nextProfile = { ...emptyProfile, ...profileRes.data, skills: Array.isArray(profileRes.data.skills) ? profileRes.data.skills : [] };
        setProfile(nextProfile); setOriginalHandles(getHandlesFromProfile(nextProfile));
      }
    } catch (err) { console.error(err); }

    try {
      const dashboardData = await getDashboard();
      const platforms = dashboardData?.platforms || {};
      setPlatformStatus({ github: platforms.github?.status || "Pending Sync", leetcode: platforms.leetcode?.status || "Pending Sync", codeforces: platforms.codeforces?.status || "Pending Sync", codechef: platforms.codechef?.status || "Pending Sync" });
      setPlatformErrors({ github: platforms.github?.error || "", leetcode: platforms.leetcode?.error || "", codeforces: platforms.codeforces?.error || "", codechef: platforms.codechef?.error || "" });
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadProfileAndStatuses(); }, []);

  const markHandleChanged = (platform, value) => {
    const handleKey = platformConfig[platform].handleKey;
    setProfile((prev) => ({ ...prev, [handleKey]: value }));
    const oldHandle = originalHandles[platform] || "";
    if ((value || "").trim() !== oldHandle.trim()) {
      setValidationStatus((prev) => ({ ...prev, [platform]: (value || "").trim() ? "needs-validation" : "" }));
      setPlatformStatus((prev) => ({ ...prev, [platform]: (value || "").trim() ? "Needs Sync" : "Pending Sync" }));
    }
  };

  const handleValidate = async (platform, handle) => {
    const cleanHandle = handle?.trim();
    if (!cleanHandle) {
      setValidationStatus((prev) => ({ ...prev, [platform]: "" }));
      setPlatformStatus((prev) => ({ ...prev, [platform]: "Pending Sync" }));
      return false;
    }
    setValidationStatus((prev) => ({ ...prev, [platform]: "validating" }));
    try {
      const res = await api.get("/profile/validate", { params: { platform, handle: cleanHandle } });
      if (res.data?.valid) {
        setValidationStatus((prev) => ({ ...prev, [platform]: "valid" }));
        setPlatformStatus((prev) => ({ ...prev, [platform]: "Validated" }));
        setPlatformErrors((prev) => ({ ...prev, [platform]: "" }));
        return true;
      }
      throw new Error(res.data?.message || "Invalid handle");
    } catch (err) {
      setValidationStatus((prev) => ({ ...prev, [platform]: "invalid" }));
      setPlatformStatus((prev) => ({ ...prev, [platform]: "Error" }));
      setPlatformErrors((prev) => ({ ...prev, [platform]: err.message || err.response?.data?.message || "Handle not found" }));
      return false;
    }
  };

  const validateChangedHandles = async () => {
    const changed = Object.keys(platformConfig).filter(p => (profile[platformConfig[p].handleKey]?.trim() || "") && (profile[platformConfig[p].handleKey]?.trim() || "") !== (originalHandles[p]?.trim() || ""));
    if (!changed.length) return true;
    const results = await Promise.all(changed.map((p) => handleValidate(p, profile[platformConfig[p].handleKey])));
    return results.every(Boolean);
  };

  const saveProfileOnly = async () => {
    const payload = { ...profile, name: profile.name.trim(), username: profile.username.trim().toLowerCase(), linkedinUrl: profile.linkedinUrl.trim() };
    const res = await api.post("/profile", payload);
    const savedProfile = { ...emptyProfile, ...res.data.profile, skills: Array.isArray(res.data.profile?.skills) ? res.data.profile.skills : [] };
    setProfile(savedProfile); setOriginalHandles(getHandlesFromProfile(savedProfile));
    return savedProfile;
  };

  const runSync = async () => {
    setSyncing(true); setSyncResults([]);
    try {
      const syncRes = await syncAllPlatforms();
      const results = syncRes?.results || [];
      setSyncResults(results);
      const nextStatus = { ...platformStatus };
      const nextErrors = { ...platformErrors };
      results.forEach((item) => {
        if (!item.platform) return;
        nextStatus[item.platform] = item.success ? "Linked" : "Error";
        nextErrors[item.platform] = item.error || item.data?.error || "";
      });
      setPlatformStatus(nextStatus); setPlatformErrors(nextErrors);
      await loadProfileAndStatuses();
      const failed = results.filter((item) => !item.success);
      if (failed.length) showNotif("Sync completed, but some platforms failed.", "error");
      else showNotif("Profile saved and platforms synced.", "success");
    } catch (err) {
      setSyncResults([{ success: false, platform: "sync", error: err.response?.data?.message || "Sync failed." }]);
      showNotif("Profile saved, but sync failed.", "error");
    } finally { setSyncing(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!profile.username.trim()) return showNotif("Username is required.", "error");
    setLoading(true); setSyncResults([]);
    try {
      if (!(await validateChangedHandles())) return showNotif("Fix invalid handles before syncing.", "error");
      await saveProfileOnly();
      await runSync();
    } catch (err) { showNotif(err.response?.data?.message || "Save failed", "error"); } 
    finally { setLoading(false); }
  };

  const handleManualSync = async () => {
    setLoading(true);
    try {
      if (!(await validateChangedHandles())) return showNotif("Fix invalid handles.", "error");
      await saveProfileOnly();
      await runSync();
    } catch (err) { showNotif("Manual sync failed.", "error"); } 
    finally { setLoading(false); }
  };

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8 animate-fadeIn">
        
        {/* Header Profile Section */}
        <header className="flex flex-col md:flex-row items-center gap-6 bg-zinc-900/40 p-8 rounded-3xl shadow-sm border border-white/[0.04]">
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-full bg-zinc-800 overflow-hidden border-4 border-zinc-950 shadow-md">
              {profile.avatar ? <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" /> : <User className="w-full h-full p-5 text-zinc-500" />}
            </div>
            {profile.avatar && <div className="absolute bottom-1 right-1 bg-emerald-500 w-5 h-5 rounded-full border-2 border-zinc-950" title="Avatar synced" />}
          </div>
          <div className="text-center md:text-left flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-white tracking-tight truncate">{profile.name || "Configure Profile"}</h1>
            <p className="text-sm text-zinc-400 mt-1 font-medium truncate">@{profile.username || "username"}</p>
            {profile.isPublic && profile.username && (
              <a href={`${window.location.origin}/u/${profile.username}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg hover:bg-blue-500/20 transition-colors">
                <ExternalLink size={12} /> {window.location.origin}/u/{profile.username}
              </a>
            )}
          </div>
          <button type="button" onClick={handleManualSync} disabled={loading || syncing} className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-500 transition-colors disabled:opacity-50 shrink-0">
            {syncing || loading ? <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Processing</span> : "Save & Sync"}
          </button>
        </header>

        {/* Status Dashboard */}
        <section className="bg-zinc-900/40 p-6 md:p-8 rounded-3xl shadow-sm border border-white/[0.04]">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-6">Platform Link Status</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(platformConfig).map(([platform, config]) => (
              <PlatformStatusCard key={platform} label={config.label} handle={profile[config.handleKey]} status={platformStatus[platform]} error={platformErrors[platform]} />
            ))}
          </div>
        </section>

        {/* Sync Results */}
        {syncResults.length > 0 && (
          <section className="bg-zinc-900/40 p-6 rounded-3xl shadow-sm border border-white/[0.04]">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">Latest Sync Results</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {syncResults.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 rounded-xl bg-zinc-950 border border-white/[0.02]">
                  <span className="capitalize text-sm font-semibold text-zinc-300">{item.platform || "Platform"}</span>
                  <span className={`text-xs font-bold ${item.success ? "text-emerald-400" : "text-red-400"}`}>{item.success ? "SYNCED" : "FAILED"}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="bg-zinc-900/40 p-6 md:p-8 rounded-3xl shadow-sm border border-white/[0.04]">
            <h2 className="text-lg font-bold text-white mb-6">General Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Full Name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="E.g., Vaibhav Rai" />
              <Input label="Unique Username" value={profile.username} onChange={(e) => setProfile({ ...profile, username: e.target.value })} onBlur={(e) => e.target.value.trim() && handleValidate("username", e.target.value.trim())} placeholder="e.g., vaibhav_123" required />
              <Input label="LinkedIn URL" value={profile.linkedinUrl} onChange={(e) => setProfile({ ...profile, linkedinUrl: e.target.value })} placeholder="https://linkedin.com/in/..." />
              <Input label="Skills (Comma separated)" value={(profile.skills || []).join(", ")} onChange={(e) => handleSkillsChange(e.target.value)} placeholder="React, Node.js, C++" />
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-zinc-400 block mb-2">Bio</label>
                <textarea className="w-full p-3 rounded-xl border border-white/[0.05] bg-zinc-950 text-sm text-zinc-200 focus:border-blue-500/50 outline-none resize-none h-24" value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} placeholder="Write a short public bio..." />
              </div>
            </div>
          </section>

          <section className="bg-zinc-900/40 p-6 md:p-8 rounded-3xl shadow-sm border border-white/[0.04]">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-white">Platform Handles</h2>
              <p className="text-sm text-zinc-500 mt-1 font-medium">Add your handles. We'll automatically validate and sync your statistics.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(platformConfig).map(([platform, config]) => (
                <HandleInput key={platform} icon={config.icon} label={config.label} value={profile[config.handleKey]} onChange={(e) => markHandleChanged(platform, e.target.value)} onCheck={() => handleValidate(platform, profile[config.handleKey])} status={validationStatus[platform]} linkedStatus={platformStatus[platform]} error={platformErrors[platform]} />
              ))}
            </div>
          </section>

          <section className="bg-zinc-900/40 p-6 rounded-3xl shadow-sm border border-white/[0.04] flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white">Public Portfolio</h3>
              <p className="text-sm text-zinc-500 font-medium">Make your comprehensive profile visible via your username link.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={profile.isPublic} onChange={(e) => setProfile({ ...profile, isPublic: e.target.checked })} />
              <div className="w-11 h-6 bg-zinc-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 border border-white/[0.05]" />
            </label>
          </section>

          {notif.msg && (
            <div className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-2 ${notif.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
              {notif.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />} {notif.msg}
            </div>
          )}

          <button type="submit" disabled={loading || syncing} className="w-full bg-white text-zinc-950 py-4 rounded-xl font-bold text-sm hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {loading || syncing ? <><Loader2 size={16} className="animate-spin" /> Saving & Syncing...</> : <><Save size={16} /> Save Profile & Sync</>}
          </button>
        </form>
      </div>
    </MainLayout>
  );
};

const Input = ({ label, ...props }) => (
  <div>
    <label className="text-xs font-semibold text-zinc-400 block mb-2">{label}</label>
    <input className="w-full px-4 py-3 rounded-xl border border-white/[0.05] bg-zinc-950 text-sm text-zinc-200 focus:border-blue-500/50 outline-none transition-colors" {...props} />
  </div>
);

const PlatformStatusCard = ({ label, handle, status, error }) => {
  const normalizedStatus = handle ? status || "Pending Sync" : "Not Linked";
  const statusStyles = {
    Linked: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    Validated: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "Needs Sync": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    Error: "bg-red-500/10 text-red-400 border-red-500/20",
    "Pending Sync": "bg-zinc-800/50 text-zinc-400 border-white/[0.05]",
    "Not Linked": "bg-zinc-900 text-zinc-600 border-white/[0.02]",
  };

  return (
    <div className={`rounded-xl border p-4 flex flex-col justify-between ${statusStyles[normalizedStatus] || statusStyles["Pending Sync"]}`}>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider mb-2">{label}</p>
        <p className="text-sm font-semibold truncate text-white">{handle || "No handle"}</p>
      </div>
      <div className="mt-4">
        <p className="text-[10px] font-bold uppercase tracking-widest">{normalizedStatus}</p>
        {error && normalizedStatus === "Error" && <p className="text-[10px] mt-1 font-medium opacity-80 line-clamp-2">{error}</p>}
      </div>
    </div>
  );
};

const HandleInput = ({ label, icon, value, onChange, onCheck, status, linkedStatus, error }) => (
  <div>
    <label className="text-xs font-semibold text-zinc-400 block mb-2">{label}</label>
    <div className="relative flex items-center">
      <div className="absolute left-4 text-zinc-500">{icon}</div>
      <input className="w-full pl-11 pr-24 py-3 rounded-xl border border-white/[0.05] bg-zinc-950 text-sm text-zinc-200 focus:border-blue-500/50 outline-none transition-colors" value={value || ""} onChange={onChange} placeholder={`${label} username`} />
      <button type="button" onClick={onCheck} className="absolute right-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors">
        {status === "validating" ? <RefreshCw className="animate-spin" size={14} /> : "Check"}
      </button>
    </div>
    <div className="mt-2 flex items-center gap-2 text-xs font-medium">
      {status === "valid" && <span className="text-emerald-400 flex items-center gap-1"><CheckCircle size={12} /> Valid</span>}
      {status === "invalid" && <span className="text-red-400 flex items-center gap-1"><XCircle size={12} /> Not Found</span>}
      {status === "needs-validation" && <span className="text-yellow-400 flex items-center gap-1"><AlertCircle size={12} /> Validate before sync</span>}
      {!status && linkedStatus === "Linked" && <span className="text-emerald-400 flex items-center gap-1"><CheckCircle size={12} /> Linked</span>}
      {!status && linkedStatus !== "Linked" && <span className="text-zinc-500">{value ? linkedStatus || "Pending Sync" : "Optional"}</span>}
    </div>
  </div>
);

export default Profile;