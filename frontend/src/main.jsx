import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
  <AuthProvider>
  <ThemeProvider>
    <App />
  </ThemeProvider>
  </AuthProvider>
  </BrowserRouter>
);
