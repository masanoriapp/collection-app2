// src/pages/LoginPage.js
import React, { useState } from "react";
import { auth } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "firebase/auth";
import { useNavigate } from "react-router-dom"; // 🔄 追加

function LoginPage() {
  const [isNewUser, setIsNewUser] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate(); // 🔄 追加

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isNewUser) {
        await createUserWithEmailAndPassword(auth, email, password);
        setMessage("新規登録に成功しました！");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        setMessage("ログインに成功しました！");
      }

      // 🔄 ログイン成功後、マイページへ遷移
      navigate("/mypage");

    } catch (error) {
      setMessage(`エラー: ${error.message}`);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "auto", padding: "20px" }}>
      <h2>{isNewUser ? "新規登録" : "ログイン"}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ display: "block", marginBottom: "10px", width: "100%" }}
        />
        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ display: "block", marginBottom: "10px", width: "100%" }}
        />
        <button type="submit" style={{ width: "100%", padding: "10px" }}>
          {isNewUser ? "登録する" : "ログインする"}
        </button>
      </form>
      <p style={{ marginTop: "10px" }}>
        {isNewUser ? "すでに登録済み？" : "まだアカウントがありませんか？"}{" "}
        <button
          onClick={() => setIsNewUser(!isNewUser)}
          style={{ color: "blue", background: "none", border: "none", cursor: "pointer" }}
        >
          {isNewUser ? "ログインへ" : "新規登録へ"}
        </button>
      </p>
      <p>{message}</p>
    </div>
  );
}

export default LoginPage;

