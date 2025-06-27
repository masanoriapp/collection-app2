// src/pages/MyPage.js
import "../styles/MyPage.css";
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

  const [sortKey, setSortKey] = useState("timestamp");
  const [sortOrder, setSortOrder] = useState("desc");

  const [searchKeyword, setSearchKeyword] = useState("");

  const [showFreeUpload, setShowFreeUpload] = useState(false);
  const [freeFile, setFreeFile] = useState(null);
  const [freeTitle, setFreeTitle] = useState("");
  const [freeComment, setFreeComment] = useState("");
  const [uploading, setUploading] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editComment, setEditComment] = useState("");

  const [modalData, setModalData] = useState(null);

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
    setModalData(null);
  };

  const handleEditStart = (item) => {
    setEditingId(item.id);
    setEditTitle(item.freeTitle || (item.themeId ? themesMap[item.themeId] : ""));
    setEditComment(item.comment || "");
    setModalData(item);
  };

  const handleEditSave = async () => {
    if (!editingId) return;

    const docRef = doc(db, "collections", editingId);
    const updateData = { comment: editComment };
    if (modalData.themeId === null) {
      updateData.freeTitle = editTitle;
    }
    await updateDoc(docRef, updateData);

    const updated = collections.map(item =>
      item.id === editingId
        ? { ...item, comment: editComment, freeTitle: modalData.themeId === null ? editTitle : item.freeTitle }
        : item
    );
    setCollections(updated);
    setEditingId(null);
    setModalData(null);
  };

  const handleFreeUpload = async () => {
    if (!freeFile) {
      alert("ファイルを選択してください");
      return;
    }
    if (!freeTitle.trim()) {
      alert("題目を入力してください");
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
        freeTitle: freeTitle.trim(),
        photoURL: url,
        comment: freeComment,
        timestamp: Timestamp.now(),
      });

      setFreeFile(null);
      setFreeTitle("");
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
  const sortedCollections = [...collections]
    .filter(item => {
      const title = item.themeId
        ? themesMap[item.themeId] || "不明"
        : item.freeTitle || "フリー投稿";
      return title.includes(searchKeyword);
    })
    .sort((a, b) => {
      if (sortKey === "timestamp") {
        const aTime = a.timestamp?.seconds || 0;
        const bTime = b.timestamp?.seconds || 0;
        return sortOrder === "asc" ? aTime - bTime : bTime - aTime;
      } else if (sortKey === "title") {
        const aTitle = a.themeId
          ? themesMap[a.themeId] || "不明"
          : a.freeTitle || "フリー投稿";
        const bTitle = b.themeId
          ? themesMap[b.themeId] || "不明"
          : b.freeTitle || "フリー投稿";
        return sortOrder === "asc"
          ? aTitle.localeCompare(bTitle, "ja")
          : bTitle.localeCompare(aTitle, "ja");
      }
      return 0;
    });

  if (loading) return <p>読み込み中...</p>;

return (
  <div className="mypage-container" style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
    <h2>マイコレクション</h2>

      {/* 並び替え＆検索 */}
      <div className="control-group">
  <div className="control-item">
    <label>並び替え：</label>
    <select
      value={`${sortKey}_${sortOrder}`}
      onChange={(e) => {
        const [key, order] = e.target.value.split("_");
        setSortKey(key);
        setSortOrder(order);
      }}
    >
      <option value="timestamp_desc">登録日（新しい順）</option>
      <option value="timestamp_asc">登録日（古い順）</option>
      <option value="title_asc">題目名（五十音順）</option>
      <option value="title_desc">題目名（逆五十音順）</option>
    </select>
  </div>
  <div className="control-item">
    <label>題目検索：</label>
    <input
      type="text"
      placeholder="題目で検索"
      value={searchKeyword}
      onChange={(e) => setSearchKeyword(e.target.value)}
    />
  </div>
</div>
<button className="fixed-post-button" onClick={() => setShowFreeUpload(true)}>
  マイコレクションにフリーで投稿する
</button>
{showFreeUpload && (
  <div className="modal" onClick={() => setShowFreeUpload(false)}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <h3>フリー投稿</h3>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFreeFile(e.target.files[0])}
      />
      <input
        type="text"
        placeholder="題目を入力"
        value={freeTitle}
        onChange={(e) => setFreeTitle(e.target.value)}
      />
      <textarea
        rows="2"
        placeholder="コメント（任意）"
        value={freeComment}
        onChange={(e) => setFreeComment(e.target.value)}
      />
      <div>
        <button onClick={handleFreeUpload} disabled={uploading}>
          {uploading ? "アップロード中..." : "アップロード"}
        </button>
        <button
          onClick={() => setShowFreeUpload(false)}
          disabled={uploading}
          style={{ marginLeft: 10 }}
        >
          キャンセル
        </button>
      </div>
    </div>
  </div>
)}


 

      {/* 画像グリッド表示 */}
      {sortedCollections.length === 0 ? (
        <p>投稿がまだありません。</p>
      ) : (
        <div className="grid-container" style={{ flex: 1 }}>
  {sortedCollections.map(item => (
    <div key={item.id} className="grid-item">
      <img
        src={item.photoURL}
        alt="投稿写真"
        onClick={() => setModalData(item)}
      />
    </div>
  ))}
</div>
      )}

      {/* モーダル */}
      {modalData && (
        <div className="modal" onClick={() => setModalData(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={modalData.photoURL} alt="詳細画像" />
            {editingId === modalData.id ? (
              <>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="題目を編集"
                />
                <textarea
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  rows="3"
                />
                <div>
                  <button onClick={handleEditSave}>保存</button>
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setModalData(null);
                    }}
                    style={{ marginLeft: 10 }}
                  >
                    キャンセル
                  </button>
                </div>
              </>
            ) : (
              <>
                <p>
                  <strong>題目：</strong>{" "}
                  {modalData.themeId
                    ? themesMap[modalData.themeId] || "不明"
                    : modalData.freeTitle || "フリー投稿"}
                </p>
                <p>
                  <strong>コメント：</strong> {modalData.comment || ""}
                </p>
                <p>
                  <strong>登録日：</strong>{" "}
                  {modalData.timestamp
                    ? new Date(modalData.timestamp.seconds * 1000).toLocaleDateString()
                    : ""}
                </p>
                <div>
                  <button onClick={() => handleEditStart(modalData)}>編集</button>
                  <button
                    onClick={() => {
                      handleDelete(modalData.id);
                    }}
                    style={{ marginLeft: 10 }}
                  >
                    削除
                  </button>
                  <button
                    onClick={() => setModalData(null)}
                    style={{ marginLeft: 10 }}
                  >
                    閉じる
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MyPage;
