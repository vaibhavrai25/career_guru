const MainLayout = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-6 text-2xl font-bold border-b">
          Career Guru
        </div>

        <nav className="p-4 space-y-4">
          <p className="cursor-pointer hover:text-blue-600">Dashboard</p>
          <p className="cursor-pointer hover:text-blue-600">Coding Stats</p>
          <p className="cursor-pointer hover:text-blue-600">Study Plan</p>
          <p className="cursor-pointer hover:text-blue-600">Resume</p>
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

export default MainLayout;
