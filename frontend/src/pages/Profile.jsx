import { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import api from "../api/axios";
import { syncAllPlatforms } from "../api/stats";
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  User,
  Github,
  Code,
  Loader2,
} from "lucide-react";

const Profile = () => {
  const [profile, setProfile] = useState({
    name: "",
    username: "",
    bio: "",
    avatar: "",
    skills: [],
    leetcodeHandle: "",
    codeforcesHandle: "",
    githubHandle: "",
    codechefHandle: "",
    linkedinUrl: "",
    isPublic: false,
  });

  const [validationStatus, setValidationStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState([]);
  const [notif, setNotif] = useState({ msg: "", type: "" });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/profile");

        if (res.data) {
          setProfile((prev) => ({
            ...prev,
            ...res.data,
            skills: Array.isArray(res.data.skills) ? res.data.skills : [],
          }));
        }
      } catch (err) {
        console.error("Profile fetch error", err);
      }
    };

    fetchProfile();
  }, []);

  const showNotif = (msg, type = "success") => {
    setNotif({ msg, type });
    setTimeout(() => setNotif({ msg: "", type: "" }), 3500);
  };

  const handleValidate = async (platform, handle) => {
    if (!handle || !handle.trim()) {
      setValidationStatus((prev) => ({ ...prev, [platform]: "invalid" }));
      return;
    }

    setValidationStatus((prev) => ({ ...prev, [platform]: "validating" }));

    try {
      const res = await api.get("/profile/validate", {
        params: {
          platform,
          handle: handle.trim(),
        },
      });

      if (res.data?.valid) {
        setValidationStatus((prev) => ({ ...prev, [platform]: "valid" }));
      } else {
        setValidationStatus((prev) => ({ ...prev, [platform]: "invalid" }));
      }
    } catch (err) {
      setValidationStatus((prev) => ({ ...prev, [platform]: "invalid" }));
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!profile.username.trim()) {
      showNotif("Username is required.", "error");
      return;
    }

    setLoading(true);
    setSyncing(false);
    setSyncResults([]);

    try {
      const res = await api.post("/profile", buildPayload());

      setProfile((prev) => ({
        ...prev,
        ...res.data.profile,
      }));

      showNotif("Profile saved successfully.", "success");

      setSyncing(true);

      try {
        const syncRes = await syncAllPlatforms();
        setSyncResults(syncRes?.results || []);
        showNotif("Profile saved and platform sync completed.", "success");
      } catch (syncErr) {
        setSyncResults([
          {
            success: false,
            platform: "sync",
            error:
              syncErr.response?.data?.message ||
              "Profile saved, but sync failed.",
          },
        ]);

        showNotif("Profile saved, but platform sync had issues.", "error");
      }
    } catch (err) {
      showNotif(err.response?.data?.message || "Save failed", "error");
    } finally {
      setLoading(false);
      setSyncing(false);
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
                title="Synced"
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
            onClick={async () => {
              setSyncing(true);
              setSyncResults([]);

              try {
                const res = await syncAllPlatforms();
                setSyncResults(res?.results || []);
                showNotif("Manual platform sync completed.", "success");
              } catch (err) {
                showNotif(
                  err.response?.data?.message || "Manual sync failed.",
                  "error"
                );
              } finally {
                setSyncing(false);
              }
            }}
            disabled={syncing}
            className="px-5 py-3 rounded-xl bg-gray-900 dark:bg-gray-950 text-white font-bold text-sm hover:bg-blue-600 transition-all disabled:opacity-50"
          >
            {syncing ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Syncing
              </span>
            ) : (
              "Sync Now"
            )}
          </button>
        </header>

        {syncResults.length > 0 && (
          <section className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-4">
              Latest sync results
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {syncResults.map((item, index) => (
                <div
                  key={`${item.platform || "sync"}-${index}`}
                  className="flex items-center justify-between rounded-xl border dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900"
                >
                  <span className="capitalize text-sm font-bold dark:text-white">
                    {item.platform || "Platform"}
                  </span>

                  <span
                    className={`text-xs font-black ${
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
            <h2 className="text-lg font-bold dark:text-white mb-6">
              Coding Profiles
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <HandleInput
                icon={<Github size={18} />}
                label="GitHub"
                value={profile.githubHandle}
                onChange={(e) =>
                  setProfile({ ...profile, githubHandle: e.target.value })
                }
                onCheck={() =>
                  handleValidate("github", profile.githubHandle)
                }
                status={validationStatus.github}
              />

              <HandleInput
                icon={<Code size={18} />}
                label="LeetCode"
                value={profile.leetcodeHandle}
                onChange={(e) =>
                  setProfile({ ...profile, leetcodeHandle: e.target.value })
                }
                onCheck={() =>
                  handleValidate("leetcode", profile.leetcodeHandle)
                }
                status={validationStatus.leetcode}
              />

              <HandleInput
                icon={<Code size={18} />}
                label="Codeforces"
                value={profile.codeforcesHandle}
                onChange={(e) =>
                  setProfile({ ...profile, codeforcesHandle: e.target.value })
                }
                onCheck={() =>
                  handleValidate("codeforces", profile.codeforcesHandle)
                }
                status={validationStatus.codeforces}
              />

              <HandleInput
                icon={<Code size={18} />}
                label="CodeChef"
                value={profile.codechefHandle}
                onChange={(e) =>
                  setProfile({ ...profile, codechefHandle: e.target.value })
                }
                onCheck={() =>
                  handleValidate("codechef", profile.codechefHandle)
                }
                status={validationStatus.codechef}
              />
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
              "Save Profile & Sync Platforms"
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

const HandleInput = ({ label, icon, value, onChange, onCheck, status }) => (
  <div>
    <label className="text-sm font-semibold text-gray-500 block mb-2">
      {label}
    </label>

    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        {icon}
      </div>

      <input
        className="w-full pl-10 pr-20 py-3 rounded-xl border dark:border-gray-700 bg-gray-50 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
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

    <div className="mt-1 flex items-center gap-1">
      {status === "valid" && (
        <span className="text-[10px] text-green-500 flex items-center gap-1 font-bold">
          <CheckCircle size={10} /> Linked
        </span>
      )}

      {status === "invalid" && (
        <span className="text-[10px] text-red-500 flex items-center gap-1 font-bold">
          <XCircle size={10} /> Not Found
        </span>
      )}

      {!status && (
        <span className="text-[10px] text-gray-400 font-medium">
          Pending validation
        </span>
      )}
    </div>
  </div>
);

export default Profile;