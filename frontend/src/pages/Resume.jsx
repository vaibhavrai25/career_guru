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
  Zap,
  X,
  ShieldAlert,
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
      className={`px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest ${
        classes[status] || classes.uploaded
      }`}
    >
      {status || "uploaded"}
    </span>
  );
};

const ScoreBox = ({ label, value, icon: Icon }) => (
  <div className="rounded-2xl bg-black/20 border border-white/[0.04] p-3">
    <div className="flex items-center justify-between gap-2">
      <div>
        <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">
          {label}
        </p>
        <p className="text-xl text-white font-black italic leading-none mt-1">
          {value === null || value === undefined ? "--" : `${value}%`}
        </p>
      </div>
      <Icon size={15} className="text-blue-500" />
    </div>
  </div>
);

const VaultStat = ({ title, value, icon: Icon }) => (
  <div className="rounded-3xl border border-white/[0.04] bg-zinc-900/40 p-5 shadow-xl">
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">
          {title}
        </p>
        <p className="text-3xl text-white font-black italic tracking-tighter mt-2">
          {value}
        </p>
      </div>

      <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
        <Icon size={18} />
      </div>
    </div>
  </div>
);

const ResumeCard = ({ doc, analysis, onOpen, onDelete }) => {
  const latest = analysis || null;

  return (
    <div className="rounded-3xl border border-white/[0.04] bg-zinc-900/40 p-6 hover:border-blue-500/30 transition-all shadow-xl flex flex-col">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="min-w-0">
          <h2 className="text-lg text-white font-black uppercase italic tracking-tight truncate">
            {doc.resumeName || "Untitled Resume"}
          </h2>
          <p className="text-[10px] text-zinc-600 mt-1 truncate">
            {doc.originalFileName || "PDF Resume"}
          </p>
        </div>

        <StatusPill status={doc.status} />
      </div>

      <div className="space-y-3 mb-5">
        <div className="flex items-center gap-3 text-sm text-zinc-400">
          <BriefcaseBusiness size={15} className="text-blue-500 shrink-0" />
          <span className="truncate">{doc.targetRole || "No target role"}</span>
        </div>

        <div className="flex items-center gap-3 text-sm text-zinc-400">
          <Building2 size={15} className="text-emerald-500 shrink-0" />
          <span className="truncate">
            {doc.targetCompany || "No target company"}
          </span>
        </div>

        <div className="flex items-center gap-3 text-sm text-zinc-500">
          <Clock size={15} className="shrink-0" />
          <span>
            Uploaded{" "}
            {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : "N/A"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <ScoreBox label="ATS" value={latest?.ats_score} icon={Target} />
        <ScoreBox label="Ready" value={latest?.readiness_score} icon={Zap} />
        <ScoreBox label="JD Match" value={latest?.jd_match_score} icon={BarChart3} />
      </div>

      {latest?.summary ? (
        <p className="text-xs text-zinc-500 leading-5 line-clamp-3 mb-5">
          {latest.summary}
        </p>
      ) : (
        <p className="text-xs text-zinc-700 leading-5 mb-5">
          No saved analysis yet. Open this resume and run analysis.
        </p>
      )}

      {doc.error && (
        <p className="mb-4 text-xs text-red-400 line-clamp-2">{doc.error}</p>
      )}

      <div className="mt-auto flex gap-3">
        <button
          type="button"
          onClick={() => onOpen(doc)}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all"
        >
          <Eye size={14} />
          View Analysis
        </button>

        <button
          type="button"
          onClick={() => onDelete(doc)}
          className="px-4 py-3 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

const DeleteResumeModal = ({
  open,
  resume,
  deleting,
  onClose,
  onConfirm,
}) => {
  if (!open || !resume) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={deleting ? undefined : onClose}
      />

      <div className="relative w-full max-w-md rounded-[2rem] border border-red-500/20 bg-zinc-950 shadow-2xl shadow-red-950/30 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500" />

        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                <ShieldAlert size={22} />
              </div>

              <div>
                <p className="text-[9px] text-red-400 font-black uppercase tracking-[0.35em]">
                  Confirm Deletion
                </p>
                <h2 className="text-xl text-white font-black uppercase italic tracking-tight mt-1">
                  Delete Resume?
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              className="p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 transition-all disabled:opacity-40"
            >
              <X size={18} />
            </button>
          </div>

          <div className="rounded-2xl bg-black/30 border border-white/[0.05] p-4 mb-5">
            <p className="text-sm text-zinc-300 font-bold truncate">
              {resume.resumeName || "Untitled Resume"}
            </p>
            <p className="text-xs text-zinc-600 mt-1 truncate">
              {resume.originalFileName || "PDF Resume"}
            </p>

            <div className="flex flex-wrap gap-2 mt-3">
              {resume.targetRole && (
                <span className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[8px] font-black uppercase tracking-widest">
                  {resume.targetRole}
                </span>
              )}

              {resume.targetCompany && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase tracking-widest">
                  {resume.targetCompany}
                </span>
              )}
            </div>
          </div>

          <p className="text-sm text-zinc-400 leading-6">
            This will permanently remove the resume and all saved analysis
            results linked to it. This action cannot be undone.
          </p>

          <div className="flex gap-3 mt-7">
            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              className="flex-1 px-5 py-3 rounded-2xl bg-zinc-900 text-zinc-300 border border-white/[0.06] text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all disabled:opacity-40"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={deleting}
              className="flex-1 px-5 py-3 rounded-2xl bg-red-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-500 transition-all disabled:opacity-40"
            >
              {deleting ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  Deleting
                </span>
              ) : (
                "Delete Resume"
              )}
            </button>
          </div>
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
      return {
        total: documents.length,
        analyzed: documents.filter((doc) => doc.status === "analyzed").length,
        avgAts: "--",
        avgReady: "--",
      };
    }

    const avg = (key) =>
      Math.round(
        analyses.reduce((sum, item) => sum + Number(item?.[key] || 0), 0) /
          analyses.length
      );

    return {
      total: documents.length,
      analyzed: analyses.length,
      avgAts: `${avg("ats_score")}%`,
      avgReady: `${avg("readiness_score")}%`,
    };
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
            const latest = analysisData?.data?.[0] || null;
            return [doc._id, latest];
          } catch (err) {
            return [doc._id, null];
          }
        })
      );

      setAnalysisMap(Object.fromEntries(entries));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load resume vault.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const openDeleteModal = (doc) => {
    setResumeToDelete(doc);
    setDeleteModalOpen(true);
    setNotice("");
    setError("");
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setDeleteModalOpen(false);
    setResumeToDelete(null);
  };

  const confirmDelete = async () => {
    if (!resumeToDelete?._id) return;

    setDeleting(true);
    setError("");
    setNotice("");

    try {
      await deleteResumeDocument(resumeToDelete._id);
      setNotice("Resume deleted successfully.");
      setDeleteModalOpen(false);
      setResumeToDelete(null);
      await loadDocuments();
    } catch (err) {
      setError(err.response?.data?.message || "Delete failed.");
    } finally {
      setDeleting(false);
    }
  };

  const handleOpen = (doc) => {
    navigate(`/resume/${doc._id}`);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div>
            <p className="text-[9px] text-blue-500 font-black uppercase tracking-[0.45em]">
              Resume Intelligence
            </p>
            <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">
              Resume Vault
            </h1>
            <p className="text-sm text-zinc-500 mt-2">
              All your role/company-specific resumes in one place. Open any resume
              to view its full AI analysis.
            </p>
          </div>

          <Link
            to="/resume/upload"
            className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all"
          >
            <UploadCloud size={16} />
            Upload New Resume
          </Link>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <VaultStat title="Total Resumes" value={stats.total} icon={FileText} />
          <VaultStat title="Analyzed" value={stats.analyzed} icon={CheckCircle2} />
          <VaultStat title="Avg ATS" value={stats.avgAts} icon={Target} />
          <VaultStat title="Avg Readiness" value={stats.avgReady} icon={Zap} />
        </div>

        {notice && (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300 flex items-center gap-2">
            <CheckCircle2 size={16} />
            {notice}
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300 flex items-center gap-2">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        <div className="flex justify-between items-center">
          <h2 className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.35em]">
            Saved Resume Cards
          </h2>

          <button
            type="button"
            onClick={loadDocuments}
            disabled={loading}
            className="inline-flex items-center gap-2 text-zinc-500 hover:text-blue-400 text-xs font-bold uppercase tracking-widest disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="h-72 flex items-center justify-center rounded-3xl border border-white/[0.04] bg-zinc-900/30">
            <RefreshCw size={28} className="animate-spin text-blue-500" />
          </div>
        ) : documents.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/[0.08] bg-zinc-900/20 text-center">
            <FileText size={56} className="text-zinc-700 mb-5" />
            <h2 className="text-xl text-white font-black uppercase italic">
              No resumes uploaded
            </h2>
            <p className="text-sm text-zinc-500 mt-2 max-w-md">
              Upload your first resume and the analysis page will open
              automatically.
            </p>
            <Link
              to="/resume/upload"
              className="mt-6 px-6 py-3 rounded-2xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-500"
            >
              Upload Resume
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 xl:grid-cols-3 md:grid-cols-2 gap-5">
              {documents.map((doc) => (
                <ResumeCard
                  key={doc._id}
                  doc={doc}
                  analysis={analysisMap[doc._id]}
                  onOpen={handleOpen}
                  onDelete={openDeleteModal}
                />
              ))}
            </div>

            <div className="flex justify-center pt-4">
              <Link
                to="/resume/upload"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"
              >
                <Plus size={16} />
                Add Another Resume
              </Link>
            </div>
          </>
        )}
      </div>

      <DeleteResumeModal
        open={deleteModalOpen}
        resume={resumeToDelete}
        deleting={deleting}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
      />
    </MainLayout>
  );
};

export default Resume;