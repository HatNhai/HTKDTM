import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getDatabase, ref, onValue, remove, push } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

/* 🔹 Firebase config */
const firebaseConfig = {
  apiKey: "AIzaSyA8mRkzQ_XrKR-IUYWLmMHUDhOUophLX-U",
  authDomain: "smartrent-httt3.firebaseapp.com",
  databaseURL: "https://smartrent-httt3-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smartrent-httt3",
  storageBucket: "smartrent-httt3.appspot.com",
  messagingSenderId: "758879786728",
  appId: "1:758879786728:web:94cc95552f4211637a9b5d"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const tbody = document.getElementById("list");

/* 🔹 LẤY DANH SÁCH CHỜ DUYỆT */
const pendingRef = ref(db, "pendingPosts");

onValue(pendingRef, (snapshot) => {
  tbody.innerHTML = "";

  if (!snapshot.exists()) {
    tbody.innerHTML = `<tr><td colspan="4">Không có bài chờ duyệt</td></tr>`;
    return;
  }

  snapshot.forEach((child) => {
    const key = child.key;
    const data = child.val();

    tbody.innerHTML += `
      <tr>
        <td>${data.title}</td>
        <td>${data.price}</td>
        <td>
          <span class="status pending">Chờ duyệt</span>
        </td>
        <td>
          <button class="btn btn-approve" onclick="approvePost('${key}')">Duyệt</button>
          <button class="btn btn-reject" onclick="rejectPost('${key}')">Từ chối</button>
        </td>
      </tr>
    `;
  });
});

/* 🔹 DUYỆT → ĐẨY SANG list */
window.approvePost = async function (key) {
  const postRef = ref(db, `pendingPosts/${key}`);

  onValue(postRef, async (snap) => {
    if (snap.exists()) {
      await push(ref(db, "list"), snap.val());
      await remove(postRef);
    }
  }, { onlyOnce: true });
};

/* 🔹 TỪ CHỐI → XOÁ */
window.rejectPost = async function (key) {
  await remove(ref(db, `pendingPosts/${key}`));
};
