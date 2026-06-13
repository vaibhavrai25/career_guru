import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { uploadAndAnalyzeResume } from "../api/resume";
import {
  AlertTriangle,
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  FileText,
  Loader2,
  UploadCloud,
} from "lucide-react";

const emptyForm = {
  resumeName: "",
  targetRole: "Software Engineer Intern",
  targetCompany: "",
  jobDescription: "",
  isPrimary: true,
};

const ResumeUpload = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const buildFormData = () => {
    const formData = new FormData();
    formData.append("resume", file);
    formData.append("resumeName", form.resumeName);
    formData.append("targetRole", form.targetRole);
    formData.append("targetCompany", form.targetCompany);
    formData.append("jobDescription", form.jobDescription);
    formData.append("isPrimary", String(form.isPrimary));
    return formData;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a PDF resume to upload.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await uploadAndAnalyzeResume(buildFormData());
      const resumeId = data?.document?._id;

      if (!resumeId) throw new Error("Document processed, but ID was not returned.");

      navigate(`/resume/${resumeId}`, {
        replace: true,
        state: { message: "Document uploaded and analyzed successfully." },
      });
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to process document.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8 animate-fadeIn">
        
        {/* Navigation & Header */}
        <div>
          <button onClick={() => navigate("/resume")} className="inline-flex items-center gap-2 text-zinc-500 hover:text-white text-xs font-semibold transition-colors mb-6">
            <ArrowLeft size={14} /> Back to Vault
          </button>
          <h1 className="text-3xl font-bold text-white tracking-tight">Upload Document</h1>
          <p className="text-sm text-zinc-400 font-medium mt-2">
            Upload your PDF resume and provide target role details to generate an optimization report.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300 flex items-center gap-2">
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="rounded-2xl border border-white/[0.04] bg-zinc-900/40 p-6 sm:p-8 shadow-sm space-y-6">
          
          {/* Dropzone */}
          <label className={`flex flex-col items-center justify-center gap-3 h-40 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${file ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/[0.1] bg-zinc-900/50 hover:border-zinc-500'}`}>
            {file ? (
              <>
                <FileText size={32} className="text-blue-500" />
                <div className="text-center">
                  <p className="text-sm text-white font-bold">{file.name}</p>
                  <p className="text-xs text-blue-400 mt-1 font-medium">Ready for upload</p>
                </div>
              </>
            ) : (
              <>
                <UploadCloud size={32} className="text-zinc-500" />
                <div className="text-center">
                  <p className="text-sm text-white font-bold">Select PDF Document</p>
                  <p className="text-xs text-zinc-500 mt-1 font-medium">Text-based PDFs yield the best parsing results.</p>
                </div>
              </>
            )}
            <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" />
          </label>

          <Input
            label="Document Name (Optional)"
            value={form.resumeName}
            onChange={(val) => setForm({ ...form, resumeName: val })}
            placeholder="e.g., Frontend Engineer - Google"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Target Role"
              value={form.targetRole}
              onChange={(val) => setForm({ ...form, targetRole: val })}
              placeholder="e.g., SDE Intern"
              icon={<BriefcaseBusiness size={16} />}
            />
            <Input
              label="Target Company (Optional)"
              value={form.targetCompany}
              onChange={(val) => setForm({ ...form, targetCompany: val })}
              placeholder="e.g., Microsoft"
              icon={<Building2 size={16} />}
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 font-semibold mb-1.5 block">Job Description</label>
            <textarea
              value={form.jobDescription}
              onChange={(e) => setForm({ ...form, jobDescription: e.target.value })}
              placeholder="Paste the target job description to check alignment..."
              className="w-full h-40 bg-zinc-900/80 border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none focus:border-blue-500/50 transition-colors resize-none"
            />
          </div>

          <label className="flex items-center justify-between rounded-xl bg-zinc-800/30 border border-white/[0.03] p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors">
            <div>
              <span className="text-sm text-white font-semibold block">Set as Primary</span>
              <span className="text-xs text-zinc-500 font-medium">Use this document for general readiness calculations.</span>
            </div>
            <input
              type="checkbox"
              checked={form.isPrimary}
              onChange={(e) => setForm({ ...form, isPrimary: e.target.checked })}
              className="w-4 h-4 rounded border-zinc-600 text-blue-600 focus:ring-blue-500/20"
            />
          </label>

          <button
            type="submit"
            disabled={!file || loading}
            className="w-full py-3.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Processing Document...</> : "Upload & Generate Report"}
          </button>
        </form>
      </div>
    </MainLayout>
  );
};

const Input = ({ label, value, onChange, placeholder, icon }) => (
  <div>
    <label className="text-xs text-zinc-400 font-semibold mb-1.5 block">{label}</label>
    <div className="relative">
      {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">{icon}</div>}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-zinc-900/80 border border-white/[0.05] rounded-xl px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-blue-500/50 transition-colors ${icon ? "pl-11" : ""}`}
      />
    </div>
  </div>
);

export default ResumeUpload;