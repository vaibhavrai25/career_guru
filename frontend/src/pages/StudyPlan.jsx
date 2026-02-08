import { useEffect, useState, useContext } from "react";
import MainLayout from "../layouts/MainLayout";
import { AuthContext } from "../context/AuthContext";
import { getStudyPlan, getStudyTopics, getTodayTasks, toggleTask } from "../api/studyPlan";

const ProgressBar = ({ total, completed }) => {
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded h-2 mt-2">
      <div className="bg-green-500 h-2 rounded transition-all duration-500" style={{ width: `${percent}%` }} />
    </div>
  );
};

const StudyPlan = () => {
  const { user } = useContext(AuthContext);
  const [plan, setPlan] = useState(null);
  const [topics, setTopics] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const planRes = await getStudyPlan();
      setPlan(planRes.data);
      const topicsRes = await getStudyTopics(planRes.data._id);
      setTopics(topicsRes.data);
      const tasksRes = await getTodayTasks();
      setTasks(tasksRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const handleToggle = async (id) => {
    try {
      await toggleTask(id);
      loadData(); // Refresh counts
    } catch (err) {
      console.error("Toggle error:", err);
    }
  };

  if (loading) return <MainLayout><p>Analyzing your performance...</p></MainLayout>;

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">AI Personalized Mentor</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Sync Stats</button>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 p-6 rounded mb-10">
        <h2 className="text-xl font-semibold text-blue-700 dark:text-blue-300">
          Focus: {plan?.focusTopic || "Data Structures"}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">{plan?.reason || "Priority based on recent Codeforces performance."}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Progress List */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Topic Progress</h2>
          <div className="space-y-4">
            {topics.map((t) => (
              <div key={t._id} className="bg-white dark:bg-gray-800 p-4 rounded shadow">
                <h3 className="font-semibold">{t.name}</h3>
                <ProgressBar total={t.totalTasks} completed={t.completedTasks} />
              </div>
            ))}
          </div>
        </div>

        {/* Checklist */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Today's Roadmap</h2>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow space-y-3">
            {tasks.length > 0 ? tasks.map((task) => (
              <div key={task._id} className="flex items-center gap-4 p-3 border-b dark:border-gray-700">
                <input type="checkbox" className="w-5 h-5" checked={task.completed} onChange={() => handleToggle(task._id)} />
                <span className={task.completed ? "line-through text-gray-400" : ""}>{task.title}</span>
              </div>
            )) : <p className="text-gray-500">No tasks for today. Keep coding!</p>}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default StudyPlan;