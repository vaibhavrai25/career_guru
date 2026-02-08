import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Github, ExternalLink, Award, Code, Zap } from "lucide-react";

const PublicPortfolio = () => {
  const { username } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/profile/u/${username}`);
        setData(res.data);
      } catch (err) { console.error("Portfolio not found"); }
      setLoading(false);
    };
    fetchPublicData();
  }, [username]);

  if (loading) return <div className="h-screen flex items-center justify-center font-bold">Analysing Portfolio...</div>;
  if (!data) return <div className="h-screen flex items-center justify-center">Profile not found or set to private.</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row items-center gap-8 mb-16">
          <img src={data.personal.avatar} className="w-32 h-32 rounded-3xl shadow-2xl border-4 border-white dark:border-gray-800" alt="Profile" />
          <div className="text-center md:text-left">
            <h1 className="text-5xl font-black mb-2">{data.personal.name}</h1>
            <p className="text-xl text-gray-500 max-w-xl">{data.personal.bio}</p>
            <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
              {data.personal.skills.map(skill => (
                <span key={skill} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full text-xs font-bold uppercase">{skill}</span>
              ))}
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard icon={<Award className="text-yellow-500"/>} label="Total Solved" value={data.stats.totalSolved} />
          <StatCard icon={<Code className="text-blue-500"/>} label="Platforms" value={Object.keys(data.stats.platforms).length} />
          <StatCard icon={<Zap className="text-purple-500"/>} label="GitHub" value={`@${data.personal.github}`} />
        </div>

        {/* Detailed Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border dark:border-gray-800">
              <h3 className="text-xl font-black mb-6 flex items-center gap-2 underline decoration-blue-500">Platform Split</h3>
              {Object.entries(data.stats.platforms).map(([p, count]) => (
                <div key={p} className="flex justify-between items-center mb-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                    <span className="capitalize font-bold">{p}</span>
                    <span className="text-blue-500 font-black">{count}</span>
                </div>
              ))}
           </div>

           <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border dark:border-gray-800">
              <h3 className="text-xl font-black mb-6 flex items-center gap-2 underline decoration-green-500">Topic Expertise</h3>
              <div className="flex flex-wrap gap-3">
                 {Object.entries(data.stats.topics).sort((a,b) => b[1]-a[1]).slice(0, 10).map(([topic, count]) => (
                   <div key={topic} className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm font-medium">
                      {topic} <span className="text-gray-400 ml-1">×{count}</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value }) => (
  <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border dark:border-gray-800 shadow-sm">
    <div className="flex items-center gap-3 mb-2">{icon} <span className="text-xs font-bold text-gray-400 uppercase">{label}</span></div>
    <div className="text-3xl font-black">{value}</div>
  </div>
);

export default PublicPortfolio;