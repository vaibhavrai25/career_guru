import { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { getSummary } from "../api/stats";

const Card = ({ title, value, color }) => (
  <div className="bg-white p-6 rounded-xl shadow flex flex-col">
    <h2 className="text-lg font-semibold text-gray-600">{title}</h2>
    <p className={`text-4xl mt-4 font-bold ${color}`}>{value}</p>
  </div>
);

const Dashboard = () => {
  const [data, setData] = useState({
    totalSolved: 0,
    streak: 0,
    strongestTopic: "-",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await getSummary(token);
        setData(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, []);

  return (
    <MainLayout>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Top Cards */}
      <div className="grid grid-cols-3 gap-6">
        <Card
          title="Total Solved"
          value={data.totalSolved}
          color="text-blue-600"
        />
        <Card
          title="Current Streak"
          value={`${data.streak} days`}
          color="text-green-600"
        />
        <Card
          title="Strongest Topic"
          value={data.strongestTopic}
          color="text-purple-600"
        />
      </div>

      {/* Topics preview */}
      <div className="bg-white p-6 rounded-xl shadow mt-10">
        <h2 className="text-xl font-semibold mb-4">Topic Wise Progress</h2>

        <div className="grid grid-cols-4 gap-4 text-sm">
          {Object.entries(data.topics || {}).slice(0, 8).map(([topic, count]) => (
            <div
              key={topic}
              className="flex justify-between bg-gray-50 p-3 rounded"
            >
              <span>{topic}</span>
              <span className="font-semibold">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
