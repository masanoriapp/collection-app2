// src/pages/EditPage.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, storage } from "../firebase";
import {
  doc,
  getDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

function EditPage() {
  const { id } = useParams(); // 投稿ID取得
  const navigate = useNavigate();
  const [comment, setComment] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [photoURL, setPhotoURL] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchPost = async () => {
      const docRef = doc(db, "collections", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setComment(data.comment);
        setPhotoURL(data.photoURL);
      } else {
        setMessage("投稿が見つかりません");
      }
    };

    fetchPost();
  }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const docRef = doc(db, "collections", id);
      let updatedPhotoURL = photoURL;

      // 画像が新しく選択されていた場合
      if (imageFile) {
        const storageRef = ref(storage, `images/updated_${Date.now()}_${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        updatedPhotoURL = await getDownloadURL(storageRef);
      }

      // Firestoreのデータを更新
      await updateDoc(docRef, {
        comment: comment,
        photoURL: updatedPhotoURL,
        updatedAt: Timestamp.now(),
      });

      setMessage("更新しました！");
      navigate("/mypage"); // 更新後にマイページへ戻る
    } catch (error) {
      setMessage(`エラー: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>投稿の編集</h2>
      <form onSubmit={handleUpdate}>
        <label>コメント：</label><br />
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows="3"
          style={{ width: "100%" }}
          required
        />
        <br /><br />

        <label>画像を変更（任意）：</label><br />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files[0])}
        />
        <br /><br />

        <img src={photoURL} alt="現在の画像" style={{ width: "200px", marginTop: "10px" }} />
        <br /><br />

        <button type="submit">更新する</button>
      </form>
      <p>{message}</p>
    </div>
  );
}

export default EditPage;
