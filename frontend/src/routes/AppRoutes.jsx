import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import CodingStats from "../pages/CodingStats";
import StudyPlan from "../pages/StudyPlan";
import Resume from "../pages/Resume";
import ResumeAnalyzer from "../pages/Resume";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/" element={<Dashboard />} />
      <Route path="/coding" element={<CodingStats />} />
      <Route path="/study" element={<StudyPlan />} />
      <Route path="/resume" element={<ResumeAnalyzer />} />
  </Routes>
);

export default AppRoutes;
