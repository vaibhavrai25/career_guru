import { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { getSummary } from "../api/stats";
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, 
  PieChart, Pie, Cell, Tooltip, Legend 
} from 'recharts';

const Card = ({ title, value, color, subtitle }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all border dark:border-gray-700">
    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">{title}</h2>
    <p className={`text-4xl mt-2 font-black ${color}`}>{value ?? 0}</p>
    {subtitle && <p className="text-[10px] text-gray-400 mt-2 font-medium uppercase tracking-tighter">{subtitle}</p>}
  </div>
);

const Dashboard = () => {
  const [data, setData] = useState({
    totalSolved: 0,
    streak: 0,
    strongestTopic: "Loading...",
    irs: 0,
    difficultyStats: { easy: 0, medium: 0, hard: 0 },
    topics: {}
  });
  const [loadingTask, setLoadingTask] = useState(false);
  const [aiTask, setAiTask] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getSummary();
        setData(prev => ({
          ...prev,
          ...res.data,
          difficultyStats: res.data.difficultyStats || prev.difficultyStats,
          topics: res.data.topics || prev.topics
        }));
      } catch (err) {
        console.error("Dashboard load failed:", err);
      }
    };
    fetchData();
  }, []);

  const getRadarData = () => {
    const groups = {
      "Logic": ["recursion", "bitmask", "greedy", "backtracking", "dp"],
      "Data Structures": ["arrays", "strings", "stacks", "queues", "trees", "graphs"],
      "Algorithms": ["sorting", "searching", "implementation", "two pointers"],
      "Math": ["math", "number theory", "geometry", "combinatorics"],
    };

    return Object.entries(groups).map(([group, tags]) => ({
      subject: group,
      A: tags.reduce((sum, tag) => sum + (data.topics?.[tag.toLowerCase()] || 0), 0),
      fullMark: 100, // Increased for multi-platform volume
    }));
  };

  const pieData = [
    { name: 'Easy', value: data.difficultyStats?.easy || 0, color: '#22c55e' },
    { name: 'Medium', value: data.difficultyStats?.medium || 0, color: '#eab308' },
    { name: 'Hard', value: data.difficultyStats?.hard || 0, color: '#ef4444' },
  ];

  const handleGenerateTask = async () => {
    setLoadingTask(true);
    // Placeholder for Gemini API Logic later
    setTimeout(() => {
      setAiTask({
        title: "Level Up: Recursion Master",
        desc: `Based on your low score in Logic, solve "Combination Sum" on LeetCode.`,
        link: "https://leetcode.com/problems/combination-sum/"
      });
      setLoadingTask(false);
    }, 1500);
  };

  return (
    <MainLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Dashboard</h1>
          <p className="text-gray-500 font-medium">Your progress across all platforms</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border dark:border-gray-700 flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Interview Readiness</p>
            <div className="text-3xl font-black text-blue-600">{data.irs || 0}%</div>
          </div>
          {data.irs >= 70 && (
            <div className="bg-green-500 text-white text-[10px] px-3 py-1 rounded-full font-black animate-pulse shadow-lg shadow-green-500/30">TOP TIER</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card 
          title="Total Solved" 
          value={data.totalSolved} 
          color="text-blue-600 dark:text-blue-400" 
          subtitle="LeetCode + Codeforces + CodeChef" 
        />
        <Card 
          title="Current Streak" 
          value={`${data.streak || 0} Days`} 
          color="text-green-600 dark:text-green-400" 
          subtitle="Consistency is power" 
        />
        <Card 
          title="Strongest Area" 
          value={data.strongestTopic} 
          color="text-purple-600 dark:text-purple-400" 
          subtitle="Based on total tags" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border dark:border-gray-700">
          <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
            <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
            Programming Shape
          </h2>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={getRadarData()}>
                <PolarGrid stroke="#e5e7eb" className="dark:opacity-10" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 'bold' }} />
                <Radar name="Solved" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border dark:border-gray-700">
          <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
            <span className="w-2 h-6 bg-yellow-500 rounded-full"></span>
            Difficulty Distribution
          </h2>
          <div className="h-[350px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={80} outerRadius={110} paddingAngle={8} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={index} fill={entry.color} stroke="none" />)}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-12 text-center pointer-events-none">
                <p className="text-xs text-gray-400 font-bold uppercase">Total</p>
                <p className="text-3xl font-black">{data.totalSolved}</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Task Section */}
      <div className="bg-gradient-to-br from-blue-700 to-indigo-900 p-10 rounded-[2.5rem] shadow-2xl shadow-blue-500/20 text-white mb-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="max-w-xl">
            <h2 className="text-3xl font-black mb-4">AI Mentor Analysis</h2>
            <p className="text-blue-100 text-lg leading-relaxed">We analyze your patterns across all 3 platforms to find your weakest topics. Ready to level up?</p>
          </div>
          <button 
            onClick={handleGenerateTask}
            disabled={loadingTask}
            className="bg-white text-blue-900 px-10 py-4 rounded-2xl font-black hover:scale-105 transition-all disabled:opacity-50 shadow-xl"
          >
            {loadingTask ? "Analyzing..." : "Generate Task"}
          </button>
        </div>
        
        {aiTask && (
          <div className="mt-10 p-8 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 animate-in fade-in slide-in-from-bottom-5">
            <h3 className="text-xl font-bold flex items-center gap-2 tracking-tight">✨ {aiTask.title}</h3>
            <p className="mt-3 text-blue-50 text-lg opacity-80">{aiTask.desc}</p>
            <a href={aiTask.link} target="_blank" rel="noreferrer" className="inline-block mt-6 text-sm font-black bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-400 transition-colors">Solve Now</a>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Dashboard;