import { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { 
  getTasks, toggleTask, addTask, deleteTask, 
  generateAIRecommendations, getTopicProgress 
} from "../api/stats";
import { 
  CheckCircle2, Circle, Youtube, ExternalLink, Zap, Plus, Cpu, Sparkles, 
  Clock, X, Send, Trash2, Target, LayoutDashboard, ChevronRight, Info, BookOpen
} from "lucide-react";

// CUSTOM GFG ICON (GREEN PRECISION)
const GFGIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM11 7H13V9H11V7ZM11 11H13V17H11V11Z" fill="#2F8D46"/>
    <path d="M7 12C7 9.23858 9.23858 7 12 7V9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15V17C9.23858 17 7 14.7614 7 12Z" fill="#2F8D46"/>
  </svg>
);

const StudyPlan = () => {
  const [activeTab, setActiveTab] = useState("dsa");
  const [tasks, setTasks] = useState([]);
  const [plans, setPlans] = useState([]); // For the new AI Deep-Dive Plans
  const [progress, setProgress] = useState({ dsa: 0, development: 0, core: 0 });
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", priority: "medium", type: "practice", resourceLink: "" });

  const fetchData = async () => {
    try {
      const [taskRes, progRes] = await Promise.all([getTasks(), getTopicProgress()]);
      // Separating regular tasks from deep-dive plans if needed
      setTasks(taskRes.data || []);
      setProgress(progRes.data);
    } catch (err) { console.error("Telemetry failed", err); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleToggle = async (id) => {
    try {
      await toggleTask(id);
      setTasks(tasks.map(t => t._id === id ? { ...t, completed: !t.completed } : t));
      const prog = await getTopicProgress(); setProgress(prog.data);
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bhai, remove this objective?")) return;
    try {
      await deleteTask(id);
      setTasks(tasks.filter(t => t._id !== id));
    } catch (err) { console.error(err); }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    try {
      const resLinks = newTask.resourceLink ? [{ label: "Link", link: newTask.resourceLink, platform: "external" }] : [];
      await addTask({ ...newTask, category: activeTab, resources: resLinks });
      setShowModal(false);
      setNewTask({ title: "", priority: "medium", type: "practice", resourceLink: "" });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleRequestAI = async () => {
    setAiLoading(true);
    try {
      await generateAIRecommendations(activeTab);
      await fetchData();
    } catch (err) { alert("AI Core Overloaded. Retrying..."); } 
    finally { setAiLoading(false); }
  };

  // 1. MANUAL TASK ROW (STRIVER COMPACT)
  const TaskRow = ({ task }) => (
    <div className={`group flex items-center justify-between p-3 px-5 border-b border-white/[0.03] transition-all ${
      task.completed ? "bg-zinc-950/20 opacity-30" : "bg-zinc-900/30 hover:bg-zinc-800/40"
    }`}>
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <button onClick={() => handleToggle(task._id)} className="shrink-0 transition-transform active:scale-90">
          {task.completed ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Circle size={16} className="text-zinc-700" />}
        </button>
        <div className="flex flex-col min-w-0">
          <p className={`text-[12px] font-bold tracking-tight truncate ${task.completed ? "line-through text-zinc-600" : "text-zinc-200"}`}>{task.title}</p>
          <p className="text-[8px] text-zinc-600 uppercase font-black tracking-widest mt-0.5">{task.type}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {task.resources?.map((r, i) => (
          <a key={i} href={r.link} target="_blank" rel="noreferrer" className="p-1.5 bg-zinc-800 rounded-lg border border-white/5 text-zinc-500 hover:text-white">
            {r.platform === 'gfg' ? <GFGIcon /> : <ExternalLink size={10} />}
          </a>
        ))}
        <button onClick={() => handleDelete(task._id)} className="p-1.5 text-zinc-800 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={12} /></button>
      </div>
    </div>
  );

  // 2. AI DEEP-DIVE MASTERY CARD (THE ATOMIC BREAKDOWN)
  const MasteryTrack = ({ plan }) => (
    <div className="bg-zinc-900/40 border border-blue-500/10 rounded-3xl overflow-hidden mb-6 shadow-2xl animate-fadeIn">
      <div className="p-5 px-8 border-b border-white/[0.03] bg-blue-600/[0.03] flex justify-between items-center">
        <div>
          <h2 className="text-lg font-black text-white uppercase italic tracking-tighter leading-none">
            Mastery: <span className="text-blue-500">{plan.title}</span>
          </h2>
          <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
            <Clock size={10} /> ETA: {plan.estimated_time || "4 Hours"} • Strategic Refactor
          </p>
        </div>
        <Sparkles size={18} className="text-blue-500 animate-pulse" />
      </div>

      <div className="p-4 space-y-4">
        {/* We assume resources contain 1 GFG link and many LeetCode questions from our controller logic */}
        <div className="p-4 bg-zinc-800/20 rounded-2xl border border-white/[0.02]">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <div className="w-1 h-3 bg-blue-500 rounded-full"></div> Core Theory (GFG)
              </h3>
              {plan.resources?.filter(r => r.platform === 'gfg').map((res, idx) => (
                <a key={idx} href={res.link} target="_blank" className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 rounded-lg text-[9px] font-black text-blue-400 hover:bg-blue-600 hover:text-white transition-all">
                  <GFGIcon /> READ ARTICLE
                </a>
              ))}
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              {plan.resources?.filter(r => r.platform !== 'gfg').map((q, qIdx) => (
                <div key={qIdx} className="flex items-center justify-between p-2.5 px-4 bg-black/40 border border-white/[0.02] rounded-xl hover:border-blue-500/30 transition-all group">
                   <div className="flex items-center gap-3 truncate">
                      <div className="w-1 h-1 bg-zinc-700 rounded-full group-hover:bg-blue-500"></div>
                      <a href={q.link} target="_blank" className="text-[11px] font-bold text-zinc-400 group-hover:text-blue-100 truncate uppercase tracking-tight">
                        {q.label}
                      </a>
                   </div>
                   <span className="text-[7px] font-black text-zinc-600 bg-white/5 px-1.5 py-0.5 rounded">LC</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#060606]"><div className="w-12 h-0.5 bg-zinc-800 relative overflow-hidden"><div className="absolute inset-0 bg-blue-600 animate-loading-bar"></div></div></div>;

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6 animate-fadeIn">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
          <div>
            <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.5em] mb-1 flex items-center gap-2">
               <Target size={10} /> Neural Roadmap Active
            </p>
            <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
              Study <span className="text-blue-600">SYNC</span>
            </h1>
          </div>

          <div className="flex p-1 bg-zinc-900/60 rounded-xl border border-white/[0.05] backdrop-blur-3xl shadow-2xl">
            {["dsa", "development", "core"].map(cat => (
              <button key={cat} onClick={() => setActiveTab(cat)} className={`px-8 py-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === cat ? "bg-blue-600 text-white shadow-lg" : "text-zinc-600 hover:text-zinc-300"}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 2-COLUMN ENGINE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* MANUAL DIRECTIVES (LEFT 4/12) */}
          <div className="lg:col-span-4 bg-zinc-900/30 rounded-3xl border border-white/[0.04] overflow-hidden flex flex-col h-[650px] shadow-2xl">
            <div className="p-5 px-6 border-b border-white/[0.02] flex justify-between items-center bg-zinc-800/10">
              <h2 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em] flex items-center gap-2">
                <div className="w-1 h-3 bg-zinc-700 rounded-full"></div> Manual Directives
              </h2>
              <button onClick={() => setShowModal(true)} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all shadow-lg">
                <Plus size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {tasks.filter(t => t.source === "user" && t.category === activeTab).map(t => <TaskRow key={t._id} task={t} />)}
              {tasks.filter(t => t.source === "user" && t.category === activeTab).length === 0 && (
                <div className="h-full flex items-center justify-center opacity-10 grayscale py-10">
                   <p className="text-[9px] font-black uppercase tracking-widest italic">Awaiting Manual Data</p>
                </div>
              )}
            </div>
          </div>

          {/* AI ATOMIC MASTERY (RIGHT 8/12) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                <h2 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em]">Atomic Mastery Tracks</h2>
              </div>
              <button onClick={handleRequestAI} disabled={aiLoading} className="px-6 py-2.5 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-xl text-[9px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all disabled:opacity-50 flex items-center gap-2">
                {aiLoading ? "Synthesizing Problems..." : <><Zap size={12} /> Generate Deep-Dive Plan</>}
              </button>
            </div>

            <div className="h-[580px] overflow-y-auto pr-2 custom-scrollbar">
               {/* AI Tasks from Database - Displayed as Deep-Dive Cards */}
               {tasks.filter(t => t.source === "ai" && t.category === activeTab).length > 0 ? (
                 tasks.filter(t => t.source === "ai" && t.category === activeTab).map((plan, idx) => (
                   <MasteryTrack key={idx} plan={plan} />
                 ))
               ) : (
                 <div className="h-full flex flex-col items-center justify-center border border-dashed border-white/[0.03] rounded-[3rem] bg-zinc-900/10 opacity-20">
                    <BookOpen size={48} className="mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">No Strategic Plans Generated</p>
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* ANALYTICS STRIP */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4 border-t border-white/[0.03]">
          <ProgressStrip label="DSA Mastery" percentage={progress.dsa} color="bg-blue-500" />
          <ProgressStrip label="Engineering Matrix" percentage={progress.development} color="bg-emerald-500" />
          <ProgressStrip label="Logic Sync" percentage={progress.core || 0} color="bg-purple-500" />
        </div>

        {/* MODAL */}
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-xl">
            <div className="absolute inset-0 bg-black/90" onClick={() => setShowModal(false)}></div>
            <div className="relative w-full max-w-md bg-zinc-900 border border-white/[0.05] rounded-[2rem] p-10 shadow-2xl animate-in zoom-in-95">
              <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-8 leading-none">New <span className="text-blue-500">Task</span></h2>
              <form onSubmit={handleManualSubmit} className="space-y-5">
                <input required className="w-full bg-black border border-white/[0.05] rounded-xl px-5 py-4 text-white text-[11px] outline-none focus:border-blue-500 transition-all font-bold uppercase tracking-tight" placeholder="Objective Name" value={newTask.title} onChange={(e) => setNewTask({...newTask, title: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <select className="bg-black border border-white/[0.05] rounded-xl p-4 text-white text-[9px] font-black uppercase outline-none" value={newTask.priority} onChange={(e) => setNewTask({...newTask, priority: e.target.value})}>
                    <option value="high">Critical</option><option value="medium">Standard</option><option value="low">Sub-task</option>
                  </select>
                  <select className="bg-black border border-white/[0.05] rounded-xl p-4 text-white text-[9px] font-black uppercase outline-none" value={newTask.type} onChange={(e) => setNewTask({...newTask, type: e.target.value})}>
                    <option value="practice">Practice</option><option value="article">Theory</option><option value="video">Video</option>
                  </select>
                </div>
                <input className="w-full bg-black border border-white/[0.05] rounded-xl px-5 py-4 text-white text-[11px] outline-none focus:border-blue-500 transition-all font-bold" placeholder="URL (Optional)" value={newTask.resourceLink} onChange={(e) => setNewTask({...newTask, resourceLink: e.target.value})} />
                <button type="submit" className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-blue-500 transition-all uppercase text-[10px] tracking-widest flex items-center justify-center gap-3">
                   <Send size={14} /> Deploy Objective
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

const ProgressStrip = ({ label, percentage, color }) => (
  <div className="bg-zinc-900/40 p-6 rounded-2xl border border-white/[0.03] shadow-inner">
     <div className="flex justify-between items-end mb-3">
       <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]">{label}</p>
       <p className="text-xl font-black text-white italic tracking-tighter leading-none">{percentage}%</p>
     </div>
     <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.3)]`} style={{ width: `${percentage}%` }}></div>
     </div>
  </div>
);

export default StudyPlan;