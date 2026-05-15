import { Link, useLocation, useNavigate } from "react-router-dom";
import { useContext, useMemo, useState } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { AuthContext } from "../context/AuthContext";
import {
  BarChart2,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  User as UserIcon,
  X,
} from "lucide-react";

const navItems = [
  {
    to: "/dashboard",
    label: "Dashboard",
    short: "Home",
    icon: LayoutDashboard,
  },
  {
    to: "/coding",
    label: "Coding Stats",
    short: "Coding",
    icon: BarChart2,
  },
  {
    to: "/study",
    label: "Study Plan",
    short: "Study",
    icon: BookOpen,
  },
  {
    to: "/resume",
    label: "Resume",
    short: "Resume",
    icon: FileText,
  },
  {
    to: "/profile",
    label: "Profile",
    short: "Profile",
    icon: Settings,
  },
];

const MainLayout = ({ children }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const { darkMode, toggleTheme } = useContext(ThemeContext);
  const { user, logout } = useContext(AuthContext);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const activeLabel = useMemo(() => {
    const exact = navItems.find((item) => item.to === pathname);
    if (exact) return exact.label;

    if (pathname.startsWith("/resume")) return "Resume";
    if (pathname.startsWith("/study")) return "Study Plan";
    if (pathname.startsWith("/coding")) return "Coding Stats";
    if (pathname.startsWith("/dashboard")) return "Dashboard";

    return "Command Center";
  }, [pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActiveRoute = (to) => {
    if (to === "/dashboard") return pathname === "/dashboard";
    return pathname === to || pathname.startsWith(`${to}/`);
  };

  const sidebarWidth = collapsed ? "lg:w-[84px]" : "lg:w-[272px]";

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="h-16 flex items-center justify-between gap-3 px-4 border-b border-[var(--app-border)]">
        <Link to="/dashboard" className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-[var(--app-accent)] text-zinc-950 flex items-center justify-center font-black shadow-sm shrink-0">
            CG
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-black tracking-tight text-[var(--app-text)] truncate">
                Career Guru
              </p>
              <p className="text-[10px] font-bold text-[var(--app-faint)] uppercase tracking-[0.18em] truncate">
                Prep Workspace
              </p>
            </div>
          )}
        </Link>

        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-2 rounded-xl hover:bg-[var(--app-surface-2)] text-[var(--app-muted)]"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActiveRoute(item.to);

          return (
            <Link
              to={item.to}
              key={item.to}
              onClick={() => setSidebarOpen(false)}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${
                active
                  ? "bg-[var(--app-accent)] text-zinc-950 shadow-sm"
                  : "text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-surface-2)]"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                size={18}
                className={active ? "text-zinc-950" : "text-inherit"}
              />

              {!collapsed && (
                <span className="text-sm font-bold truncate">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-3 hidden lg:block">
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-surface-2)] transition-all"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && (
            <span className="text-xs font-black uppercase tracking-widest">
              Collapse
            </span>
          )}
        </button>
      </div>

      <div className="border-t border-[var(--app-border)] p-3">
        <Link
          to="/profile"
          onClick={() => setSidebarOpen(false)}
          className={`flex items-center gap-3 rounded-xl p-2.5 hover:bg-[var(--app-surface-2)] transition-all ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <div className="h-10 w-10 rounded-full bg-[var(--app-surface-2)] border border-[var(--app-border)] flex items-center justify-center text-[var(--app-text)] font-black overflow-hidden shrink-0">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : user?.name ? (
              user.name.charAt(0).toUpperCase()
            ) : (
              <UserIcon size={18} />
            )}
          </div>

          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-[var(--app-text)] truncate">
                {user?.name || "User"}
              </p>
              <p className="text-[10px] text-[var(--app-faint)] truncate">
                {user?.email || "No email"}
              </p>
            </div>
          )}
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className={`mt-2 w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-red-500 hover:bg-red-500/10 transition-all ${
            collapsed ? "justify-center" : ""
          }`}
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut size={17} />
          {!collapsed && (
            <span className="text-xs font-black uppercase tracking-widest">
              Logout
            </span>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="app-shell min-h-screen">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[272px] transform border-r border-[var(--app-border)] bg-[var(--app-surface)] transition-transform duration-200 lg:translate-x-0 ${sidebarWidth} ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </aside>

      <div
        className={`min-h-screen transition-all duration-200 ${
          collapsed ? "lg:pl-[84px]" : "lg:pl-[272px]"
        }`}
      >
        <header className="sticky top-0 z-30 h-16 border-b border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-bg)_84%,transparent)] backdrop-blur-xl">
          <div className="h-full flex items-center justify-between gap-4 px-4 lg:px-7">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-surface-2)]"
              >
                <Menu size={20} />
              </button>

              <div className="min-w-0">
                <p className="text-[10px] text-[var(--app-faint)] font-black uppercase tracking-[0.22em]">
                  Workspace
                </p>
                <h1 className="text-base lg:text-lg app-title truncate">
                  {activeLabel}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-bold text-[var(--app-muted)]">
                  System live
                </span>
              </div>

              <button
                type="button"
                onClick={toggleTheme}
                className="h-10 w-10 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-surface-2)] transition-all flex items-center justify-center"
                title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {darkMode ? <Sun size={17} /> : <Moon size={17} />}
              </button>
            </div>
          </div>
        </header>

        <main className="px-4 py-5 lg:px-7 lg:py-7">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;