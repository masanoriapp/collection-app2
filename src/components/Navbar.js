// src/components/Navbar.js
import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/"); // ログイン画面へ戻る
  };

  // 現在のパスに応じてリンクスタイルを変える関数
  const getLinkStyle = (path) => {
    const baseStyle = {
      color: "white",
      marginRight: "15px",
      textDecoration: "none",
      padding: "6px 12px",
      borderRadius: "4px",
    };

    // 選択中のパスなら背景色と文字色を変える
    if (location.pathname === path) {
      return {
        ...baseStyle,
        backgroundColor: "#61dafb", // 明るい青背景
        color: "#282c34",           // 濃い文字色
        fontWeight: "bold",
      };
    }
    return baseStyle;
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
        <Link to="/mypage" style={getLinkStyle("/mypage")}>マイページ</Link>
        <Link to="/themes" style={getLinkStyle("/themes")}>題目一覧</Link>
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

export default Navbar;
