import MainLayout from "../layouts/MainLayout";

const ResourceCard = ({ title, source, link }) => (
  <div className="bg-gray-50 border rounded-lg p-4 hover:shadow transition">
    <h4 className="font-semibold text-lg">{title}</h4>
    <p className="text-sm text-gray-500 mt-1">{source}</p>
    <a
      href={link}
      target="_blank"
      rel="noreferrer"
      className="text-blue-600 text-sm mt-2 inline-block"
    >
      Visit Resource →
    </a>
  </div>
);

const StudyPlan = () => {
  return (
    <MainLayout>
      <h1 className="text-3xl font-bold mb-8">Your Personalized Study Plan</h1>

      {/* Weak Topic Highlight */}
      <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded mb-10">
        <h2 className="text-xl font-semibold text-red-600">Focus Topic: Segment Tree</h2>
        <p className="text-gray-600 mt-2">
          You have solved very few problems in this topic. Strengthening this
          will significantly improve your performance in contests and interviews.
        </p>
      </div>

      {/* Theory Section */}
      <div className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">📘 Learn the Theory</h2>
        <div className="grid grid-cols-3 gap-6">
          <ResourceCard
            title="Segment Tree Explained"
            source="GeeksforGeeks"
            link="#"
          />
          <ResourceCard
            title="Segment Tree Visual Guide"
            source="YouTube - Abdul Bari"
            link="#"
          />
          <ResourceCard
            title="Segment Tree Notes"
            source="CP Algorithms"
            link="#"
          />
        </div>
      </div>

      {/* Practice Questions */}
      <div className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">💻 Practice Questions</h2>
        <div className="grid grid-cols-2 gap-6">
          <ResourceCard
            title="CF - Range Sum Query"
            source="Codeforces"
            link="#"
          />
          <ResourceCard
            title="LC - Segment Tree Implementation"
            source="LeetCode"
            link="#"
          />
          <ResourceCard
            title="CF - Xenia and Bit Operations"
            source="Codeforces"
            link="#"
          />
          <ResourceCard
            title="LC - Count of Smaller Numbers"
            source="LeetCode"
            link="#"
          />
        </div>
      </div>

      {/* Roadmap */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-2xl font-semibold mb-4">🗺️ Suggested Roadmap</h2>
        <ul className="space-y-3 text-gray-700">
          <li>✅ Day 1: Understand basics and build segment tree</li>
          <li>✅ Day 2: Solve 5 easy problems</li>
          <li>✅ Day 3: Solve 5 medium problems</li>
          <li>✅ Day 4: Attempt 2 hard problems</li>
          <li>✅ Day 5: Revise and reimplement from scratch</li>
        </ul>
      </div>
    </MainLayout>
  );
};

export default StudyPlan;
