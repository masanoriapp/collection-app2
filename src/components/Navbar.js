// src/components/Navbar.js
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/"); // ログイン画面へ戻る
  };

  return (
    <nav style={{
      background: "#333",
      color: "white",
      padding: "10px 20px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }}>
      <div>
        <Link to="/mypage" style={linkStyle}>マイページ</Link>
        <Link to="/themes" style={linkStyle}>題目一覧</Link>
      </div>
      <button onClick={handleLogout} style={{
        background: "red",
        color: "white",
        border: "none",
        padding: "8px 12px",
        cursor: "pointer",
        borderRadius: "4px"
      }}>
        ログアウト
      </button>
    </nav>
  );
}

const linkStyle = {
  color: "white",
  marginRight: "15px",
  textDecoration: "none"
};

export default Navbar;
