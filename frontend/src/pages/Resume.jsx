import { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import api from "../api/axios";

const ResumeAnalyzer = () => {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Fetch previous analysis on load
  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await api.get("/ai/analysis-result");
        setAnalysis(res.data);
      } catch (err) { console.log("No previous analysis found"); }
    };
    fetchResult();
  }, []);

  const handleUpload = async () => {
    if (!file) return alert("Please select a file first");
    
    const formData = new FormData();
    formData.append("resume", file);
    
    setUploading(true);
    try {
      await api.post("/resume/upload", formData);
      const res = await api.post("/ai/analyze-resume");
      setAnalysis(res.data);
      alert("Analysis complete!");
    } catch (err) {
      alert("Upload or analysis failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <MainLayout>
      <h1 className="text-3xl font-bold mb-8">AI Resume Insights</h1>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md mb-8 transition-colors">
        <h2 className="text-xl font-semibold mb-4">Update Resume</h2>
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 p-8 rounded-lg">
          <input 
            type="file" 
            accept=".pdf" 
            onChange={(e) => setFile(e.target.files[0])}
            className="mb-4 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <button 
            onClick={handleUpload}
            disabled={uploading}
            className={`px-8 py-2 rounded-lg font-bold text-white transition-colors ${uploading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {uploading ? "Analyzing..." : "Analyze PDF"}
          </button>
        </div>
      </div>

      {analysis && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <ResultCard title="ATS Score" value={`${analysis.ats_score}%`} color="text-green-500" />
            <ResultCard title="Missing Skills" value={analysis.missing_skills_for_sde?.length || 0} color="text-yellow-500" />
            <ResultCard title="Level" value={analysis.experience_level || "N/A"} color="text-blue-500" />
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-blue-600 dark:text-blue-400">Guru Suggestions</h2>
            <ul className="space-y-2">
              {analysis.suggestions?.map((s, i) => (
                <li key={i} className="p-3 bg-gray-50 dark:bg-gray-700 rounded border dark:border-gray-600">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </MainLayout>
  );
};

const ResultCard = ({ title, value, color }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center transition-colors">
    <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</p>
    <p className={`text-4xl font-bold mt-2 ${color}`}>{value}</p>
  </div>
);

export default ResumeAnalyzer;