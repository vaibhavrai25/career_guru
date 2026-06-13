import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import {
  getResumeDocuments,
  getResumeAnalysisByResumeId,
  deleteResumeDocument,
} from "../api/resume";
import {
  AlertTriangle,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Plus,
  RefreshCw,
  Target,
  Trash2,
  UploadCloud,
  LayoutTemplate,
  X,
  Loader2,
} from "lucide-react";

const StatusPill = ({ status }) => {
  const classes = {
    analyzed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    parsed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    uploaded: "bg-zinc-800 text-zinc-400 border-white/[0.05]",
    error: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  return (
    <span
      className={`px-2.5 py-0.5 rounded-md border text-xs font-medium capitalize tracking-wide ${
        classes[status] || classes.uploaded
      }`}
    >
      {status || "uploaded"}
    </span>
  );
};

const ScoreBox = ({ label, value, icon: Icon }) => (
  <div className="rounded-xl bg-zinc-800/40 border border-white/[0.03] p-3 flex flex-col">
    <div className="flex items-center gap-2 text-zinc-500 mb-1">
      <Icon size={14} />
      <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
    </div>
    <p className="text-lg text-white font-bold tracking-tight">
      {value === null || value === undefined ? "--" : `${value}%`}
    </p>
  </div>
);

const VaultStat = ({ title, value, icon: Icon }) => (
  <div className="rounded-2xl border border-white/[0.04] bg-zinc-900/40 p-5 shadow-sm">
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">
          {title}
        </p>
        <p className="text-2xl text-white font-bold tracking-tight mt-1">
          {value}
        </p>
      </div>
      <div className="p-3 rounded-xl bg-zinc-800/50 text-blue-500 border border-white/[0.05]">
        <Icon size={18} />
      </div>
    </div>
  </div>
);

const ResumeCard = ({ doc, analysis, onOpen, onDelete }) => {
  const latest = analysis || null;

  return (
    <div className="rounded-2xl border border-white/[0.04] bg-zinc-900/40 p-5 hover:border-blue-500/30 transition-all shadow-sm flex flex-col group">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <h2 className="text-base text-white font-bold tracking-tight truncate group-hover:text-blue-400 transition-colors">
            {doc.resumeName || "Untitled Resume"}
          </h2>
          <p className="text-xs text-zinc-500 mt-1 truncate">
            {doc.originalFileName || "PDF Resume"}
          </p>
        </div>
        <StatusPill status={doc.status} />
      </div>

      <div className="space-y-2 mb-5">
        <div className="flex items-center gap-2.5 text-sm text-zinc-400 font-medium">
          <BriefcaseBusiness size={14} className="text-zinc-500 shrink-0" />
          <span className="truncate">{doc.targetRole || "No target role specified"}</span>
        </div>

        <div className="flex items-center gap-2.5 text-sm text-zinc-400 font-medium">
          <Building2 size={14} className="text-zinc-500 shrink-0" />
          <span className="truncate">
            {doc.targetCompany || "No target company specified"}
          </span>
        </div>

        <div className="flex items-center gap-2.5 text-sm text-zinc-500 font-medium">
          <Clock size={14} className="shrink-0" />
          <span>
            Added {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : "N/A"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-5">
        <ScoreBox label="ATS" value={latest?.ats_score} icon={Target} />
        <ScoreBox label="Ready" value={latest?.readiness_score} icon={LayoutTemplate} />
        <ScoreBox label="Match" value={latest?.jd_match_score} icon={BarChart3} />
      </div>

      <div className="mt-auto flex gap-2">
        <button
          type="button"
          onClick={() => onOpen(doc)}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition-all"
        >
          <Eye size={14} />
          View Report
        </button>

        <button
          type="button"
          onClick={() => onDelete(doc)}
          className="px-3 py-2.5 rounded-xl bg-zinc-800 text-zinc-400 border border-white/[0.05] hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all"
          title="Delete Resume"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

const DeleteResumeModal = ({ open, resume, deleting, onClose, onConfirm }) => {
  if (!open || !resume) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={deleting ? undefined : onClose} />

      <div className="relative w-full max-w-sm rounded-2xl border border-white/[0.05] bg-zinc-950 shadow-2xl p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={20} />
        </div>
        
        <h2 className="text-lg font-bold text-white mb-2">Delete Resume?</h2>
        <p className="text-sm text-zinc-400 mb-4 px-2">
          Are you sure you want to delete <span className="font-semibold text-zinc-200">"{resume.resumeName}"</span>? This will permanently remove all associated analysis reports.
        </p>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-sm font-semibold hover:bg-zinc-700 transition-all disabled:opacity-40"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {deleting ? <><Loader2 size={16} className="animate-spin" /> Deleting</> : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

const Resume = () => {
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [analysisMap, setAnalysisMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const stats = useMemo(() => {
    const analyses = Object.values(analysisMap).filter(Boolean);

    if (!analyses.length) {
      return { total: documents.length, analyzed: documents.filter((doc) => doc.status === "analyzed").length, avgAts: "--", avgReady: "--" };
    }

    const avg = (key) => Math.round(analyses.reduce((sum, item) => sum + Number(item?.[key] || 0), 0) / analyses.length);

    return { total: documents.length, analyzed: analyses.length, avgAts: `${avg("ats_score")}%`, avgReady: `${avg("readiness_score")}%` };
  }, [documents, analysisMap]);

  const loadDocuments = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getResumeDocuments();
      const docs = data?.data || [];
      setDocuments(docs);

      const entries = await Promise.all(
        docs.map(async (doc) => {
          try {
            const analysisData = await getResumeAnalysisByResumeId(doc._id);
            return [doc._id, analysisData?.data?.[0] || null];
          } catch (err) { return [doc._id, null]; }
        })
      );

      setAnalysisMap(Object.fromEntries(entries));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load resume vault.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDocuments(); }, []);

  const openDeleteModal = (doc) => { setResumeToDelete(doc); setDeleteModalOpen(true); setNotice(""); setError(""); };
  const closeDeleteModal = () => { if (deleting) return; setDeleteModalOpen(false); setResumeToDelete(null); };

  const confirmDelete = async () => {
    if (!resumeToDelete?._id) return;
    setDeleting(true); setError(""); setNotice("");
    try {
      await deleteResumeDocument(resumeToDelete._id);
      setNotice("Resume deleted successfully.");
      setDeleteModalOpen(false); setResumeToDelete(null);
      await loadDocuments();
    } catch (err) { setError(err.response?.data?.message || "Delete failed."); } 
    finally { setDeleting(false); }
  };

  const handleOpen = (doc) => navigate(`/resume/${doc._id}`);

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 animate-fadeIn">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-white tracking-tight">Resume Vault</h1>
            <p className="text-sm text-zinc-400 font-medium">Manage your targeted resumes and view alignment reports.</p>
          </div>

          <Link
            to="/resume/upload"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition-all shadow-sm"
          >
            <UploadCloud size={16} />
            Upload Resume
          </Link>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <VaultStat title="Total Resumes" value={stats.total} icon={FileText} />
          <VaultStat title="Analyzed" value={stats.analyzed} icon={CheckCircle2} />
          <VaultStat title="Avg ATS Score" value={stats.avgAts} icon={Target} />
          <VaultStat title="Avg Readiness" value={stats.avgReady} icon={LayoutTemplate} />
        </div>

        {notice && <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300 flex items-center gap-2"><CheckCircle2 size={16} />{notice}</div>}
        {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300 flex items-center gap-2"><AlertTriangle size={16} />{error}</div>}

        <div className="flex justify-between items-center pb-2 border-b border-white/[0.04]">
          <h2 className="text-sm text-zinc-300 font-semibold">Your Documents</h2>
          <button onClick={loadDocuments} disabled={loading} className="inline-flex items-center gap-2 text-zinc-500 hover:text-blue-400 text-xs font-semibold transition-colors disabled:opacity-50">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="h-48 flex items-center justify-center rounded-2xl border border-white/[0.04] bg-zinc-900/20">
            <Loader2 size={24} className="animate-spin text-blue-500" />
          </div>
        ) : documents.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-zinc-900/20 text-center px-4">
            <FileText size={40} className="text-zinc-600 mb-4" />
            <h2 className="text-lg text-white font-bold">No resumes uploaded</h2>
            <p className="text-sm text-zinc-500 mt-1 mb-5">Upload your first resume to generate a readiness report.</p>
            <Link to="/resume/upload" className="px-5 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-zinc-200">
              Upload Document
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {documents.map((doc) => (
              <ResumeCard key={doc._id} doc={doc} analysis={analysisMap[doc._id]} onOpen={handleOpen} onDelete={openDeleteModal} />
            ))}
          </div>
        )}
      </div>

      <DeleteResumeModal open={deleteModalOpen} resume={resumeToDelete} deleting={deleting} onClose={closeDeleteModal} onConfirm={confirmDelete} />
    </MainLayout>
  );
};

export default Resume;