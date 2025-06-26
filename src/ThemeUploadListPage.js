import React, { useEffect, useState } from "react";
import { db, storage, auth } from "./firebase";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  getDoc,
  doc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import "./ThemeUploadListPage.css";  // CSSをインポート

function ThemeUploadListPage() {
  const [themes, setThemes] = useState([]);
  const [userUploads, setUserUploads] = useState({});
  const [commentMap, setCommentMap] = useState({});
  const [fileMap, setFileMap] = useState({});
  const [editMode, setEditMode] = useState({});

  const user = auth.currentUser;

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const themeSnapshot = await getDocs(collection(db, "themes"));
      const themesData = themeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setThemes(themesData);

      const q = query(collection(db, "collections"), where("userId", "==", user.uid));
      const uploadsSnapshot = await getDocs(q);
      const uploads = {};
      uploadsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        uploads[data.themeId] = { ...data, id: doc.id };
      });
      setUserUploads(uploads);
    };

    fetchData();
  }, [user]);

  const handleUpload = async (themeId) => {
    const file = fileMap[themeId];
    const comment = commentMap[themeId] || "";
    if (!file) {
      alert("ファイルを選択してください");
      return;
    }

    try {
      const storageRef = ref(storage, `images/${user.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      const newDoc = await addDoc(collection(db, "collections"), {
        userId: user.uid,
        themeId: themeId,
        photoURL: url,
        comment: comment,
        timestamp: Timestamp.now(),
      });

      const docSnap = await getDoc(doc(db, "collections", newDoc.id));
      setUserUploads(prev => ({
        ...prev,
        [themeId]: { ...docSnap.data(), id: newDoc.id }
      }));
      setCommentMap(prev => ({ ...prev, [themeId]: "" }));
      setFileMap(prev => ({ ...prev, [themeId]: null }));
    } catch (err) {
      console.error(err);
      alert("アップロードに失敗しました");
    }
  };

  const handleEdit = (themeId) => {
    setEditMode(prev => ({ ...prev, [themeId]: true }));
    setCommentMap(prev => ({ ...prev, [themeId]: userUploads[themeId].comment }));
  };

  const handleUpdate = async (themeId) => {
    const file = fileMap[themeId];
    const comment = commentMap[themeId] || "";
    const upload = userUploads[themeId];

    try {
      let photoURL = upload.photoURL;
      if (file) {
        const storageRef = ref(storage, `images/${user.uid}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        photoURL = await getDownloadURL(storageRef);
      }

      await updateDoc(doc(db, "collections", upload.id), {
        photoURL,
        comment,
        timestamp: Timestamp.now(),
      });

      setUserUploads(prev => ({
        ...prev,
        [themeId]: {
          ...prev[themeId],
          photoURL,
          comment,
          timestamp: Timestamp.now()
        }
      }));

      setEditMode(prev => ({ ...prev, [themeId]: false }));
      setFileMap(prev => ({ ...prev, [themeId]: null }));
    } catch (err) {
      console.error(err);
      alert("更新に失敗しました");
    }
  };

  const handleDelete = async (themeId) => {
    const confirmDelete = window.confirm("本当に削除しますか？");
    if (!confirmDelete) return;

    try {
      const upload = userUploads[themeId];
      await deleteDoc(doc(db, "collections", upload.id));

      setUserUploads(prev => {
        const newUploads = { ...prev };
        delete newUploads[themeId];
        return newUploads;
      });
      setCommentMap(prev => ({ ...prev, [themeId]: "" }));
      setFileMap(prev => ({ ...prev, [themeId]: null }));
    } catch (err) {
      console.error(err);
      alert("削除に失敗しました");
    }
  };

  return (
    <div className="theme-upload-container" style={{ padding: "20px" }}>
      <h2>題目と投稿一覧</h2>
      <ul className="theme-list">
        {themes.map(theme => {
          const upload = userUploads[theme.id];
          const isEditing = editMode[theme.id];

          return (
            <li key={theme.id}>
              <h3>{theme.title}</h3>

              {upload && !isEditing ? (
                <div>
                  <img
                    src={upload.photoURL}
                    alt="投稿済画像"
                    style={{ width: "100%", maxWidth: "300px" }}
                  />
                  <p><strong>コメント：</strong>{upload.comment}</p>
                  <p><strong>登録日：</strong>{upload.timestamp?.toDate().toLocaleString()}</p>
                  <button onClick={() => handleEdit(theme.id)}>編集</button>
                  <button onClick={() => handleDelete(theme.id)} style={{ marginLeft: "10px" }}>削除</button>
                </div>
              ) : (
                <div>
                  {!upload && <p style={{ color: "gray" }}>未登録</p>}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFileMap({ ...fileMap, [theme.id]: e.target.files[0] })}
                  /><br />
                  <textarea
                    rows="2"
                    placeholder="コメント（任意）"
                    value={commentMap[theme.id] || ""}
                    onChange={(e) => setCommentMap({ ...commentMap, [theme.id]: e.target.value })}
                    style={{ width: "100%", marginTop: "5px" }}
                  /><br />
                  {upload ? (
                    <>
                      <button onClick={() => handleUpdate(theme.id)}>更新</button>
                      <button onClick={() => setEditMode(prev => ({ ...prev, [theme.id]: false }))} style={{ marginLeft: "10px" }}>キャンセル</button>
                    </>
                  ) : (
                    <button onClick={() => handleUpload(theme.id)}>アップロード</button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default ThemeUploadListPage;
