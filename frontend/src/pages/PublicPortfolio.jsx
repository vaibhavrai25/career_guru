import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { 
  Github, ExternalLink, Award, Code, Zap, 
  MapPin, Globe, Share2, ClipboardCheck 
} from "lucide-react";

const PublicPortfolio = () => {
  const { username } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        // Bina token ke request taaki koi bhi dekh sake
        const res = await axios.get(`http://localhost:5000/api/profile/u/${username}`);
        setData(res.data);
      } catch (err) {
        console.error("Portfolio not found or private", err);
      }
      setLoading(false);
    };
    fetchPublicData();
  }, [username]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
      <p className="font-bold text-gray-500 animate-pulse">Building Portfolio...</p>
    </div>
  );

  if (!data) return (
    <div className="h-screen flex flex-col items-center justify-center text-center p-6 bg-gray-50 dark:bg-gray-950">
      <h1 className="text-4xl font-black text-gray-300 mb-4">404</h1>
      <p className="text-xl font-bold mb-6">Profile not found or set to private.</p>
      <Link to="/" className="text-blue-500 font-bold flex items-center gap-2 hover:underline">
        Go to Home <ExternalLink size={16}/>
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white selection:bg-blue-500 selection:text-white">
      {/* Top Banner / Navigation */}
      <nav className="border-b dark:border-gray-800 py-4 px-6 sticky top-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md z-50">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="font-black text-xl tracking-tighter text-blue-600">CAREER GURU</div>
          <button 
            onClick={copyToClipboard}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-900 rounded-full text-xs font-bold transition-all hover:bg-blue-600 hover:text-white"
          >
            {copied ? <ClipboardCheck size={14}/> : <Share2 size={14}/>}
            {copied ? "Copied Link!" : "Share Portfolio"}
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12 md:py-20">
        {/* Profile Header */}
        <section className="flex flex-col md:flex-row items-center gap-10 mb-20 text-center md:text-left">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <img 
              src={data.personal.avatar || "https://ui-avatars.com/api/?name=" + data.personal.name} 
              className="relative w-40 h-40 rounded-[2.5rem] shadow-2xl border-4 border-white dark:border-gray-900 object-cover" 
              alt="Profile" 
            />
          </div>
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
              <h1 className="text-5xl font-black tracking-tight">{data.personal.name}</h1>
              <span className="w-fit mx-auto md:mx-0 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 text-[10px] font-black uppercase rounded-lg tracking-widest border border-green-200 dark:border-green-800">
                Active Coder
              </span>
            </div>
            <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl leading-relaxed italic mb-6">
              "{data.personal.bio || "Competitive programmer and tech enthusiast."}"
            </p>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {data.personal.skills.map(skill => (
                <span key={skill} className="px-3 py-1 bg-gray-100 dark:bg-gray-900 border dark:border-gray-800 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-bold uppercase">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          <StatCard icon={<Award className="text-yellow-500"/>} label="Total Solved" value={data.stats.totalSolved} />
          <StatCard icon={<Zap className="text-orange-500"/>} label="Platforms" value={Object.keys(data.stats.platforms).filter(p => data.stats.platforms[p] > 0).length} />
          <StatCard icon={<Github className="text-gray-900 dark:text-white"/>} label="GitHub" value={`@${data.personal.github}`} />
          <StatCard icon={<Globe className="text-blue-500"/>} label="Diversity" value={Object.keys(data.stats.topics).length} />
        </div>

        {/* Difficulty & Platform Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Platforms */}
           <div className="lg:col-span-1 bg-gray-50 dark:bg-gray-900/50 p-8 rounded-[2rem] border dark:border-gray-800">
              <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                Platform Activity
              </h3>
              <div className="space-y-4">
                {Object.entries(data.stats.platforms).map(([p, count]) => (
                  <div key={p} className="flex justify-between items-center p-4 bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-800 shadow-sm transition-transform hover:-translate-y-1">
                      <span className="capitalize font-bold text-gray-600 dark:text-gray-400">{p}</span>
                      <span className="text-blue-600 font-black text-xl">{count}</span>
                  </div>
                ))}
              </div>
           </div>

           {/* Expertise */}
           <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border dark:border-gray-800 shadow-2xl shadow-blue-500/5">
              <h3 className="text-lg font-black mb-8 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-purple-500 rounded-full"></div>
                Topic Expertise
              </h3>
              <div className="flex flex-wrap gap-4">
                 {Object.entries(data.stats.topics)
                   .sort((a,b) => b[1]-a[1])
                   .slice(0, 15)
                   .map(([topic, count]) => (
                   <div key={topic} className="group px-5 py-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-blue-600 hover:text-white rounded-2xl text-sm font-bold transition-all cursor-default flex items-center gap-3">
                      <span className="capitalize">{topic}</span>
                      <span className="text-xs bg-white/20 px-2 py-0.5 rounded-lg group-hover:bg-white/40 transition-colors">{count}</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Footer */}
        <footer className="mt-32 text-center text-gray-400 border-t dark:border-gray-800 pt-10">
          <p className="text-sm font-medium">Generated by Career Guru • 2026</p>
        </footer>
      </main>
    </div>
  );
};

const StatCard = ({ icon, label, value }) => (
  <div className="bg-white dark:bg-gray-950 p-6 rounded-3xl border dark:border-gray-800 hover:border-blue-500/50 transition-colors">
    <div className="flex items-center gap-3 mb-3">{icon} <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span></div>
    <div className="text-3xl font-black tracking-tight">{value}</div>
  </div>
);

export default PublicPortfolio;