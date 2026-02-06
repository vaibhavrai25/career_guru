import { useEffect, useState, useContext } from "react";
import MainLayout from "../layouts/MainLayout";
import { AuthContext } from "../context/AuthContext";
import {
  getStudyPlan,
  getStudyTopics,
  getTodayTasks,
  toggleTask,
} from "../api/studyPlan";

const ProgressBar = ({ total, completed }) => {
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return (
    <div className="w-full bg-gray-200 rounded h-2 mt-2">
      <div
        className="bg-green-500 h-2 rounded"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
};

const StudyPlan = () => {
  const { user } = useContext(AuthContext);

  const [plan, setPlan] = useState(null);
  const [topics, setTopics] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const token = user.token;

        const planRes = await getStudyPlan(token);
        setPlan(planRes.data);

        const topicsRes = await getStudyTopics(planRes.data._id, token);
        setTopics(topicsRes.data);

        const tasksRes = await getTodayTasks(token);
        setTasks(tasksRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user) load();
  }, [user]);

  const handleToggle = async (id) => {
    await toggleTask(id, user.token);
    const updated = await getTodayTasks(user.token);
    setTasks(updated.data);
  };

  if (loading) {
    return (
      <MainLayout>
        <p className="text-gray-500">Loading study plan...</p>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <h1 className="text-3xl font-bold mb-8">Your Study Plan</h1>

      {/* 🔥 Focus Topic */}
      <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded mb-10">
        <h2 className="text-xl font-semibold text-red-600">
          Focus Topic: {plan.focusTopic || "Segment Tree"}
        </h2>
        <p className="text-gray-600 mt-2">
          {plan.reason || "Low practice detected in this topic"}
        </p>
      </div>

      {/* 📊 Topic Progress */}
      <div className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">📊 Topic Progress</h2>
        <div className="grid grid-cols-2 gap-6">
          {topics.map((t) => (
            <div key={t._id} className="bg-white p-4 rounded shadow">
              <h3 className="font-semibold">{t.name}</h3>
              <p className="text-sm text-gray-500">
                {t.completedTasks}/{t.totalTasks} tasks completed
              </p>
              <ProgressBar
                total={t.totalTasks}
                completed={t.completedTasks}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ✅ Today Checklist */}
      <div className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">✅ Today’s Tasks</h2>
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task._id}
              className="flex items-center gap-3 bg-gray-50 p-3 rounded"
            >
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => handleToggle(task._id)}
              />
              <div>
                <p className={task.completed ? "line-through text-gray-400" : ""}>
                  {task.title}
                </p>
                <p className="text-xs text-gray-500">
                  {task.topicId?.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default StudyPlan;
