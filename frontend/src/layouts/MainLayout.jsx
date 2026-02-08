import { Link, useLocation, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { AuthContext } from "../context/AuthContext";
import { User as UserIcon, LayoutDashboard, BarChart2, BookOpen, FileText, Settings } from "lucide-react";

const MainLayout = ({ children }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { darkMode, toggleTheme } = useContext(ThemeContext);
  const { user, logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItem = (to, label, icon) => (
    <Link to={to} key={to}>
      <div
        className={`p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all duration-200 ${
          pathname === to
            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 font-semibold"
            : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
        }`}
      >
        {icon}
        {label}
      </div>
    </Link>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 shadow-xl flex flex-col border-r dark:border-gray-700">
        <div className="p-6 text-2xl font-black border-b dark:border-gray-700 text-blue-600 dark:text-blue-400 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-sm">CG</div>
          Career Guru
        </div>

        <nav className="p-4 space-y-2 flex-1">
          {navItem("/", "Dashboard", <LayoutDashboard size={18}/>)}
          {navItem("/coding", "Coding Stats", <BarChart2 size={18}/>)}
          {navItem("/study", "Study Plan", <BookOpen size={18}/>)}
          {navItem("/resume", "Resume Analysis", <FileText size={18}/>)}
          {navItem("/profile", "Profile Settings", <Settings size={18}/>)}
        </nav>

        {/* User Profile Section */}
        <div className="p-4 border-t dark:border-gray-700">
          <Link to="/profile" className="flex items-center gap-3 mb-4 px-2 hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-all group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md overflow-hidden">
              {user?.avatar ? <img src={user.avatar} alt="P" className="w-full h-full object-cover" /> : (user?.name?.charAt(0) || "U")}
            </div>
            <div className="truncate flex-1">
              <p className="text-sm font-bold dark:text-white group-hover:text-blue-500 transition-colors">{user?.name || "User"}</p>
              <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full text-left p-3 text-xs font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 flex items-center justify-end px-8 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 hover:ring-2 ring-blue-400 transition-all border dark:border-gray-700 shadow-sm"
            title="Toggle Dark Mode"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;