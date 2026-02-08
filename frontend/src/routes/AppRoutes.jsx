import { Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

// Pages
import Dashboard from "../pages/Dashboard";
import CodingStats from "../pages/CodingStats";
import StudyPlan from "../pages/StudyPlan";
import Resume from "../pages/Resume";
import Profile from "../pages/Profile"; // Import Profile Settings
import PublicPortfolio from "../pages/PublicPortfolio"; // Import Public Page
import Login from "../pages/Login";
import Register from "../pages/Register";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Private Routes */}
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/coding" element={<ProtectedRoute><CodingStats /></ProtectedRoute>} />
      <Route path="/study" element={<ProtectedRoute><StudyPlan /></ProtectedRoute>} />
      <Route path="/resume" element={<ProtectedRoute><Resume /></ProtectedRoute>} />
      
      {/* Settings Route - Now Connected! */}
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

      {/* Public Routes - No Protection Needed */}
      <Route path="/u/:username" element={<PublicPortfolio />} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRoutes;