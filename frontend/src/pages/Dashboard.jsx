import MainLayout from "../layouts/MainLayout";

const Card = ({ title, value, color }) => (
  <div className="bg-white p-6 rounded-xl shadow flex flex-col">
    <h2 className="text-lg font-semibold text-gray-600">{title}</h2>
    <p className={`text-4xl mt-4 font-bold ${color}`}>{value}</p>
  </div>
);

const Dashboard = () => {
  return (
    <MainLayout>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Top Cards */}
      <div className="grid grid-cols-3 gap-6">
        <Card title="Total Solved" value="128" color="text-blue-600" />
        <Card title="Current Streak" value="7 days" color="text-green-600" />
        <Card title="Strongest Topic" value="Dynamic Programming" color="text-purple-600" />
      </div>

      {/* Charts / Sections */}
      <div className="grid grid-cols-2 gap-6 mt-10">
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">Topic Progress</h2>
          <div className="h-48 flex items-center justify-center text-gray-400">
            Chart Placeholder
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">Consistency Calendar</h2>
          <div className="h-48 flex items-center justify-center text-gray-400">
            GitHub Style Calendar Here
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
