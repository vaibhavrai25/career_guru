import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

import Home from "../pages/Home";
import Dashboard from "../pages/Dashboard";
import CodingStats from "../pages/CodingStats";
import StudyPlan from "../pages/StudyPlan";
import Resume from "../pages/Resume";
import ResumeUpload from "../pages/ResumeUpload";
import ResumeAnalysis from "../pages/ResumeAnalysis";
import Profile from "../pages/Profile";
import PublicPortfolio from "../pages/PublicPortfolio";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Onboarding from "../pages/Onboarding";

const FullScreenLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-[var(--app-bg)] text-[var(--app-text)]">
    <div className="flex flex-col items-center gap-4">
      <div className="h-12 w-12 animate-spin rounded-full border-2 border-[var(--app-accent)] border-t-transparent" />
      <p className="text-sm text-[var(--app-muted)]">Loading workspace...</p>
    </div>
  </div>
);

const hasStoredAuth = () => {
  return Boolean(localStorage.getItem("token") && localStorage.getItem("user"));
};

const useAuthState = () => {
  const auth = useContext(AuthContext);

  return {
    loading: Boolean(auth?.loading),
    isAuthenticated:
      typeof auth?.isAuthenticated === "boolean"
        ? auth.isAuthenticated
        : Boolean(auth?.user) || hasStoredAuth(),
  };
};

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuthState();
  const location = useLocation();

  if (loading) return <FullScreenLoader />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuthState();

  if (loading) return <FullScreenLoader />;

  if (isAuthenticated) {
    const onboardingPending = localStorage.getItem("onboardingPending") === "true";

    return (
      <Navigate
        to={onboardingPending ? "/onboarding" : "/dashboard"}
        replace
      />
    );
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />

      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <Register />
          </PublicOnlyRoute>
        }
      />

      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/coding"
        element={
          <ProtectedRoute>
            <CodingStats />
          </ProtectedRoute>
        }
      />

      <Route
        path="/study"
        element={
          <ProtectedRoute>
            <StudyPlan />
          </ProtectedRoute>
        }
      />

      <Route
        path="/resume"
        element={
          <ProtectedRoute>
            <Resume />
          </ProtectedRoute>
        }
      />

      <Route
        path="/resume/upload"
        element={
          <ProtectedRoute>
            <ResumeUpload />
          </ProtectedRoute>
        }
      />

      <Route
        path="/resume/:resumeId"
        element={
          <ProtectedRoute>
            <ResumeAnalysis />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route path="/u/:username" element={<PublicPortfolio />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;