// src/FreePostPage.js
import React, { useState, useEffect } from "react";
import { db, storage, auth } from "./firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  Timestamp,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

function FreePostPage() {
  const [freePosts, setFreePosts] = useState([]);
  const [file, setFile] = useState(null);
  const [comment, setComment] = useState("");
  const user = auth.currentUser;

  useEffect(() => {
    const fetchFreePosts = async () => {
      if (!user) return;
      const q = query(collection(db, "freePosts"), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      setFreePosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchFreePosts();
  }, [user]);

  const handleUpload = async () => {
    if (!file) {
      alert("ファイルを選択してください");
      return;
    }
    try {
      const storageRef = ref(storage, `freePosts/${user.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await addDoc(collection(db, "freePosts"), {
        userId: user.uid,
        photoURL: url,
        comment: comment || "",
        timestamp: Timestamp.now(),
      });
      setFile(null);
      setComment("");
      // 再取得
      const q = query(collection(db, "freePosts"), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      setFreePosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error(error);
      alert("アップロードに失敗しました");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("本当に削除しますか？")) return;
    try {
      await deleteDoc(doc(db, "freePosts", id));
      setFreePosts(prev => prev.filter(post => post.id !== id));
    } catch (error) {
      console.error(error);
      alert("削除に失敗しました");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>フリー投稿</h2>
      <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} /><br />
      <textarea
        rows={3}
        placeholder="コメント（任意）"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        style={{ width: "100%", marginTop: 5 }}
      /><br />
      <button onClick={handleUpload}>投稿する</button>

      <h3 style={{ marginTop: 30 }}>投稿一覧</h3>
      <ul>
        {freePosts.map(post => (
          <li key={post.id} style={{ marginBottom: 20 }}>
            <img src={post.photoURL} alt="フリー投稿" style={{ width: 200 }} /><br />
            <p>{post.comment}</p>
            <p><small>{post.timestamp?.toDate().toLocaleString()}</small></p>
            <button onClick={() => handleDelete(post.id)}>削除</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FreePostPage;
