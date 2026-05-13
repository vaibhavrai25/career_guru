import { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import api from "../api/axios";
import { 
  FileSearch, ShieldCheck, Activity, Target, Zap, CheckCircle2, 
  HelpCircle, Terminal, Fingerprint, Scan, BarChart3, Microscope, Cpu
} from "lucide-react";
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer
} from 'recharts';

const MetricBox = ({ label, value, trend, icon: Icon, color }) => (
  <div className="bg-zinc-900/60 border border-white/[0.03] p-4 rounded-xl relative overflow-hidden shadow-inner flex flex-col justify-between group hover:border-blue-500/20 transition-all">
    <div className="flex justify-between items-start">
      <div className={`p-1.5 rounded-lg bg-zinc-800/80 ${color} border border-white/[0.05]`}>
        <Icon size={12} />
      </div>
      <div className="text-right">
        <p className="text-[7px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-1">{label}</p>
        <p className="text-2xl font-black text-white italic leading-none tracking-tighter">{value}</p>
      </div>
    </div>
    <div className="mt-3 flex items-center gap-2">
      <div className="h-[1px] flex-1 bg-white/[0.05]"></div>
      <p className="text-[7px] font-black text-zinc-700 uppercase tracking-widest">{trend}</p>
    </div>
  </div>
);

const ResumeAnalyzer = () => {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault(); // Stop default browser behavior
    if (!file) return alert("Bhai, pehle file inject karo!");

    const formData = new FormData();
    formData.append("resume", file);
    setUploading(true);

    try {
      const res = await api.post("/resume/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setAnalysis(res.data);
    } catch (err) { 
      console.error(err);
      alert("Telemetry link broken."); 
    } finally { 
      setUploading(false); 
    }
  };

  if (uploading) return (
    <div className="h-screen flex items-center justify-center bg-[#060606]">
      <div className="flex flex-col items-center gap-6">
        <div className="w-32 h-[1px] bg-zinc-800 relative overflow-hidden">
          <div className="absolute inset-0 bg-blue-600 animate-loading-bar"></div>
        </div>
        <p className="text-zinc-600 font-black text-[9px] tracking-[0.5em] uppercase">Scanning Neural Document...</p>
      </div>
    </div>
  );

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-4 animate-fadeIn">
        
        {/* HUD CONTROL */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          <div className="lg:col-span-4 flex items-center gap-4">
            <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-500/20">
              <Fingerprint size={24} className="text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white uppercase italic leading-none tracking-tighter">RESUME-INTEL <span className="text-blue-600">v4.0</span></h1>
              <p className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.4em] mt-1 flex items-center gap-2"><Terminal size={10} /> Neural Diagnostic Ready</p>
            </div>
          </div>

          <div className="lg:col-span-8 flex justify-end gap-3">
             {/* 1. SEPARATE FILE PICKER AREA */}
             <label className="flex items-center gap-3 bg-zinc-900/60 p-2 px-6 rounded-xl border border-white/[0.05] cursor-pointer hover:bg-zinc-800/40 transition-all">
                <FileSearch size={14} className="text-zinc-500" />
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest truncate max-w-[180px]">
                  {file ? file.name : "1. INJECT PDF"}
                </span>
                <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} className="hidden" />
             </label>

             {/* 2. SCAN BUTTON LOGICALLY SEPARATE */}
             <button 
                onClick={handleUpload} 
                disabled={!file}
                className={`px-8 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-black uppercase rounded-lg transition-all shadow-lg active:scale-95 ${!file ? 'opacity-30' : ''}`}
             >
                {analysis ? "RE-AUDIT" : "2. EXECUTE SCAN"}
             </button>
          </div>
        </div>

        {analysis ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* LEFT COLUMN: VITALS */}
            <div className="lg:col-span-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <MetricBox label="ATS READINESS" value={`${analysis.ats_score}%`} trend="OPTIMIZED" icon={Target} color="text-emerald-500" />
                <MetricBox label="IMPACT INDEX" value={analysis.impact_score} trend="ELITE TIER" icon={Zap} color="text-blue-500" />
              </div>

              <div className="bg-zinc-900/30 rounded-2xl border border-white/[0.04] p-6 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Scan size={100} /></div>
                <h2 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-8 flex items-center gap-2">
                  <div className="w-1 h-3 bg-blue-500 rounded-full"></div> Structural Telemetry
                </h2>
                <div className="space-y-6">
                  {Object.entries(analysis.structural_telemetry).map(([key, val], i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between text-[8px] font-black uppercase text-zinc-600 tracking-tighter">
                        <span>{key.replace('_', ' ')}</span>
                        <span>{val}%</span>
                      </div>
                      <div className="h-[2px] w-full bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600" style={{ width: `${val}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: INTELLIGENCE */}
            <div className="lg:col-span-8 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-900/30 rounded-2xl border border-white/[0.04] p-6 shadow-2xl h-[380px] flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5"><Microscope size={120} /></div>
                  <h2 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-4">Neural Market Alignment</h2>
                  <div className="flex-1 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={analysis.market_gap}>
                        <PolarGrid stroke="#18181b" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#3f3f46', fontSize: 8, fontWeight: '900' }} />
                        <Radar name="You" dataKey="A" stroke="#2563eb" fill="#2563eb" fillOpacity={0.1} strokeWidth={2} />
                        <Radar name="Benchmark" dataKey="B" stroke="#ef4444" fill="transparent" strokeWidth={1} strokeDasharray="4 4" />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-zinc-900/30 rounded-2xl border border-white/[0.04] p-6 shadow-2xl h-[380px] flex flex-col">
                  <h2 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-4 flex justify-between items-center">
                    <span>Predictive Grill Questions</span>
                    <HelpCircle size={12} className="text-blue-500" />
                  </h2>
                  <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 pr-2 mt-4">
                    {analysis.grill_questions.map((q, i) => (
                      <div key={i} className="p-4 bg-zinc-800/40 rounded-xl border-l border-blue-600/50 group hover:bg-zinc-800 transition-all">
                        <p className="text-[10px] text-zinc-300 font-medium italic opacity-80 group-hover:opacity-100">"{q}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/30 rounded-2xl border border-white/[0.04] overflow-hidden shadow-2xl">
                 <div className="p-4 px-8 border-b border-white/[0.02] bg-zinc-800/10 flex justify-between items-center">
                    <h2 className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.4em]">Directives for Refactoring</h2>
                    <Zap size={14} className="text-yellow-500 animate-pulse" />
                 </div>
                 <div className="p-1">
                    {analysis.suggestions.map((s, i) => (
                      <div key={i} className="flex items-center justify-between p-3 px-6 hover:bg-zinc-800/40 rounded-xl transition-all group">
                         <div className="flex items-center gap-4 flex-1 truncate">
                            <div className="w-1 h-1 bg-blue-600 rounded-full shrink-0"></div>
                            <p className="text-[11px] font-bold text-zinc-300 truncate uppercase italic leading-none">{s}</p>
                         </div>
                         <button className="text-[8px] font-black text-blue-500 uppercase border border-blue-500/20 px-3 py-1 rounded-md hover:bg-blue-600 hover:text-white">Apply</button>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          </div>
        ) : (
          /* EMPTY STATE */
          <div className="h-[650px] flex flex-col items-center justify-center border border-dashed border-white/[0.05] rounded-[4rem] bg-zinc-900/10 relative overflow-hidden group">
             <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none grid grid-cols-6 gap-4 p-10">
               {[...Array(24)].map((_, i) => <Terminal key={i} size={40} />)}
             </div>
             <div className="relative z-10 flex flex-col items-center">
                <div className="p-12 bg-zinc-800/30 rounded-full border border-white/[0.05] mb-8 shadow-2xl group-hover:scale-110 transition-transform">
                   <Cpu size={64} className="text-zinc-700 animate-pulse" />
                </div>
                <p className="text-[12px] font-black text-zinc-600 uppercase tracking-[0.8em] mb-3">Neural Linkage Offline</p>
                <p className="text-[9px] text-zinc-800 font-black uppercase">Awaiting Document Asset Injection</p>
             </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ResumeAnalyzer;