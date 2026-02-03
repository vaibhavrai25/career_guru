import { Link, useLocation } from "react-router-dom";
import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";


const MainLayout = ({ children }) => {
  const { pathname } = useLocation();
  const { dark, setDark } = useContext(ThemeContext);


  const navItem = (to, label) => (
    <Link to={to}>
      <p
        className={`p-2 rounded cursor-pointer ${
          pathname === to
            ? "bg-blue-100 text-blue-600 font-semibold"
            : "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
        }`}
      >
        {label}
      </p>
    </Link>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 shadow-md">
        <div className="p-6 text-2xl font-bold border-b">
          Career Guru
        </div>

        <nav className="p-4 space-y-2">
          {navItem("/", "Dashboard")}
          {navItem("/coding", "Coding Stats")}
          {navItem("/study", "Study Plan")}
          {navItem("/resume", "Resume")}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 p-8 overflow-y-auto relative bg-gray-100 dark:bg-gray-900 dark:text-white">
  <button
    onClick={() => setDark(!dark)}
    className="absolute top-4 right-6 px-4 py-2 rounded bg-gray-200 dark:bg-gray-700"
  >
    {dark ? "☀️ Light" : "🌙 Dark"}
  </button>

  {children}
</div>

    </div>
  );
};

export default MainLayout;
