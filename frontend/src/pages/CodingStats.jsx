import { useEffect, useState, useContext } from "react";
import MainLayout from "../layouts/MainLayout";
import { AuthContext } from "../context/AuthContext";
import { getOverview, getConsistency, getHeatmap } from "../api/stats";


const HeatCell = ({ level }) => {
  const colors = [
    "bg-neutral-200",
    "bg-green-200",
    "bg-green-400",
    "bg-green-600",
    "bg-green-800",
  ];
  return <div className={`w-3 h-3 rounded-sm ${colors[level]}`} />;
};

// 🔥 build real heatmap like GitHub
const buildHeatmap = (dates, year) => {
  const map = {};

  dates.forEach((d) => {
    map[d] = (map[d] || 0) + 1;
  });

  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);

  const weeks = [];
  let currentWeek = [];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().split("T")[0];
    const count = map[key] || 0;

    let level = 0;
    if (count >= 4) level = 4;
    else if (count === 3) level = 3;
    else if (count === 2) level = 2;
    else if (count === 1) level = 1;

    currentWeek.push(level);

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length) {
    while (currentWeek.length < 7) currentWeek.push(0);
    weeks.push(currentWeek);
  }

  return weeks;
};

const Heatmap = ({ dates, year }) => {
  const weeks = buildHeatmap(dates, year);

  return (
    <div className="flex gap-1 mt-6 overflow-x-auto">
      {weeks.map((week, i) => (
        <div key={i} className="flex flex-col gap-1">
          {week.map((lvl, j) => (
            <HeatCell key={j} level={lvl} />
          ))}
        </div>
      ))}
    </div>
  );
};

const CodingStats = () => {
  const { user } = useContext(AuthContext);

  const [overview, setOverview] = useState({});
  const [consistency, setConsistency] = useState({});
  const [heatDates, setHeatDates] = useState([]);

  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const load = async () => {
      const token = user.token;

      const ov = await getOverview(token);
      const cs = await getConsistency(token);
      const hm = await getHeatmap(token);

      setOverview(ov.data);
      setConsistency(cs.data);
      setHeatDates(hm.data); // array of dates from DB
    };

    if (user) load();
  }, [user]);

  return (
    <MainLayout>
      <h1 className="text-3xl font-bold mb-10 text-neutral-800">
        Coding Analytics
      </h1>

      {/* ===== Overview Cards ===== */}
      <div className="grid grid-cols-3 gap-8">
        <Card
          title="Total Solved"
          value={overview.totalSolved}
          color="text-blue-600"
        />
        <Card
          title="Current Streak"
          value={`${consistency.currentStreak} days`}
          color="text-green-600"
        />
        <Card
          title="Longest Streak"
          value={`${consistency.longestStreak} days`}
          color="text-orange-600"
        />
      </div>

      {/* ===== Heatmap Section ===== */}
      <div className="mt-14 p-8 rounded-xl border bg-neutral-50 shadow-sm">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            Yearly Activity Heatmap
          </h2>

          <div className="flex gap-3">
            {[2023, 2024, 2025, 2026].map((y) => (
              <button
                key={y}
                onClick={() => setYear(y)}
                className={`px-3 py-1 rounded ${
                  year === y
                    ? "bg-blue-600 text-white"
                    : "bg-neutral-200"
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 text-sm text-neutral-600">
          🔥 Max Streak: {consistency.longestStreak} days &nbsp;&nbsp;
          ⚡ Current: {consistency.currentStreak} days
        </div>

        <Heatmap dates={heatDates} year={year} />
      </div>
    </MainLayout>
  );
};

const Card = ({ title, value, color }) => (
  <div className="p-6 rounded-xl border bg-neutral-50 shadow-sm">
    <p className="text-neutral-500">{title}</p>
    <p className={`text-3xl font-bold mt-2 ${color}`}>{value || 0}</p>
  </div>
);

export default CodingStats;
