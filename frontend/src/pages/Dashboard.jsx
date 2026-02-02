import MainLayout from "../layouts/MainLayout";

const Dashboard = () => {
  return (
    <MainLayout>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Cards Row */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold">Total Solved</h2>
          <p className="text-3xl mt-4 text-blue-600">0</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold">Current Streak</h2>
          <p className="text-3xl mt-4 text-green-600">0 days</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold">Strongest Topic</h2>
          <p className="text-2xl mt-4">—</p>
        </div>
      </div>

      {/* Section below */}
      <div className="mt-10 bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">Topic Wise Progress</h2>
        <div className="h-40 flex items-center justify-center text-gray-400">
          (Chart will come here)
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
