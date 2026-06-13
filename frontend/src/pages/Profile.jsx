import { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import api from "../api/axios";
import { getDashboard, syncAllPlatforms } from "../api/stats";
import {CheckCircle, XCircle, RefreshCw, ExternalLink, User, Github, Code, Loader2, AlertCircle, Save,} from "lucide-react";

const platformConfig = {
  github: {
    label: "GitHub",
    handleKey: "githubHandle",
    icon: <Github size={18} />,
  },
  leetcode: {
    label: "LeetCode",
    handleKey: "leetcodeHandle",
    icon: <Code size={18} />,
  },
  codeforces: {
    label: "Codeforces",
    handleKey: "codeforcesHandle",
    icon: <Code size={18} />,
  },
  codechef: {
    label: "CodeChef",
    handleKey: "codechefHandle",
    icon: <Code size={18} />,
  },
};

const emptyProfile = {
  name: "", username: "", bio: "", avatar: "", skills: [], leetcodeHandle: "", codeforcesHandle: "", githubHandle: "",
  codechefHandle: "", linkedinUrl: "", isPublic: false,
};

const Profile = () => {
  const [profile, setProfile] = useState(emptyProfile);
  const [originalHandles, setOriginalHandles] = useState({
    github: "",
    leetcode: "",
    codeforces: "",
    codechef: "",
  });

  const [platformStatus, setPlatformStatus] = useState({
    github: "Pending Sync",
    leetcode: "Pending Sync",
    codeforces: "Pending Sync",
    codechef: "Pending Sync",
  });

  const [platformErrors, setPlatformErrors] = useState({});
  const [validationStatus, setValidationStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState([]);
  const [notif, setNotif] = useState({ msg: "", type: "" });

  const showNotif = (msg, type = "success") => {
    setNotif({ msg, type });
    setTimeout(() => setNotif({ msg: "", type: "" }), 3500);
  };

  const getHandlesFromProfile = (profileData) => ({
    github: profileData?.githubHandle || "",
    leetcode: profileData?.leetcodeHandle || "",
    codeforces: profileData?.codeforcesHandle || "",
    codechef: profileData?.codechefHandle || "",
  });

  const loadProfileAndStatuses = async () => {
    try {
      const profileRes = await api.get("/profile");

      if (profileRes.data) {
        const nextProfile = {
          ...emptyProfile,
          ...profileRes.data,
          skills: Array.isArray(profileRes.data.skills)
            ? profileRes.data.skills
            : [],
        };

        setProfile(nextProfile);
        setOriginalHandles(getHandlesFromProfile(nextProfile));
      }
    } catch (err) {
      console.error("Profile fetch error", err);
    }

    try {
      const dashboardData = await getDashboard();
      const platforms = dashboardData?.platforms || {};

      setPlatformStatus({
        github: platforms.github?.status || "Pending Sync",
        leetcode: platforms.leetcode?.status || "Pending Sync",
        codeforces: platforms.codeforces?.status || "Pending Sync",
        codechef: platforms.codechef?.status || "Pending Sync",
      });

      setPlatformErrors({
        github: platforms.github?.error || "",
        leetcode: platforms.leetcode?.error || "",
        codeforces: platforms.codeforces?.error || "",
        codechef: platforms.codechef?.error || "",
      });
    } catch (err) {
      console.error("Coding status fetch error", err);
    }
  };

  useEffect(() => {
    loadProfileAndStatuses();
  }, []);

  const markHandleChanged = (platform, value) => {
    const handleKey = platformConfig[platform].handleKey;

    setProfile((prev) => ({
      ...prev,
      [handleKey]: value,
    }));

    const oldHandle = originalHandles[platform] || "";
    const newHandle = value || "";

    if (newHandle.trim() !== oldHandle.trim()) {
      setValidationStatus((prev) => ({
        ...prev,
        [platform]: newHandle.trim() ? "needs-validation" : "",
      }));

      setPlatformStatus((prev) => ({
        ...prev,
        [platform]: newHandle.trim() ? "Needs Sync" : "Pending Sync",
      }));
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
      const res = await api.get("/profile/validate", {
        params: {
          platform,
          handle: cleanHandle,
        },
      });

      if (res.data?.valid) {
        setValidationStatus((prev) => ({ ...prev, [platform]: "valid" }));
        setPlatformStatus((prev) => ({ ...prev, [platform]: "Validated" }));
        setPlatformErrors((prev) => ({ ...prev, [platform]: "" }));
        return true;
      }

      setValidationStatus((prev) => ({ ...prev, [platform]: "invalid" }));
      setPlatformStatus((prev) => ({ ...prev, [platform]: "Error" }));
      setPlatformErrors((prev) => ({
        ...prev,
        [platform]: res.data?.message || "Handle not found",
      }));
      return false;
    } catch (err) {
      setValidationStatus((prev) => ({ ...prev, [platform]: "invalid" }));
      setPlatformStatus((prev) => ({ ...prev, [platform]: "Error" }));
      setPlatformErrors((prev) => ({
        ...prev,
        [platform]:
          err.response?.data?.message || "Handle not found or platform unavailable",
      }));
      return false;
    }
  };

  const validateChangedHandles = async () => {
    const platforms = Object.keys(platformConfig);
    const changedPlatforms = platforms.filter((platform) => {
      const handleKey = platformConfig[platform].handleKey;
      const newHandle = profile[handleKey]?.trim() || "";
      const oldHandle = originalHandles[platform]?.trim() || "";
      return newHandle && newHandle !== oldHandle;
    });

    if (!changedPlatforms.length) return true;

    const results = await Promise.all(
      changedPlatforms.map((platform) => {
        const handleKey = platformConfig[platform].handleKey;
        return handleValidate(platform, profile[handleKey]);
      })
    );

    return results.every(Boolean);
  };

  const buildPayload = () => ({
    ...profile,
    name: profile.name.trim(),
    username: profile.username.trim().toLowerCase(),
    leetcodeHandle: profile.leetcodeHandle.trim(),
    codeforcesHandle: profile.codeforcesHandle.trim(),
    githubHandle: profile.githubHandle.trim(),
    codechefHandle: profile.codechefHandle.trim(),
    linkedinUrl: profile.linkedinUrl.trim(),
    skills: Array.isArray(profile.skills) ? profile.skills : [],
  });

  const saveProfileOnly = async () => {
    const res = await api.post("/profile", buildPayload());

    const savedProfile = {
      ...emptyProfile,
      ...res.data.profile,
      skills: Array.isArray(res.data.profile?.skills)
        ? res.data.profile.skills
        : [],
    };

    setProfile(savedProfile);
    setOriginalHandles(getHandlesFromProfile(savedProfile));

    return savedProfile;
  };

  const runSync = async () => {
    setSyncing(true);
    setSyncResults([]);

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

      setPlatformStatus(nextStatus);
      setPlatformErrors(nextErrors);

      await loadProfileAndStatuses();

      const failed = results.filter((item) => !item.success);

      if (failed.length) {
        showNotif("Sync completed, but some platforms failed.", "error");
      } else {
        showNotif("Profile saved and all platforms synced.", "success");
      }
    } catch (syncErr) {
      setSyncResults([
        {
          success: false,
          platform: "sync",
          error:
            syncErr.response?.data?.message || "Profile saved, but sync failed.",
        },
      ]);

      showNotif("Profile saved, but platform sync failed.", "error");
    } finally {
      setSyncing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!profile.username.trim()) {
      showNotif("Username is required.", "error");
      return;
    }

    setLoading(true);
    setSyncResults([]);

    try {
      const handlesAreValid = await validateChangedHandles();

      if (!handlesAreValid) {
        showNotif("Fix invalid platform handles before syncing.", "error");
        return;
      }

      await saveProfileOnly();
      showNotif("Profile saved. Sync started.", "success");
      await runSync();
    } catch (err) {
      showNotif(err.response?.data?.message || "Save failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    setLoading(true);

    try {
      const handlesAreValid = await validateChangedHandles();

      if (!handlesAreValid) {
        showNotif("Fix invalid platform handles before syncing.", "error");
        return;
      }

      await saveProfileOnly();
      await runSync();
    } catch (err) {
      showNotif(err.response?.data?.message || "Manual sync failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSkillsChange = (value) => {
    const skills = value
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

    setProfile({ ...profile, skills });
  };

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto pb-20">
        <header className="flex flex-col md:flex-row items-center gap-6 mb-10 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border dark:border-gray-700">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-gray-700 overflow-hidden border-4 border-white dark:border-gray-600 shadow-md">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-full h-full p-4 text-blue-500" />
              )}
            </div>

            {profile.avatar && (
              <div
                className="absolute bottom-0 right-0 bg-green-500 w-6 h-6 rounded-full border-4 border-white dark:border-gray-800"
                title="Avatar synced"
              />
            )}
          </div>

          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl font-extrabold dark:text-white">
              {profile.name || "Set Your Name"}
            </h1>

            <p className="text-gray-500 dark:text-gray-400">
              @{profile.username || "username"}
            </p>

            {profile.isPublic && profile.username && (
              <div className="mt-2 flex items-center gap-2 text-xs font-mono text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-lg w-fit mx-auto md:mx-0">
                <ExternalLink size={12} />
                {window.location.origin}/u/{profile.username}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleManualSync}
            disabled={loading || syncing}
            className="px-5 py-3 rounded-xl bg-gray-900 dark:bg-gray-950 text-white font-bold text-sm hover:bg-blue-600 transition-all disabled:opacity-50"
          >
            {syncing || loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Syncing
              </span>
            ) : (
              "Save & Sync Now"
            )}
          </button>
        </header>

        <section className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-4">
            Platform linking status
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {Object.entries(platformConfig).map(([platform, config]) => (
              <PlatformStatusCard
                key={platform}
                label={config.label}
                handle={profile[config.handleKey]}
                status={platformStatus[platform]}
                error={platformErrors[platform]}
              />
            ))}
          </div>
        </section>

        {syncResults.length > 0 && (
          <section className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-4">
              Latest sync results
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {syncResults.map((item, index) => (
                <div
                  key={`${item.platform || "sync"}-${index}`}
                  className="flex items-center justify-between rounded-xl border dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900 gap-4"
                >
                  <span className="capitalize text-sm font-bold dark:text-white">
                    {item.platform || "Platform"}
                  </span>

                  <span
                    className={`text-xs font-black text-right ${
                      item.success ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {item.success ? "SYNCED" : item.error || "FAILED"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border dark:border-gray-700">
            <div className="md:col-span-2">
              <h2 className="text-lg font-bold dark:text-white mb-4">
                General Information
              </h2>
            </div>

            <Input
              label="Full Name"
              value={profile.name}
              onChange={(e) =>
                setProfile({ ...profile, name: e.target.value })
              }
            />

            <Input
              label="Unique Username"
              value={profile.username}
              onChange={(e) =>
                setProfile({ ...profile, username: e.target.value })
              }
              onBlur={(e) => {
                if (e.target.value.trim()) {
                  handleValidate("username", e.target.value.trim());
                }
              }}
              placeholder="e.g. vaibhav_coder"
            />

            <Input
              label="LinkedIn URL"
              value={profile.linkedinUrl}
              onChange={(e) =>
                setProfile({ ...profile, linkedinUrl: e.target.value })
              }
              placeholder="https://linkedin.com/in/..."
            />

            <Input
              label="Skills comma separated"
              value={(profile.skills || []).join(", ")}
              onChange={(e) => handleSkillsChange(e.target.value)}
              placeholder="React, Node.js, MongoDB, DSA"
            />

            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-gray-500 block mb-2">
                Bio
              </label>
              <textarea
                className="w-full p-3 rounded-xl border dark:border-gray-700 bg-gray-50 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none h-24"
                value={profile.bio}
                onChange={(e) =>
                  setProfile({ ...profile, bio: e.target.value })
                }
                placeholder="Write a short public bio..."
              />
            </div>
          </section>

          <section className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border dark:border-gray-700">
            <h2 className="text-lg font-bold dark:text-white mb-2">
              Coding Profiles
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Change any handle, validate it, then save and sync. Sync always uses the latest saved handles.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {Object.entries(platformConfig).map(([platform, config]) => (
                <HandleInput
                  key={platform}
                  icon={config.icon}
                  label={config.label}
                  value={profile[config.handleKey]}
                  onChange={(e) => markHandleChanged(platform, e.target.value)}
                  onCheck={() =>
                    handleValidate(platform, profile[config.handleKey])
                  }
                  status={validationStatus[platform]}
                  linkedStatus={platformStatus[platform]}
                  error={platformErrors[platform]}
                />
              ))}
            </div>
          </section>

          <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700 flex items-center justify-between">
            <div>
              <h3 className="font-bold dark:text-white">
                Public Portfolio Link
              </h3>
              <p className="text-sm text-gray-500">
                Allow others to see your coding stats via a unique URL.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={profile.isPublic}
                onChange={(e) =>
                  setProfile({ ...profile, isPublic: e.target.checked })
                }
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600" />
            </label>
          </section>

          {notif.msg && (
            <div
              className={`p-4 rounded-xl text-center font-bold ${
                notif.type === "success"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {notif.msg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || syncing}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading || syncing ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                Saving & Syncing...
              </span>
            ) : (
              <span className="inline-flex items-center justify-center gap-2">
                <Save size={18} />
                Save Profile & Sync Platforms
              </span>
            )}
          </button>
        </form>
      </div>
    </MainLayout>
  );
};

const Input = ({ label, ...props }) => (
  <div>
    <label className="text-sm font-semibold text-gray-500 block mb-2">
      {label}
    </label>
    <input
      className="w-full p-3 rounded-xl border dark:border-gray-700 bg-gray-50 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
      {...props}
    />
  </div>
);

const PlatformStatusCard = ({ label, handle, status, error }) => {
  const normalizedStatus = handle ? status || "Pending Sync" : "Not Linked";

  const styles = {
    Linked: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
    Validated: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
    "Needs Sync": "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
    Error: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
    "Pending Sync": "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700",
    "Not Linked": "bg-gray-50 text-gray-400 border-gray-200 dark:bg-gray-900 dark:text-gray-500 dark:border-gray-700",
  };

  return (
    <div className={`rounded-xl border p-4 ${styles[normalizedStatus] || styles["Pending Sync"]}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-black">{label}</p>
        {normalizedStatus === "Linked" || normalizedStatus === "Validated" ? (
          <CheckCircle size={16} />
        ) : normalizedStatus === "Error" ? (
          <XCircle size={16} />
        ) : (
          <AlertCircle size={16} />
        )}
      </div>

      <p className="text-xs font-bold truncate">{handle || "No handle added"}</p>
      <p className="text-[10px] font-black uppercase tracking-widest mt-2">
        {normalizedStatus}
      </p>

      {error && normalizedStatus === "Error" && (
        <p className="text-[10px] mt-2 line-clamp-2">{error}</p>
      )}
    </div>
  );
};

const HandleInput = ({
  label,
  icon,
  value,
  onChange,
  onCheck,
  status,
  linkedStatus,
  error,
}) => (
  <div>
    <label className="text-sm font-semibold text-gray-500 block mb-2">
      {label}
    </label>

    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        {icon}
      </div>

      <input
        className="w-full pl-10 pr-24 py-3 rounded-xl border dark:border-gray-700 bg-gray-50 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
        value={value || ""}
        onChange={onChange}
        placeholder={`${label} handle`}
      />

      <button
        type="button"
        onClick={onCheck}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider bg-gray-200 dark:bg-gray-700 px-3 py-1.5 rounded-lg hover:bg-blue-500 hover:text-white transition-all"
      >
        {status === "validating" ? (
          <RefreshCw className="animate-spin" size={12} />
        ) : (
          "Check"
        )}
      </button>
    </div>

    <div className="mt-2 flex items-center gap-2 flex-wrap">
      {status === "valid" && (
        <span className="text-[10px] text-green-500 flex items-center gap-1 font-bold">
          <CheckCircle size={10} /> Valid
        </span>
      )}

      {status === "invalid" && (
        <span className="text-[10px] text-red-500 flex items-center gap-1 font-bold">
          <XCircle size={10} /> Not Found
        </span>
      )}

      {status === "needs-validation" && (
        <span className="text-[10px] text-yellow-500 flex items-center gap-1 font-bold">
          <AlertCircle size={10} /> Validate before sync
        </span>
      )}

      {!status && linkedStatus === "Linked" && (
        <span className="text-[10px] text-green-500 flex items-center gap-1 font-bold">
          <CheckCircle size={10} /> Linked
        </span>
      )}

      {!status && linkedStatus !== "Linked" && (
        <span className="text-[10px] text-gray-400 font-medium">
          {value ? linkedStatus || "Pending Sync" : "Optional"}
        </span>
      )}

      {error && linkedStatus === "Error" && (
        <span className="text-[10px] text-red-500 font-medium truncate">
          {error}
        </span>
      )}
    </div>
  </div>
);

export default Profile;