import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { uploadAndAnalyzeResume } from "../api/resume";
import {
  AlertTriangle,
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  FileSearch,
  Loader2,
  Sparkles,
} from "lucide-react";

const emptyForm = {
  resumeName: "",
  targetRole: "SDE Intern",
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
      setError("Select a PDF resume first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await uploadAndAnalyzeResume(buildFormData());
      const resumeId = data?.document?._id;

      if (!resumeId) {
        throw new Error("Resume uploaded, but resume ID was not returned.");
      }

      navigate(`/resume/${resumeId}`, {
        replace: true,
        state: {
          freshAnalysis: true,
          message: "Resume uploaded and analyzed successfully.",
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Resume upload/analyze failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <button
          onClick={() => navigate("/resume")}
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-blue-400 text-xs font-bold uppercase tracking-widest"
        >
          <ArrowLeft size={14} />
          Back to Resume Vault
        </button>

        <div>
          <p className="text-[9px] text-blue-500 font-black uppercase tracking-[0.45em]">
            Resume Intelligence
          </p>
          <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">
            Upload & Analyze
          </h1>
          <p className="text-sm text-zinc-500 mt-2">
            Upload a targeted resume. After analysis, you will be redirected to its analysis page.
          </p>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300 flex items-center gap-2">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-white/[0.04] bg-zinc-900/40 p-8 shadow-2xl space-y-6"
        >
          <label className="flex items-center justify-center gap-4 h-44 rounded-3xl border border-dashed border-white/[0.1] bg-zinc-950/60 cursor-pointer hover:border-blue-500/40 transition-all">
            <FileSearch size={28} className="text-blue-500" />
            <div>
              <p className="text-sm text-white font-black uppercase tracking-widest">
                {file ? file.name : "Select PDF Resume"}
              </p>
              <p className="text-xs text-zinc-600 mt-1">
                Only text-based PDF resumes are supported.
              </p>
            </div>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>

          <Input
            label="Resume Name"
            value={form.resumeName}
            onChange={(value) => setForm({ ...form, resumeName: value })}
            placeholder="Google SDE Intern Resume"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Target Role"
              value={form.targetRole}
              onChange={(value) => setForm({ ...form, targetRole: value })}
              placeholder="SDE Intern"
              icon={<BriefcaseBusiness size={14} />}
            />

            <Input
              label="Target Company"
              value={form.targetCompany}
              onChange={(value) => setForm({ ...form, targetCompany: value })}
              placeholder="Google"
              icon={<Building2 size={14} />}
            />
          </div>

          <div>
            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-2 block">
              Job Description
            </label>
            <textarea
              value={form.jobDescription}
              onChange={(e) =>
                setForm({ ...form, jobDescription: e.target.value })
              }
              placeholder="Paste the target job description here..."
              className="w-full h-56 bg-zinc-950/60 border border-white/[0.05] rounded-2xl px-4 py-3 text-sm text-zinc-200 outline-none focus:border-blue-500/40 resize-none"
            />
          </div>

          <label className="flex items-center justify-between rounded-2xl bg-black/20 border border-white/[0.04] p-4">
            <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">
              Mark as primary resume
            </span>
            <input
              type="checkbox"
              checked={form.isPrimary}
              onChange={(e) =>
                setForm({ ...form, isPrimary: e.target.checked })
              }
            />
          </label>

          <button
            type="submit"
            disabled={!file || loading}
            className="w-full px-6 py-4 rounded-2xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Uploading, parsing and analyzing...
              </span>
            ) : (
              <span className="inline-flex items-center justify-center gap-2">
                <Sparkles size={16} />
                Upload & Analyze
              </span>
            )}
          </button>
        </form>
      </div>
    </MainLayout>
  );
};

const Input = ({ label, value, onChange, placeholder, icon }) => (
  <div>
    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-2 block">
      {label}
    </label>

    <div className="relative">
      {icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600">
          {icon}
        </div>
      )}

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-zinc-950/60 border border-white/[0.05] rounded-2xl px-4 py-3 text-sm text-zinc-200 outline-none focus:border-blue-500/40 ${
          icon ? "pl-10" : ""
        }`}
      />
    </div>
  </div>
);

export default ResumeUpload;