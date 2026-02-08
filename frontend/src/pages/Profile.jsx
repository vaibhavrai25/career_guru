import { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import api from "../api/axios";
import { CheckCircle, XCircle, RefreshCw, ExternalLink, User, Github, Code } from "lucide-react";

const Profile = () => {
  const [profile, setProfile] = useState({
    name: "", username: "", bio: "", avatar: "",
    leetcodeHandle: "", codeforcesHandle: "", githubHandle: "", codechefHandle: "",
    linkedinUrl: "", isPublic: false,
  });
  const [validationStatus, setValidationStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [notif, setNotif] = useState({ msg: "", type: "" });

  // 1. Fetch Profile on Load
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/profile");
        if (res.data) setProfile(prev => ({ ...prev, ...res.data }));
      } catch (err) { console.error("Profile fetch error", err); }
    };
    fetchProfile();
  }, []);

  // 2. Real-time Handle Validation
  const handleValidate = async (platform, handle) => {
    if (!handle) return;
    setValidationStatus(prev => ({ ...prev, [platform]: "validating" }));
    try {
      const res = await api.get(`/profile/validate?platform=${platform}&handle=${handle}`);
      if (res.data.valid) {
        setValidationStatus(prev => ({ ...prev, [platform]: "valid" }));
      }
    } catch (err) {
      setValidationStatus(prev => ({ ...prev, [platform]: "invalid" }));
    }
  };

  // 3. Save Profile
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/profile", profile);
      setProfile(prev => ({ ...prev, ...res.data.profile }));
      setNotif({ msg: "Profile saved successfully!", type: "success" });
    } catch (err) {
      setNotif({ msg: err.response?.data?.message || "Save failed", type: "error" });
    }
    setLoading(false);
    setTimeout(() => setNotif({ msg: "", type: "" }), 3000);
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto pb-20">
        <header className="flex flex-col md:flex-row items-center gap-6 mb-10 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border dark:border-gray-700">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-gray-700 overflow-hidden border-4 border-white dark:border-gray-600 shadow-md">
              {profile.avatar ? (
                <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-full h-full p-4 text-blue-500" />
              )}
            </div>
            {profile.avatar && <div className="absolute bottom-0 right-0 bg-green-500 w-6 h-6 rounded-full border-4 border-white dark:border-gray-800" title="Synced"></div>}
          </div>
          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl font-extrabold">{profile.name || "Set Your Name"}</h1>
            <p className="text-gray-500 dark:text-gray-400">@{profile.username || "username"}</p>
            {profile.isPublic && (
              <div className="mt-2 flex items-center gap-2 text-xs font-mono text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-lg w-fit">
                <ExternalLink size={12} /> {window.location.origin}/u/{profile.username}
              </div>
            )}
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* General Info */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border dark:border-gray-700">
            <div className="md:col-span-2"><h2 className="text-lg font-bold mb-4">General Information</h2></div>
            <Input label="Full Name" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} />
            <Input label="Unique Username (for URL)" value={profile.username} onChange={e => setProfile({...profile, username: e.target.value})} placeholder="e.g. vaibhav_coder" />
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-gray-500 block mb-2">Bio</label>
              <textarea 
                className="w-full p-3 rounded-xl border dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none h-24"
                value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})}
              />
            </div>
          </section>

          {/* Coding Handles */}
          <section className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border dark:border-gray-700">
            <h2 className="text-lg font-bold mb-6">Coding Profiles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <HandleInput icon={<Github size={18}/>} label="GitHub" value={profile.githubHandle} 
                onChange={e => setProfile({...profile, githubHandle: e.target.value})} 
                onCheck={() => handleValidate('github', profile.githubHandle)}
                status={validationStatus.github}
              />
              <HandleInput icon={<Code size={18}/>} label="LeetCode" value={profile.leetcodeHandle} 
                onChange={e => setProfile({...profile, leetcodeHandle: e.target.value})} 
                onCheck={() => handleValidate('leetcode', profile.leetcodeHandle)}
                status={validationStatus.leetcode}
              />
              <HandleInput icon={<Code size={18}/>} label="Codeforces" value={profile.codeforcesHandle} 
                onChange={e => setProfile({...profile, codeforcesHandle: e.target.value})} 
                onCheck={() => handleValidate('codeforces', profile.codeforcesHandle)}
                status={validationStatus.codeforces}
              />
              <HandleInput icon={<Code size={18}/>} label="CodeChef" value={profile.codechefHandle} 
                onChange={e => setProfile({...profile, codechefHandle: e.target.value})} 
                onCheck={() => handleValidate('codechef', profile.codechefHandle)}
                status={validationStatus.codechef}
              />
            </div>
          </section>

          {/* Advanced Toggles */}
          <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700 flex items-center justify-between">
            <div>
              <h3 className="font-bold">Public Portfolio Link</h3>
              <p className="text-sm text-gray-500">Allow others to see your coding stats via a unique URL.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={profile.isPublic} onChange={e => setProfile({...profile, isPublic: e.target.checked})} />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </section>

          {notif.msg && (
            <div className={`p-4 rounded-xl text-center font-bold ${notif.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {notif.msg}
            </div>
          )}

          <button 
            type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/30 transition-all active:scale-95"
          >
            {loading ? "Syncing Data & Saving..." : "Save Profile & Sync Avatars"}
          </button>
        </form>
      </div>
    </MainLayout>
  );
};

// Reusable Components
const Input = ({ label, ...props }) => (
  <div>
    <label className="text-sm font-semibold text-gray-500 block mb-2">{label}</label>
    <input 
      className="w-full p-3 rounded-xl border dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
      {...props}
    />
  </div>
);

const HandleInput = ({ label, icon, value, onChange, onCheck, status }) => (
  <div>
    <label className="text-sm font-semibold text-gray-500 block mb-2">{label}</label>
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>
      <input 
        className="w-full pl-10 pr-20 py-3 rounded-xl border dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
        value={value} onChange={onChange} placeholder={`${label} handle`}
      />
      <button 
        type="button" onClick={onCheck}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider bg-gray-200 dark:bg-gray-700 px-3 py-1.5 rounded-lg hover:bg-blue-500 hover:text-white transition-all"
      >
        {status === "validating" ? <RefreshCw className="animate-spin" size={12}/> : "Check"}
      </button>
    </div>
    <div className="mt-1 flex items-center gap-1">
      {status === "valid" && <span className="text-[10px] text-green-500 flex items-center gap-1 font-bold"><CheckCircle size={10}/> Linked</span>}
      {status === "invalid" && <span className="text-[10px] text-red-500 flex items-center gap-1 font-bold"><XCircle size={10}/> Not Found</span>}
      {!status && <span className="text-[10px] text-gray-400 font-medium">Pending validation</span>}
    </div>
  </div>
);

export default Profile;