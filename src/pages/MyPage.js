// src/pages/MyPage.js
import React, { useEffect, useState, useCallback } from "react";
import { auth, db, storage } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  Timestamp
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

function MyPage() {
  const [collections, setCollections] = useState([]);
  const [themesMap, setThemesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editComment, setEditComment] = useState("");

  const [showFreeUpload, setShowFreeUpload] = useState(false);
  const [freeFile, setFreeFile] = useState(null);
  const [freeComment, setFreeComment] = useState("");
  const [uploading, setUploading] = useState(false);

  const [sortKey, setSortKey] = useState("timestamp");
  const [sortOrder, setSortOrder] = useState("desc");

  const user = auth.currentUser;

  const fetchUserCollections = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const q = query(collection(db, "collections"), where("userId", "==", user.uid));
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setCollections(data);

    const themesSnap = await getDocs(collection(db, "themes"));
    const themeMap = {};
    themesSnap.forEach(doc => {
      themeMap[doc.id] = doc.data().title;
    });
    setThemesMap(themeMap);

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchUserCollections();
  }, [fetchUserCollections]);

  const handleDelete = async (id) => {
    const ok = window.confirm("本当に削除しますか？");
    if (!ok) return;

    await deleteDoc(doc(db, "collections", id));
    setCollections(collections.filter(item => item.id !== id));
  };

  const handleEditStart = (id, currentComment) => {
    setEditingId(id);
    setEditComment(currentComment);
  };

  const handleEditSave = async (id) => {
    const docRef = doc(db, "collections", id);
    await updateDoc(docRef, { comment: editComment });
    const updated = collections.map(item =>
      item.id === id ? { ...item, comment: editComment } : item
    );
    setCollections(updated);
    setEditingId(null);
  };

  const handleFreeUpload = async () => {
    if (!freeFile) {
      alert("ファイルを選択してください");
      return;
    }

    setUploading(true);

    try {
      const storageRef = ref(storage, `images/${user.uid}/${Date.now()}_${freeFile.name}`);
      await uploadBytes(storageRef, freeFile);
      const url = await getDownloadURL(storageRef);

      await addDoc(collection(db, "collections"), {
        userId: user.uid,
        themeId: null,
        photoURL: url,
        comment: freeComment,
        timestamp: Timestamp.now(),
      });

      setFreeFile(null);
      setFreeComment("");
      setShowFreeUpload(false);

      await fetchUserCollections();
    } catch (err) {
      console.error(err);
      alert("アップロードに失敗しました");
    } finally {
      setUploading(false);
    }
  };

  // 並び替え処理
  const sortedCollections = [...collections].sort((a, b) => {
    if (sortKey === "timestamp") {
      const aTime = a.timestamp?.seconds || 0;
      const bTime = b.timestamp?.seconds || 0;
      return sortOrder === "asc" ? aTime - bTime : bTime - aTime;
    } else if (sortKey === "title") {
      const aTitle = themesMap[a.themeId] || (a.themeId === null ? "フリー投稿" : "不明");
      const bTitle = themesMap[b.themeId] || (b.themeId === null ? "フリー投稿" : "不明");
      return sortOrder === "asc"
        ? aTitle.localeCompare(bTitle, "ja")
        : bTitle.localeCompare(aTitle, "ja");
    }
    return 0;
  });

  if (loading) return <p>読み込み中...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>マイコレクション</h2>

      {/* 並び替えUI */}
      <div style={{ marginBottom: "10px" }}>
        並び替え：
        <select
          value={`${sortKey}_${sortOrder}`}
          onChange={(e) => {
            const [key, order] = e.target.value.split("_");
            setSortKey(key);
            setSortOrder(order);
          }}
          style={{ marginLeft: "10px" }}
        >
          <option value="timestamp_desc">登録日（新しい順）</option>
          <option value="timestamp_asc">登録日（古い順）</option>
          <option value="title_asc">題目名（五十音順）</option>
          <option value="title_desc">題目名（逆五十音順）</option>
        </select>
      </div>

      {/* フリー投稿ボタン */}
      {!showFreeUpload ? (
        <button onClick={() => setShowFreeUpload(true)} style={{ marginBottom: 20 }}>
          マイコレクションにフリーで投稿する
        </button>
      ) : (
        <div style={{ marginBottom: 20, border: "1px solid #ccc", padding: 10, maxWidth: 400 }}>
          <h3>フリー投稿</h3>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFreeFile(e.target.files[0])}
          /><br />
          <textarea
            rows="2"
            placeholder="コメント（任意）"
            value={freeComment}
            onChange={(e) => setFreeComment(e.target.value)}
            style={{ width: "100%", marginTop: "5px" }}
          /><br />
          <button onClick={handleFreeUpload} disabled={uploading}>
            {uploading ? "アップロード中..." : "アップロード"}
          </button>
          <button onClick={() => setShowFreeUpload(false)} style={{ marginLeft: 10 }} disabled={uploading}>
            キャンセル
          </button>
        </div>
      )}

      {collections.length === 0 ? (
        <p>投稿がまだありません。</p>
      ) : (
        <ul>
          {sortedCollections.map(item => (
            <li key={item.id} style={{ marginBottom: "20px" }}>
              <strong>題目：</strong> {themesMap[item.themeId] || (item.themeId === null ? "フリー投稿" : "不明")}<br />
              <strong>コメント：</strong><br />
              {editingId === item.id ? (
                <>
                  <textarea
                    value={editComment}
                    onChange={(e) => setEditComment(e.target.value)}
                    rows="3"
                    style={{ width: "100%" }}
                  />
                  <br />
                  <button onClick={() => handleEditSave(item.id)}>保存</button>{" "}
                  <button onClick={() => setEditingId(null)}>キャンセル</button>
                </>
              ) : (
                <>
                  {item.comment}<br />
                  <button onClick={() => handleEditStart(item.id, item.comment)}>編集</button>{" "}
                  <button onClick={() => handleDelete(item.id)}>削除</button>
                </>
              )}
              <br />
              <img
                src={item.photoURL}
                alt="投稿写真"
                style={{ width: "200px", marginTop: "10px" }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default MyPage;
