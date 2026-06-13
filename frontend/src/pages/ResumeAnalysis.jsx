import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import {
  analyzeExistingResume,
  getResumeAnalysisByResumeId,
  getResumeDocumentById,
} from "../api/resume";
import {
  AlertTriangle,
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  FileText,
  Loader2,
  RefreshCw,
  SearchCheck,
  Target,
  TrendingUp,
  LayoutTemplate,
  CheckSquare,
  PenLine,
  Layers,
} from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
} from "recharts";

const normalizeRadarData = (marketGap = []) =>
  marketGap.map((item) => ({
    subject: item.subject,
    user: Number(item.user_score || 0),
    target: Number(item.target_score || 10),
    reason: item.reason || "",
  }));

const normalizeScoreBreakdown = (scoreBreakdown = {}) => {
  const labels = {
    parsing: "Parsing", formatting: "Formatting", keywordMatch: "Keywords",
    roleAlignment: "Role Fit", projectDepth: "Projects", quantification: "Metrics",
    technicalDepth: "Tech Depth", recruiterClarity: "Clarity",
  };
  return Object.entries(scoreBreakdown || {}).map(([key, value]) => ({
    metric: labels[key] || key,
    score: Number(value || 0),
  }));
};

const MetricBox = ({ label, value, hint }) => (
  <div className="flex flex-col p-5 bg-zinc-800/30 rounded-xl border border-white/[0.03]">
    <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-2">{label}</p>
    <p className="text-3xl text-white font-bold tracking-tight mb-2">{value}%</p>
    <p className="text-xs text-zinc-500 font-medium leading-relaxed">{hint}</p>
  </div>
);

const ResumeAnalysis = () => {
  const { resumeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [document, setDocument] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const [analysis, setAnalysis] = useState(null);

  const [targetRole, setTargetRole] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  const [loading, setLoading] = useState(true);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(location.state?.message || "");

  const radarData = useMemo(() => normalizeRadarData(analysis?.market_gap || []), [analysis]);
  const scoreData = useMemo(() => normalizeScoreBreakdown(analysis?.score_breakdown || {}), [analysis]);

  const loadData = async () => {
    setLoading(true); setError("");
    try {
      const [docData, analysisData] = await Promise.all([
        getResumeDocumentById(resumeId), getResumeAnalysisByResumeId(resumeId),
      ]);
      setDocument(docData);
      setTargetRole(docData.targetRole || "SDE Intern");
      setTargetCompany(docData.targetCompany || "");
      setJobDescription(docData.jobDescription || "");

      const list = analysisData?.data || [];
      setAnalyses(list);
      setAnalysis(list[0] || null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load resume analysis.");
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [resumeId]);

  const handleReanalyze = async () => {
    setReanalyzing(true); setError(""); setNotice("");
    try {
      const data = await analyzeExistingResume(resumeId, { targetRole, targetCompany, jobDescription });
      setDocument(data.document); setAnalysis(data.analysis);
      setAnalyses((prev) => [data.analysis, ...prev]);
      setNotice("Analysis updated successfully.");
    } catch (err) { setError(err.response?.data?.message || "Re-analysis failed."); } 
    finally { setReanalyzing(false); }
  };

  if (loading) return (
    <MainLayout>
      <div className="h-96 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-blue-500" />
      </div>
    </MainLayout>
  );

  return (
    <MainLayout>
      <div className="max-w-[1200px] mx-auto px-6 py-8 space-y-6 animate-fadeIn">
        
        {/* Top Navigation */}
        <button onClick={() => navigate("/resume")} className="inline-flex items-center gap-2 text-zinc-500 hover:text-white text-xs font-semibold transition-colors">
          <ArrowLeft size={14} /> Back to Vault
        </button>

        {notice && <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-400 flex items-center gap-2"><CheckCircle2 size={16} />{notice}</div>}
        {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400 flex items-center gap-2"><AlertTriangle size={16} />{error}</div>}

        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 border-b border-white/[0.04] pb-6">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
              {document?.resumeName || "Resume Report"}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-zinc-400">
              <span className="flex items-center gap-1.5"><BriefcaseBusiness size={14} className="text-zinc-500"/> {targetRole}</span>
              {targetCompany && <span className="flex items-center gap-1.5"><Building2 size={14} className="text-zinc-500"/> {targetCompany}</span>}
              {analysis?.verdict && <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 text-xs">{analysis.verdict}</span>}
            </div>
          </div>

          <button onClick={handleReanalyze} disabled={reanalyzing} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 disabled:opacity-50 transition-all">
            {reanalyzing ? <><Loader2 size={14} className="animate-spin" /> Processing...</> : <><RefreshCw size={14} /> Re-analyze Profile</>}
          </button>
        </div>

        {!analysis ? (
          <div className="py-20 flex flex-col items-center justify-center text-center border border-dashed border-white/[0.05] rounded-2xl bg-zinc-900/20">
            <FileText size={40} className="text-zinc-600 mb-4" />
            <h2 className="text-lg font-bold text-white">No data generated</h2>
            <p className="text-sm text-zinc-500 mb-6 max-w-sm">Run an analysis to generate insights and optimization strategies.</p>
            <button onClick={handleReanalyze} className="px-5 py-2.5 bg-white text-black text-sm font-bold rounded-xl hover:bg-zinc-200">Run Analysis Now</button>
          </div>
        ) : (
          <div className="bg-zinc-900/30 rounded-2xl border border-white/[0.04] overflow-hidden shadow-sm">
            
            {/* 1. Score Dashboard */}
            <div className="p-6 lg:p-8 border-b border-white/[0.04] bg-zinc-900/50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <MetricBox label="ATS Integrity" value={analysis.ats_score} hint="Formatting, parsing, structure, and keyword visibility." />
                <MetricBox label="Role Readiness" value={analysis.readiness_score} hint="Alignment with the specific role requirements." />
                <MetricBox label="JD Match" value={analysis.jd_match_score} hint="Direct match percentage against the provided description." />
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3"><LayoutTemplate size={16} className="text-blue-500"/> Executive Summary</h3>
                <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-800/20 p-5 rounded-xl border border-white/[0.02]">
                  {analysis.summary || "No summary provided."}
                </p>
              </div>
            </div>

            {/* 2. Charts / Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.04] border-b border-white/[0.04]">
              <div className="p-6 lg:p-8">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-6"><TrendingUp size={16} className="text-blue-500"/> Market Gap Analysis</h3>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#27272a" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: "#a1a1aa", fontSize: 11, fontWeight: 500 }} />
                      <Radar name="Your Profile" dataKey="user" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
                      <Radar name="Target Expectation" dataKey="target" stroke="#71717a" fill="transparent" strokeWidth={2} strokeDasharray="4 4" />
                      <ChartTooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "8px", fontSize: "12px", color: "#fff" }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="p-6 lg:p-8">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-6"><Target size={16} className="text-blue-500"/> Scoring Breakdown</h3>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scoreData} layout="vertical" margin={{ left: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                      <XAxis type="number" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <YAxis dataKey="metric" type="category" stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} />
                      <ChartTooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "8px", fontSize: "12px", color: "#fff" }} cursor={{fill: '#27272a', opacity: 0.3}} />
                      <Bar dataKey="score" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* 3. Strengths & Weaknesses */}
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.04] border-b border-white/[0.04] bg-zinc-900/20">
              <div className="p-6 lg:p-8">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4"><CheckCircle2 size={16} className="text-emerald-500"/> Core Strengths</h3>
                <ul className="space-y-3">
                  {(analysis.strengths || []).map((item, i) => (
                    <li key={i} className="text-sm text-zinc-300 flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-6 lg:p-8">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4"><AlertTriangle size={16} className="text-red-500"/> Key Weaknesses</h3>
                <ul className="space-y-3">
                  {(analysis.weaknesses || []).map((item, i) => (
                    <li key={i} className="text-sm text-zinc-300 flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 4. Missing Keywords & Action Plan */}
            <div className="p-6 lg:p-8 border-b border-white/[0.04]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4"><SearchCheck size={16} className="text-yellow-500"/> Missing Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {(analysis.missing_keywords || []).map((kw, i) => (
                      <span key={i} className="px-3 py-1 rounded-lg bg-zinc-800/60 border border-white/[0.05] text-xs font-medium text-zinc-300">{kw}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4"><Layers size={16} className="text-blue-500"/> Priority Actions</h3>
                  <ul className="space-y-3">
                    {(analysis.priority_actions || []).map((action, i) => (
                      <li key={i} className="text-sm text-zinc-300 flex items-start gap-2.5">
                        <span className="text-blue-500 font-bold">{i + 1}.</span>
                        <span className="leading-relaxed">{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* 5. Bullet Improvements */}
            <div className="p-6 lg:p-8 border-b border-white/[0.04] bg-zinc-900/20">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-6"><PenLine size={16} className="text-blue-500"/> Recommended Bullet Rewrites</h3>
              <div className="space-y-6">
                {(analysis.bullet_rewrites || []).map((item, index) => (
                  <div key={index} className="bg-zinc-900 border border-white/[0.04] rounded-xl overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/[0.04]">
                      <div className="p-4 bg-red-500/[0.02]">
                        <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-2">Original</p>
                        <p className="text-sm text-zinc-400 leading-relaxed">{item.original}</p>
                      </div>
                      <div className="p-4 bg-emerald-500/[0.02]">
                        <p className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wider mb-2">Improved</p>
                        <p className="text-sm text-zinc-200 leading-relaxed font-medium">{item.improved}</p>
                      </div>
                    </div>
                    <div className="p-3 px-4 bg-zinc-800/30 border-t border-white/[0.02] text-xs text-zinc-400 flex items-center gap-2">
                      <CheckSquare size={14} className="text-blue-400" /> <span className="font-medium text-zinc-300">Why:</span> {item.whyBetter || item.problem}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. Job Description Input / Update */}
            <div className="p-6 lg:p-8 bg-zinc-900/50">
               <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4"><FileText size={16} className="text-zinc-400"/> Edit Target Context</h3>
               <p className="text-xs text-zinc-500 mb-4">Update the role, company, or job description below and re-analyze to get fresh insights.</p>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                 <div>
                   <label className="text-xs text-zinc-400 font-semibold mb-1.5 block">Target Role</label>
                   <input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} className="w-full rounded-xl bg-zinc-900 border border-white/[0.05] px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-blue-500/40" />
                 </div>
                 <div>
                   <label className="text-xs text-zinc-400 font-semibold mb-1.5 block">Target Company</label>
                   <input value={targetCompany} onChange={(e) => setTargetCompany(e.target.value)} className="w-full rounded-xl bg-zinc-900 border border-white/[0.05] px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-blue-500/40" />
                 </div>
               </div>
               <div>
                  <label className="text-xs text-zinc-400 font-semibold mb-1.5 block">Job Description</label>
                  <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} rows={5} placeholder="Paste job description here..." className="w-full rounded-xl bg-zinc-900 border border-white/[0.05] px-4 py-3 text-sm text-zinc-200 outline-none focus:border-blue-500/40 resize-none" />
               </div>
            </div>

          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ResumeAnalysis;