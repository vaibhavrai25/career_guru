import MainLayout from "../layouts/MainLayout";

const SuggestionItem = ({ text }) => (
  <li className="bg-gray-50 border p-3 rounded">{text}</li>
);

const ResumeAnalyzer = () => {
  return (
    <MainLayout>
      <h1 className="text-3xl font-bold mb-8">Resume Analyzer</h1>

      {/* Upload Section */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow mb-10">
        <h2 className="text-xl font-semibold mb-4">Upload Your Resume</h2>

        <div className="border-2 border-dashed border-gray-300 p-10 text-center rounded-lg">
          <p className="text-gray-500">
            Drag & drop your resume here or click to upload (PDF)
          </p>
          <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded">
            Upload Resume
          </button>
        </div>
      </div>

      {/* Resume Score */}
      <div className="grid grid-cols-3 gap-6 mb-10">
        <div className="bg-green-50 dark:bg-green-900 p-6 rounded-xl shadow text-center">
          <p className="text-gray-500">Resume Score</p>
          <h2 className="text-4xl font-bold text-green-600 mt-2">78 / 100</h2>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900 p-6 rounded-xl shadow text-center">
          <p className="text-gray-500">Missing Keywords</p>
          <h2 className="text-3xl font-bold text-yellow-600 mt-2">12</h2>
        </div>

        <div className="bg-red-50 dark:bg-red-900 p-6 rounded-xl shadow text-center">
          <p className="text-gray-500">Weak Sections</p>
          <h2 className="text-3xl font-bold text-red-600 mt-2">Projects</h2>
        </div>
      </div>

      {/* Suggestions */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-6 text-amber-200">Improvement Suggestions</h2>

        <ul className="space-y-3">
          <SuggestionItem text="Add more quantified achievements in projects." />
          <SuggestionItem text="Include keywords like: REST API, JWT, MongoDB, React." />
          <SuggestionItem text="Add GitHub and live project links." />
          <SuggestionItem text="Improve formatting and section alignment." />
        </ul>
      </div>
    </MainLayout>
  );
};

export default ResumeAnalyzer;
