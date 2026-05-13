import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  Loader2,
  Github,
  Code,
  UserRound,
} from "lucide-react";
import api from "../api/axios";
import { syncAllPlatforms } from "../api/stats";

const Onboarding = () => {
  const [handles, setHandles] = useState({
    username: "",
    leetcodeHandle: "",
    codeforcesHandle: "",
    codechefHandle: "",
    githubHandle: "",
  });

  const [validationStatus, setValidationStatus] = useState({});
  const [validationMessage, setValidationMessage] = useState({});
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState([]);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const updateValidation = (field, status, message) => {
    setValidationStatus((prev) => ({ ...prev, [field]: status }));
    setValidationMessage((prev) => ({ ...prev, [field]: message }));
  };

  const buildProfilePayload = () => ({
    username: handles.username.trim().toLowerCase(),
    name: handles.username.trim(),
    leetcodeHandle: handles.leetcodeHandle.trim(),
    codeforcesHandle: handles.codeforcesHandle.trim(),
    codechefHandle: handles.codechefHandle.trim(),
    githubHandle: handles.githubHandle.trim(),
    bio: "Coding enthusiast building a strong SDE profile.",
    skills: [],
    isPublic: true,
  });

  const handleCheck = async (platform) => {
    const value =
      platform === "username"
        ? handles.username
        : handles[`${platform}Handle`];

    if (!value || !value.trim()) {
      updateValidation(platform, "invalid", "Enter a value before checking.");
      return;
    }

    updateValidation(platform, "validating", "Checking...");

    try {
      const res = await api.get("/profile/validate", {
        params: {
          platform,
          handle: value.trim(),
        },
      });

      if (res.data?.valid) {
        updateValidation(
          platform,
          "valid",
          platform === "username"
            ? "Username is available."
            : "Valid handle."
        );
      } else {
        updateValidation(platform, "invalid", "Invalid value.");
      }
    } catch (err) {
      updateValidation(
        platform,
        "invalid",
        err.response?.data?.message || "Invalid username or handle."
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!handles.username.trim()) {
      setError("Platform username is required.");
      return;
    }

    setError("");
    setSyncResults([]);
    setSyncing(true);

    try {
      await api.post("/profile", buildProfilePayload());

      let syncResponse = null;

      try {
        syncResponse = await syncAllPlatforms();
        setSyncResults(syncResponse?.results || []);
      } catch (syncErr) {
        setSyncResults([
          {
            success: false,
            platform: "sync",
            error:
              syncErr.response?.data?.message ||
              "Profile saved, but platform sync failed.",
          },
        ]);
      }

      setTimeout(() => {
        navigate("/", { replace: true });
      }, 800);
    } catch (err) {
      setError(err.response?.data?.message || "Profile setup failed.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-gray-900 border border-gray-800 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <h1 className="text-3xl font-black text-white italic mb-2 tracking-tight uppercase">
            Connect <span className="text-blue-500">Profiles</span>
          </h1>

          <p className="text-gray-500 mb-2 font-medium text-sm">
            Set up your analytics dashboard. Handles are optional except your
            platform username.
          </p>

          <p className="text-gray-400 mb-8 text-xs">
            After saving, Career Guru will sync all linked platforms
            automatically.
          </p>

          {error && (
            <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {syncResults.length > 0 && (
            <div className="mb-5 rounded-xl border border-gray-800 bg-gray-950 p-3 space-y-2">
              <p className="text-xs font-black uppercase tracking-widest text-gray-500">
                Sync results
              </p>
              {syncResults.map((item, index) => (
                <div
                  key={`${item.platform || "sync"}-${index}`}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-gray-300 capitalize">
                    {item.platform || "Platform"}
                  </span>
                  <span
                    className={
                      item.success ? "text-emerald-400" : "text-red-400"
                    }
                  >
                    {item.success ? "Synced" : item.error || "Failed"}
                  </span>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <OnboardingField
              icon={<UserRound size={16} />}
              label="Platform Username"
              placeholder="e.g. vaibhav_codes"
              value={handles.username}
              onChange={(v) => setHandles({ ...handles, username: v })}
              onCheck={() => handleCheck("username")}
              status={validationStatus.username}
              message={validationMessage.username}
              required
            />

            <OnboardingField
              icon={<Code size={16} />}
              label="LeetCode Handle"
              placeholder="leetcode username"
              value={handles.leetcodeHandle}
              onChange={(v) => setHandles({ ...handles, leetcodeHandle: v })}
              onCheck={() => handleCheck("leetcode")}
              status={validationStatus.leetcode}
              message={validationMessage.leetcode}
            />

            <OnboardingField
              icon={<Github size={16} />}
              label="GitHub Handle"
              placeholder="github username"
              value={handles.githubHandle}
              onChange={(v) => setHandles({ ...handles, githubHandle: v })}
              onCheck={() => handleCheck("github")}
              status={validationStatus.github}
              message={validationMessage.github}
            />

            <OnboardingField
              icon={<Code size={16} />}
              label="Codeforces Handle"
              placeholder="codeforces handle"
              value={handles.codeforcesHandle}
              onChange={(v) => setHandles({ ...handles, codeforcesHandle: v })}
              onCheck={() => handleCheck("codeforces")}
              status={validationStatus.codeforces}
              message={validationMessage.codeforces}
            />

            <OnboardingField
              icon={<Code size={16} />}
              label="CodeChef Handle"
              placeholder="codechef username"
              value={handles.codechefHandle}
              onChange={(v) => setHandles({ ...handles, codechefHandle: v })}
              onCheck={() => handleCheck("codechef")}
              status={validationStatus.codechef}
              message={validationMessage.codechef}
            />

            <div className="pt-4">
              <button
                type="submit"
                disabled={syncing}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                {syncing ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <Loader2 size={18} className="animate-spin" />
                    SAVING & SYNCING...
                  </span>
                ) : (
                  "READY TO ROLL →"
                )}
              </button>

              <p className="text-center text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-4">
                You can update handles later from profile settings
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const OnboardingField = ({
  icon,
  label,
  placeholder,
  value,
  onChange,
  onCheck,
  status,
  message,
  required = false,
}) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between gap-4">
      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
        <span className="text-gray-600">{icon}</span>
        {label} {required && "*"}
      </label>

      <button
        type="button"
        onClick={onCheck}
        className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-2 rounded-full transition-all ${
          status === "valid"
            ? "bg-emerald-500 text-white"
            : status === "invalid"
            ? "bg-red-500 text-white"
            : status === "validating"
            ? "bg-gray-800 text-gray-300"
            : "bg-gray-800 text-gray-200 hover:bg-blue-600 hover:text-white"
        }`}
      >
        {status === "valid" && (
          <span className="inline-flex items-center gap-1">
            <CheckCircle size={12} /> OK
          </span>
        )}

        {status === "invalid" && (
          <span className="inline-flex items-center gap-1">
            <XCircle size={12} /> Bad
          </span>
        )}

        {status === "validating" && (
          <span className="inline-flex items-center gap-1">
            <Loader2 size={12} className="animate-spin" /> Checking
          </span>
        )}

        {!status && "Check"}
      </button>
    </div>

    <input
      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3.5 text-white text-sm focus:border-blue-500 outline-none transition-all placeholder:text-gray-700"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
    />

    {message && (
      <p
        className={`flex items-center gap-1 text-[10px] mt-1 ${
          status === "valid"
            ? "text-emerald-400"
            : status === "invalid"
            ? "text-red-400"
            : "text-gray-400"
        }`}
      >
        {status === "valid" && <CheckCircle size={12} />}
        {status === "invalid" && <XCircle size={12} />}
        {message}
      </p>
    )}
  </div>
);

export default Onboarding;