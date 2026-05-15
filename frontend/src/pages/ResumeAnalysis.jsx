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
  Brain,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  SearchCheck,
  Sparkles,
  Target,
  TrendingUp,
  Wand2,
  Zap,
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

const MetricBox = ({ label, value, hint, icon: Icon }) => (
  <div className="rounded-3xl border border-white/[0.04] bg-zinc-900/40 p-5 shadow-xl">
    <div className="flex items-center justify-between gap-4">
      <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
        <Icon size={18} />
      </div>
      <div className="text-right">
        <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">
          {label}
        </p>
        <p className="text-4xl text-white font-black italic tracking-tighter leading-none">
          {value}
        </p>
      </div>
    </div>
    {hint && <p className="text-[10px] text-zinc-600 mt-4">{hint}</p>}
  </div>
);

const Section = ({ title, icon: Icon, children, right }) => (
  <section className="rounded-3xl border border-white/[0.04] bg-zinc-900/40 p-6 shadow-xl">
    <div className="flex items-center justify-between gap-4 mb-5">
      <h2 className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.35em] flex items-center gap-2">
        <span className="w-1 h-3 bg-blue-500 rounded-full" />
        {Icon && <Icon size={14} className="text-blue-400" />}
        {title}
      </h2>
      {right}
    </div>
    {children}
  </section>
);

const Pill = ({ children, tone = "blue" }) => {
  const tones = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
    gray: "bg-zinc-800 text-zinc-400 border-white/[0.05]",
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest ${
        tones[tone] || tones.blue
      }`}
    >
      {children}
    </span>
  );
};

const normalizeRadarData = (marketGap = []) =>
  marketGap.map((item) => ({
    subject: item.subject,
    user: Number(item.user_score || 0),
    target: Number(item.target_score || 10),
    reason: item.reason || "",
  }));

const normalizeScoreBreakdown = (scoreBreakdown = {}) => {
  const labels = {
    parsing: "Parsing",
    formatting: "Formatting",
    keywordMatch: "Keywords",
    roleAlignment: "Role Fit",
    projectDepth: "Projects",
    quantification: "Metrics",
    technicalDepth: "Tech Depth",
    recruiterClarity: "Clarity",
  };

  return Object.entries(scoreBreakdown || {}).map(([key, value]) => ({
    metric: labels[key] || key,
    score: Number(value || 0),
  }));
};

const gapTone = (status) => {
  if (status === "strong") return "green";
  if (status === "medium") return "blue";
  if (status === "weak") return "yellow";
  return "red";
};

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

  const radarData = useMemo(
    () => normalizeRadarData(analysis?.market_gap || []),
    [analysis]
  );

  const scoreData = useMemo(
    () => normalizeScoreBreakdown(analysis?.score_breakdown || {}),
    [analysis]
  );

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [docData, analysisData] = await Promise.all([
        getResumeDocumentById(resumeId),
        getResumeAnalysisByResumeId(resumeId),
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [resumeId]);

  const handleReanalyze = async () => {
    setReanalyzing(true);
    setError("");
    setNotice("");

    try {
      const data = await analyzeExistingResume(resumeId, {
        targetRole,
        targetCompany,
        jobDescription,
      });

      setDocument(data.document);
      setAnalysis(data.analysis);
      setAnalyses((prev) => [data.analysis, ...prev]);
      setNotice("Resume re-analyzed successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Re-analysis failed.");
    } finally {
      setReanalyzing(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="h-96 flex items-center justify-center">
          <Loader2 size={34} className="animate-spin text-blue-500" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => navigate("/resume")}
            className="inline-flex items-center gap-2 text-zinc-500 hover:text-blue-400 text-xs font-bold uppercase tracking-widest"
          >
            <ArrowLeft size={14} />
            Back to Resume Vault
          </button>

          <Link
            to="/resume/upload"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-black text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"
          >
            <Plus size={14} />
            Upload Another Resume
          </Link>
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

        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-5">
          <div>
            <p className="text-[9px] text-blue-500 font-black uppercase tracking-[0.45em]">
              Resume Analysis
            </p>
            <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">
              {document?.resumeName || "Resume"}
            </h1>
            <div className="flex flex-wrap gap-2 mt-4">
              <Pill>{targetRole || "SDE Intern"}</Pill>
              {targetCompany && <Pill tone="green">{targetCompany}</Pill>}
              {analysis?.verdict && <Pill tone="yellow">{analysis.verdict}</Pill>}
              <Pill tone="gray">{analyses.length} analyses</Pill>
            </div>
          </div>

          <button
            onClick={handleReanalyze}
            disabled={reanalyzing}
            className="px-6 py-4 rounded-2xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 disabled:opacity-40"
          >
            {reanalyzing ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={15} className="animate-spin" />
                Re-analyzing
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <RefreshCw size={15} />
                Re-analyze
              </span>
            )}
          </button>
        </div>

        <Section title="Target Context" icon={FileText}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Input
              label="Target Role"
              value={targetRole}
              onChange={setTargetRole}
              icon={<BriefcaseBusiness size={14} />}
            />
            <Input
              label="Target Company"
              value={targetCompany}
              onChange={setTargetCompany}
              icon={<Building2 size={14} />}
            />
          </div>

          <label className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-2 block">
            Job Description
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="w-full h-36 rounded-2xl bg-zinc-950/60 border border-white/[0.05] px-4 py-3 text-sm text-zinc-200 outline-none focus:border-blue-500/40 resize-none"
            placeholder="Paste updated JD and re-analyze..."
          />
        </Section>

        {!analysis ? (
          <div className="h-96 flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/[0.08] bg-zinc-900/20 text-center">
            <Brain size={54} className="text-zinc-700 mb-5" />
            <h2 className="text-xl text-white font-black uppercase italic">
              No analysis found
            </h2>
            <p className="text-sm text-zinc-500 mt-2">
              Run analysis for this resume.
            </p>
            <button
              onClick={handleReanalyze}
              className="mt-6 px-6 py-3 rounded-2xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest"
            >
              Analyze Now
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <MetricBox
                label="ATS Score"
                value={`${analysis.ats_score || 0}%`}
                hint="Formatting, parsing, structure, and keyword visibility."
                icon={Target}
              />
              <MetricBox
                label="Readiness"
                value={`${analysis.readiness_score || 0}%`}
                hint="Actual fit for this role/company."
                icon={Brain}
              />
              <MetricBox
                label="JD Match"
                value={`${analysis.jd_match_score || 0}%`}
                hint="How well the resume aligns with the provided JD."
                icon={SearchCheck}
              />
            </div>

            <Section title="Detailed Recruiter Summary" icon={Sparkles}>
              <p className="text-sm text-zinc-300 leading-7">
                {analysis.summary || "No summary generated."}
              </p>
            </Section>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <Section title="Market Gap Radar" icon={TrendingUp}>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#27272a" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: "#a1a1aa", fontSize: 10, fontWeight: 700 }}
                      />
                      <Radar
                        name="You"
                        dataKey="user"
                        stroke="#2563eb"
                        fill="#2563eb"
                        fillOpacity={0.22}
                        strokeWidth={2}
                      />
                      <Radar
                        name="Target"
                        dataKey="target"
                        stroke="#ef4444"
                        fill="transparent"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 mt-4">
                  {radarData.map((item) => (
                    <div
                      key={item.subject}
                      className="rounded-2xl bg-black/20 border border-white/[0.04] p-3"
                    >
                      <div className="flex justify-between text-xs text-zinc-300 font-bold">
                        <span>{item.subject}</span>
                        <span>
                          {item.user}/10 vs {item.target}/10
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-1">
                        {item.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Score Breakdown" icon={Zap}>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scoreData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#18181b"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="metric"
                        stroke="#a1a1aa"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#a1a1aa"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        domain={[0, 100]}
                      />
                      <ChartTooltip
                        contentStyle={{
                          backgroundColor: "#09090b",
                          border: "1px solid #27272a",
                          borderRadius: "10px",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="score" fill="#2563eb" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Section>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <ListSection
                title="Strengths"
                icon={CheckCircle2}
                items={analysis.strengths || []}
                tone="green"
              />
              <ListSection
                title="Weaknesses"
                icon={AlertTriangle}
                items={analysis.weaknesses || []}
                tone="red"
              />
            </div>

            <Section title="JD / Role Gap Matrix" icon={ClipboardList}>
              <div className="space-y-3">
                {(analysis.gap_matrix || []).map((gap, index) => (
                  <div
                    key={`${gap.requirement}-${index}`}
                    className="rounded-2xl bg-black/20 border border-white/[0.04] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                      <h3 className="text-sm text-white font-black">
                        {gap.requirement || "Requirement"}
                      </h3>
                      <div className="flex gap-2">
                        <Pill tone={gapTone(gap.status)}>{gap.status}</Pill>
                        <Pill tone={gap.priority === "high" ? "red" : "gray"}>
                          {gap.priority}
                        </Pill>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-500 mb-2">
                      <span className="text-zinc-300 font-bold">Evidence:</span>{" "}
                      {gap.resumeEvidence || "Not visible"}
                    </p>
                    <p className="text-xs text-blue-300">
                      <span className="text-zinc-300 font-bold">Fix:</span>{" "}
                      {gap.fix || "Add stronger evidence."}
                    </p>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Exact Bullet Replacements" icon={Wand2}>
              <div className="space-y-4">
                {(analysis.bullet_rewrites || []).map((item, index) => (
                  <div
                    key={`${item.original}-${index}`}
                    className="rounded-2xl bg-black/20 border border-white/[0.04] p-5"
                  >
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Pill>{item.section || "Resume Bullet"}</Pill>
                      {item.projectOrExperience && (
                        <Pill tone="gray">{item.projectOrExperience}</Pill>
                      )}
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                      <div>
                        <p className="text-[9px] text-red-400 font-black uppercase tracking-widest mb-2">
                          Original
                        </p>
                        <p className="text-sm text-zinc-500 leading-6">
                          {item.original || "Not provided"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[9px] text-emerald-400 font-black uppercase tracking-widest mb-2">
                          Improved
                        </p>
                        <p className="text-sm text-zinc-200 leading-6">
                          {item.improved || "No rewrite provided"}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-blue-300 mt-4">
                      <span className="text-zinc-300 font-bold">Why better:</span>{" "}
                      {item.whyBetter || item.problem || "Improves clarity."}
                    </p>
                  </div>
                ))}
              </div>
            </Section>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <ListSection
                title="Missing Keywords"
                icon={SearchCheck}
                items={analysis.missing_keywords || []}
                tone="yellow"
              />
              <ListSection
                title="Priority Actions"
                icon={Zap}
                items={analysis.priority_actions || []}
                tone="blue"
              />
            </div>

            {analysis.final_resume_strategy && (
              <Section title="Final Resume Strategy" icon={Sparkles}>
                <p className="text-sm text-zinc-300 leading-7">
                  {analysis.final_resume_strategy}
                </p>
              </Section>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
};

const Input = ({ label, value, onChange, icon }) => (
  <div>
    <label className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-2 block">
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
        className={`w-full rounded-2xl bg-zinc-950/60 border border-white/[0.05] px-4 py-3 text-sm text-zinc-200 outline-none focus:border-blue-500/40 ${
          icon ? "pl-10" : ""
        }`}
      />
    </div>
  </div>
);

const ListSection = ({ title, icon: Icon, items = [], tone = "blue" }) => {
  const color = {
    green: "border-emerald-500/30",
    red: "border-red-500/30",
    yellow: "border-yellow-500/30",
    blue: "border-blue-500/30",
  }[tone];

  return (
    <Section title={title} icon={Icon}>
      <div className="space-y-3">
        {items.length > 0 ? (
          items.map((item, index) => (
            <div
              key={`${item}-${index}`}
              className={`rounded-2xl bg-black/20 border-l ${color} p-4`}
            >
              <p className="text-sm text-zinc-300 leading-6">{item}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-zinc-600">No data available.</p>
        )}
      </div>
    </Section>
  );
};

export default ResumeAnalysis;