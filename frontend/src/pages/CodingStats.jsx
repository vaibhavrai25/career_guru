import { useEffect, useState, useContext } from "react";
import MainLayout from "../layouts/MainLayout";
import { AuthContext } from "../context/AuthContext";
import { getOverview, getConsistency, getHeatmap } from "../api/stats";

const CodingStats = () => {
  const { user } = useContext(AuthContext);
  const [overview, setOverview] = useState({ totalSolved: 0 });
  const [consistency, setConsistency] = useState({ currentStreak: 0, longestStreak: 0 });
  const [heatDates, setHeatDates] = useState([]);
  const [year, setYear] = useState(2026);

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  useEffect(() => {
    const load = async () => {
      try {
        const [ov, cs, hm] = await Promise.all([getOverview(), getConsistency(), getHeatmap()]);
        setOverview(ov.data);
        setConsistency(cs.data);
        setHeatDates(hm.data); 
      } catch (err) { console.error("Stats load failed:", err); }
    };
    if (user) load();
  }, [user]);

  // Helper function to get days in a month
  const getDaysInMonth = (monthIdx, year) => {
    return new Date(year, monthIdx + 1, 0).getDate();
  };

  return (
    <MainLayout>
      <h1 className="text-3xl font-bold mb-8">Performance Analytics</h1>
      
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatCard title="Total Solved" value={overview.totalSolved} />
        <StatCard title="Active Streak" value={`${consistency.currentStreak} days`} />
        <StatCard title="All-time Best" value={`${consistency.longestStreak} days`} />
      </div>

      {/* Segregated Heatmap Section */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h2 className="text-xl font-bold">Submission Heatmap</h2>
          <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-lg">
            {[2024, 2025, 2026].map(y => (
              <button 
                key={y} 
                onClick={() => setYear(y)} 
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  year === y 
                    ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' 
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
        
        {/* Month-wise Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {months.map((month, idx) => {
            const monthNum = String(idx + 1).padStart(2, '0');
            const monthPrefix = `${year}-${monthNum}`;
            const daysInMonth = getDaysInMonth(idx, year);
            const activeDatesInMonth = heatDates.filter(d => d.startsWith(monthPrefix));

            return (
              <div key={month} className="flex flex-col">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-tight">{month}</span>
                  <span className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 px-2 py-0.5 rounded-full">
                    {activeDatesInMonth.length} active
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-1.5">
                  {[...Array(daysInMonth)].map((_, i) => {
                    const day = String(i + 1).padStart(2, '0');
                    const fullDate = `${monthPrefix}-${day}`;
                    const isActive = heatDates.includes(fullDate);
                    
                    return (
                      <div 
                        key={i} 
                        title={isActive ? `Solved on ${fullDate}` : `No activity`}
                        className={`w-3.5 h-3.5 rounded-xs transition-colors duration-300 ${
                          isActive 
                            ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' 
                            : 'bg-gray-100 dark:bg-gray-700/50'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 pt-6 border-t dark:border-gray-700 flex items-center justify-between text-[11px] text-gray-500 italic">
          <p>Visualization grouped by submission months for {year}.</p>
          <div className="flex items-center gap-2">
             <span>Less</span>
             <div className="w-3 h-3 bg-gray-100 dark:bg-gray-700 rounded-sm"></div>
             <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
             <span>More</span>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

const StatCard = ({ title, value }) => (
  <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm transition-transform hover:scale-[1.02]">
    <p className="text-gray-400 text-xs uppercase tracking-widest font-semibold">{title}</p>
    <p className="text-3xl font-bold mt-2 text-blue-500">{value || 0}</p>
  </div>
);

export default CodingStats;