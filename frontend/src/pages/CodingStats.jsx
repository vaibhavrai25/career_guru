import { useState } from "react";
import MainLayout from "../layouts/MainLayout";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ===== Dummy rating timeline by month =====
const ratingTimeline = [
  { month: "Jan 24", rating: 1200 },
  { month: "Feb 24", rating: 1280 },
  { month: "Mar 24", rating: 1340 },
  { month: "Apr 24", rating: 1400 },
  { month: "May 24", rating: 1510 },
  { month: "Jun 24", rating: 1620 },
  { month: "Jul 24", rating: 1580 },
  { month: "Aug 24", rating: 1700 },
];

const RatingCard = ({ title, color }) => {
  const maxRating = Math.max(...ratingTimeline.map(r => r.rating));
  const currentRating = ratingTimeline[ratingTimeline.length - 1].rating;

  return (
    <div className="p-6 rounded-xl border border-neutral-200 bg-neutral-50 shadow-sm">
      <div className="flex justify-between items-center mb-4 text-neutral-800">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="text-right">
          <p className="text-sm text-neutral-500">Max Rating</p>
          <p className="font-bold">{maxRating}</p>
          <p className="text-sm text-neutral-500 mt-1">Current</p>
          <p className="font-bold">{currentRating}</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={ratingTimeline}>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="rating"
            stroke={color}
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

//
// ✅ Proper Month‑wise Heatmap like LeetCode
//

const months = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec"
];

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

const Heatmap = () => {
  // 53 weeks × 7 days
  const weeks = Array.from({ length: 53 }, () =>
    Array.from({ length: 7 }, () =>
      Math.floor(Math.random() * 5)
    )
  );

  return (
    <div className="mt-8">
      {/* Month labels */}
      <div className="flex justify-between text-xs text-neutral-600 mb-2 px-4">
        {months.map(m => (
          <span key={m}>{m}</span>
        ))}
      </div>

      {/* Heat grid */}
      <div className="flex gap-0.5">
        {weeks.map((week, i) => (
          <div key={i} className="flex flex-col gap-0.5">
            {week.map((lvl, j) => (
              <HeatCell key={j} level={lvl} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

const CodingStats = () => {
  const [platform, setPlatform] = useState("LeetCode");
  const [year, setYear] = useState(2025);

  return (
    <MainLayout>
      <h1 className="text-3xl font-bold mb-8 text-neutral-800">
        Coding Analytics
      </h1>

      {/* ===== Rating Section ===== */}
      <div className="grid grid-cols-2 gap-8">
        <RatingCard title="Codeforces Rating" color="#3b82f6" />
        <RatingCard title="LeetCode Rating" color="#10b981" />
      </div>

      {/* ===== Heatmap Section ===== */}
      <div className="mt-14 p-8 rounded-xl border border-neutral-200 bg-neutral-50 shadow-sm">
        <div className="flex justify-between items-center text-neutral-800">
          <h2 className="text-xl font-semibold">Yearly Activity Heatmap</h2>

          {/* Year Toggle */}
          <div className="flex gap-3">
            {[2023, 2024, 2025].map(y => (
              <button
                key={y}
                onClick={() => setYear(y)}
                className={`px-3 py-1 rounded ${
                  year === y
                    ? "bg-blue-600 text-white"
                    : "bg-neutral-200 text-neutral-800"
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        {/* Platform Toggle */}
        <div className="flex gap-4 mt-4">
          {["LeetCode", "Codeforces", "GitHub"].map(p => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={`px-4 py-2 rounded-lg border ${
                platform === p
                  ? "bg-blue-600 text-white"
                  : "bg-neutral-200 text-neutral-800"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Streak Info */}
        <div className="flex gap-10 mt-6 text-sm text-neutral-700">
          <p>
            🔥 <span className="font-semibold">Max Streak:</span> 27 days
          </p>
          <p>
            ⚡ <span className="font-semibold">Current Streak:</span> 6 days
          </p>
          <p className="text-neutral-500">
            Showing {platform} activity for {year}
          </p>
        </div>

        <Heatmap />
      </div>
    </MainLayout>
  );
};

export default CodingStats;
