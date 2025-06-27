// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import MyPage from "./pages/MyPage";
import ThemeUploadListPage from "./ThemeUploadListPage";
import Navbar from "./components/Navbar";

function AppWrapper() {
  const location = useLocation();
  const hideNavbar = location.pathname === "/";

  return (
    <>
      {!hideNavbar && <Navbar currentPath={location.pathname} />}
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/themes" element={<ThemeUploadListPage />} />
        <Route path="/mypage" element={<MyPage />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}

export default App;
