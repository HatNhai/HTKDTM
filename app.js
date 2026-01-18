import { db } from "./js/firebase-config.js";
import {
  ref,
  get,
  set,
  update,
  push
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

/* ================= USER SESSION ================= */
let currentUser = JSON.parse(localStorage.getItem("currentUser"));

const userInfo = document.getElementById("userInfo");
const usernameDisplay = document.getElementById("usernameDisplay");
const logoutBtn = document.getElementById("logoutBtn");
const loginNav = document.querySelector('a[href="/auth/login.html"]');

const favTab = document.getElementById("favTab");
const postTab = document.getElementById("postTab");

function updateNavbar() {
  if (currentUser) {
    usernameDisplay.textContent = currentUser.username;
    userInfo.classList.remove("d-none");
    loginNav?.classList.add("d-none");

    favTab?.classList.remove("d-none");
    postTab?.classList.remove("d-none");
  } else {
    userInfo.classList.add("d-none");
    loginNav?.classList.remove("d-none");

    favTab?.classList.add("d-none");
    postTab?.classList.add("d-none");
  }
}

logoutBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  localStorage.removeItem("currentUser");
  currentUser = null;
  location.reload();
});

updateNavbar();

/* ================= DOM ================= */
const listingContainer = document.getElementById("listingContainer");
const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");

/* ================= FETCH LIST ================= */
async function fetchListings() {
  const snap = await get(ref(db, "list"));
  if (!snap.exists()) return [];
  return Object.entries(snap.val()).map(([id, v]) => ({
    id,
    ...v
  }));
}


// ===== AI DEMAND PREDICTION =====
const predictBtn = document.getElementById("predictBtn");
const predictResult = document.getElementById("predictResult");

if (predictBtn) {
  predictBtn.addEventListener("click", async () => {
    const price = Number(document.getElementById("priceInput").value);
    const area  = Number(document.getElementById("areaInput").value);

    if (!price || !area) {
      predictResult.innerText = "⚠️ Nhập đủ giá và diện tích";
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:5501/predict-demand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price, area })
      });

      const data = await res.json();

      predictResult.innerText =
        data.demand_level === 2 ? "🔥 Nhu cầu CAO" :
        data.demand_level === 1 ? "⚖️ Nhu cầu TRUNG BÌNH" :
        "❄️ Nhu cầu THẤP";

    } catch (err) {
      console.error(err);
      predictResult.innerText = "❌ Không kết nối được AI";
    }
  });
}

/* ================= DISPLAY LIST ================= */
async function displayListings(list) {
  listingContainer.innerHTML = "";

  if (!list.length) {
    listingContainer.innerHTML =
      `<p class="text-center text-muted">Không có dữ liệu</p>`;
    return;
  }

  for (const item of list) {
    let avg = 0, count = 0;

    const rs = await get(ref(db, `reviews/${item.id}`));
    if (rs.exists()) {
      const arr = Object.values(rs.val());
      count = arr.length;
      avg = arr.reduce((s, r) => s + r.rating, 0) / count;
    }
    avg = Math.round(avg * 10) / 10;

    const stars = Array.from({ length: 5 }, (_, i) =>
      i < Math.round(avg)
        ? `<i class="fa-solid fa-star text-warning"></i>`
        : `<i class="fa-regular fa-star text-warning"></i>`
    ).join("");

    const div = document.createElement("div");
    div.className = "col-md-4";
    div.innerHTML = `
      <div class="card shadow-sm h-100">
        <img src="${item.imageURL || "https://via.placeholder.com/400x200"}"
             class="card-img-top" style="height:200px;object-fit:cover">
        <div class="card-body">
          <h5 class="text-danger">${item.title}</h5>
          <p><b>${item.priceText}</b> • ${item.areaText}</p>
          <p class="small text-muted">${item.address?.district || ""}</p>
          <div class="d-flex justify-content-between align-items-center">
            ${count ? `${stars} <small>(${avg}/5)</small>` : `<small>Chưa đánh giá</small>`}
            <button class="btn btn-outline-danger btn-sm">Chi tiết</button>
          </div>
        </div>
      </div>
    `;

    div.querySelector("button").onclick = () => showDetail(item);
    listingContainer.appendChild(div);
  }
}

/* ================= DETAIL MODAL ================= */
async function showDetail(item) {
  document.getElementById("modalTitle").textContent = item.title;
  document.getElementById("modalImage").src = item.imageURL || "";
  document.getElementById("modalDesc").textContent = item.description || "";
  document.getElementById("modalPrice").textContent = item.priceText;
  document.getElementById("modalArea").textContent = item.areaText;
  document.getElementById("modalAddress").textContent =
    `${item.address?.ward || ""}, ${item.address?.district || ""}`;

  const reviewsList = document.getElementById("reviewsList");
  reviewsList.innerHTML = "Đang tải...";

  const rs = await get(ref(db, `reviews/${item.id}`));
  if (rs.exists()) {
    reviewsList.innerHTML = Object.values(rs.val())
      .sort((a, b) => b.timestamp - a.timestamp)
      .map(r => `
        <div class="border rounded p-2 mb-2">
          <b>${r.name}</b>
          <div class="text-warning">${"⭐".repeat(r.rating)}</div>
          <p>${r.text}</p>
        </div>
      `).join("");
  } else {
    reviewsList.innerHTML =
      `<p class="text-muted">Chưa có đánh giá</p>`;
  }

  document.getElementById("submitReviewBtn").onclick = async () => {
    if (!currentUser) return alert("Vui lòng đăng nhập");

    const rating = +document.getElementById("reviewStars").value;
    const text = document.getElementById("reviewComment").value.trim();
    if (!text) return alert("Nhập nội dung");

    await push(ref(db, `reviews/${item.id}`), {
      name: currentUser.username,
      rating,
      text,
      timestamp: Date.now()
    });

    showDetail(item);
  };

  document.getElementById("favBtn").onclick = () =>
    addToFavorite(item.id);

  new bootstrap.Modal(
    document.getElementById("detailModal")
  ).show();

    // ================= MAP EMBED =================
  const mapFrame = document.getElementById("modalMap");

  let addressText = "";

  if (item.address?.ward || item.address?.district) {
    addressText = `${item.address.ward || ""}, ${item.address.district || ""}, Hà Nội`;
  } else {
    addressText = item.title + " Hà Nội";
  }

  mapFrame.src =
    "https://www.google.com/maps?q=" +
    encodeURIComponent(addressText) +
    "&output=embed";

}

/* ================= FAVORITE ================= */
async function addToFavorite(listingId) {
  if (!currentUser) return alert("Cần đăng nhập");

  const favs = currentUser.favorites || [];
  if (favs.includes(listingId)) {
    return alert("Đã có trong yêu thích");
  }

  favs.push(listingId);

  await update(
    ref(db, `users/${currentUser.username}`),
    { favorites: favs }
  );

  currentUser.favorites = favs;
  localStorage.setItem("currentUser", JSON.stringify(currentUser));
  alert("Đã thêm ❤️");
}

/* ================= TABS ================= */
favTab?.addEventListener("click", async () => {
  if (!currentUser) return alert("Đăng nhập trước");

  const snap = await get(ref(db, `users/${currentUser.username}`));
  currentUser.favorites = snap.val()?.favorites || [];
  localStorage.setItem("currentUser", JSON.stringify(currentUser));

  const all = await fetchListings();
  displayListings(all.filter(i =>
    currentUser.favorites.includes(i.id)
  ));
});

postTab?.addEventListener("click", () => {
  if (!currentUser) return alert("Đăng nhập trước");
  location.href = "post.html";
});

/* ================= SEARCH ================= */
searchBtn.onclick = async () => {
  const key = searchInput.value.toLowerCase();
  const all = await fetchListings();

  displayListings(
    all.filter(i => {
      const title = (i.title || "").toLowerCase();
      const district = (i.address?.district || "").toLowerCase();

      return title.includes(key) || district.includes(key);
    })
  );
};

/* ================= FILTER ================= */
const filterLocation = document.getElementById("filterLocation");
const filterPrice = document.getElementById("filterPrice");
const filterArea = document.getElementById("filterArea");
const filterBusinessType = document.getElementById("filterBusinessType");
const applyFilterBtn = document.getElementById("applyFilterBtn");
const resetFilterBtn = document.getElementById("resetFilterBtn");

/* ===== HELPER PARSE ===== */
function parsePrice(priceText = "") {
  // "7 triệu/tháng", "15.5 triệu", "7tr", "7000000"
  const txt = priceText.toLowerCase();

  // Nếu là số thuần
  if (/^\d+$/.test(txt)) return Number(txt);

  // Bắt số (có thập phân)
  const match = txt.match(/(\d+(\.\d+)?)/);
  if (!match) return 0;

  const value = Number(match[1]);

  // Có chữ "triệu" hoặc "tr"
  if (txt.includes("triệu") || txt.includes("tr")) {
    return value * 1_000_000;
  }

  // Mặc định coi là VNĐ
  return value;
}

function parseArea(areaText = "") {
  // "70 m²" -> 70
  const match = areaText.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

/* ===== APPLY FILTER ===== */
applyFilterBtn.onclick = async () => {
  let list = await fetchListings();

  // 📍 Location (so sánh mềm)
  if (filterLocation.value) {
    list = list.filter(i =>
      i.address?.district
        ?.toLowerCase()
        .includes(filterLocation.value.toLowerCase())
    );
  }

  // 🏷 Business type
  if (filterBusinessType.value) {
    list = list.filter(i =>
      i.businessType === filterBusinessType.value
    );
  }

  // 💰 Price (từ priceText)
  if (filterPrice.value) {
    list = list.filter(i => {
      const p = parsePrice(i.priceText);

      if (filterPrice.value === "1") return p < 10_000_000;
      if (filterPrice.value === "2") return p >= 10_000_000 && p <= 30_000_000;
      if (filterPrice.value === "3") return p > 30_000_000;

      return true;
    });
  }

  // 📐 Area (từ areaText)
  if (filterArea.value) {
    list = list.filter(i => {
      const a = parseArea(i.areaText);

      if (filterArea.value === "1") return a < 50;
      if (filterArea.value === "2") return a >= 50 && a <= 100;
      if (filterArea.value === "3") return a > 100;

      return true;
    });
  }

  document.getElementById("mainTitle").textContent = "Kết quả lọc";
  displayListings(list);
};

/* ===== RESET FILTER ===== */
resetFilterBtn.onclick = async () => {
  filterLocation.value = "";
  filterPrice.value = "";
  filterArea.value = "";
  filterBusinessType.value = "";
  searchInput.value = "";

  document.getElementById("mainTitle").textContent = "Danh sách mặt bằng";
  displayListings(await fetchListings());
};


//Lấy vị trí hiện tại + danh sách gần

function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function fetchGeoMap() {
  const snap = await get(ref(db, "geo"));
  return snap.exists() ? snap.val() : {};
}

const nearMeBtn = document.getElementById("nearMeBtn");
nearMeBtn?.addEventListener("click", () => {
  if (!navigator.geolocation) {
    alert("Trình duyệt không hỗ trợ định vị");
    return;
  }

  nearMeBtn.innerText = "📍 Đang xác định...";

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const userLat = pos.coords.latitude;
      const userLng = pos.coords.longitude;

      const nearby = await findNearbyListings(userLat, userLng);

      nearMeBtn.innerText = "📍 Gần tôi";

      // 👉 HIỂN THỊ KẾT QUẢ
      displayListings(nearby);
      renderNearbyMap(userLat, userLng, nearby);
    },
    () => {
      alert("Không lấy được vị trí");
      nearMeBtn.innerText = "📍 Gần tôi";
    },
    { enableHighAccuracy: true }
  );
});

async function findNearbyListings(userLat, userLng) {
  const [listings, geoMap] = await Promise.all([
    fetchListings(),
    fetchGeoMap()
  ]);

  const results = [];

  for (const item of listings) {
    const g = geoMap[item.id];
    if (!g?.lat || !g?.lng) continue;

    const distance = getDistanceKm(
      userLat,
      userLng,
      g.lat,
      g.lng
    );

    if (distance <= 10) {
      results.push({
        ...item,
        lat: g.lat,
        lng: g.lng,
        distance
      });
    }
  }

  return results.sort((a, b) => a.distance - b.distance);
}
let nearMap;

function renderNearbyMap(userLat, userLng, list) {
  if (!document.getElementById("nearbyMap")) return;

  if (nearMap) nearMap.remove();

  nearMap = L.map("nearbyMap").setView([userLat, userLng], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
  }).addTo(nearMap);

  L.marker([userLat, userLng])
    .addTo(nearMap)
    .bindPopup("📍 Vị trí của bạn")
    .openPopup();

  list.forEach(item => {
    L.marker([item.lat, item.lng])
      .addTo(nearMap)
      .bindPopup(`
        <b>${item.title}</b><br>
        Cách bạn ${item.distance.toFixed(2)} km
      `);
  });
}
const predictPriceBtn = document.getElementById("predictPriceBtn");
const priceResult = document.getElementById("priceResult");

predictPriceBtn?.addEventListener("click", async () => {
  const area = Number(document.getElementById("priceArea").value);
  const rooms = Number(document.getElementById("priceRooms").value);
  const district = Number(document.getElementById("priceDistrict").value);

  if (!area || !rooms || !district) {
    priceResult.innerText = "⚠️ Vui lòng nhập đủ thông tin";
    return;
  }

  priceResult.innerText = "⏳ Đang dự đoán...";

  try {
    const res = await fetch("http://127.0.0.1:5000/predict-price", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ area, rooms, district })
    });

    const data = await res.json();
    console.log("DATA FROM AI:", data);

    // 👉 BẮT GIÁ TRỊ TRẢ VỀ (linh hoạt)
    const price =
      Number(data.price) ||
      Number(data.predicted_price) ||
      Number(data.result);

    if (isNaN(price)) {
      priceResult.innerText = "❌ AI trả dữ liệu không hợp lệ";
      return;
    }

    priceResult.innerText =
      "💰 Giá thuê dự đoán: " +
      price.toLocaleString("vi-VN") +
      " VNĐ/tháng";

  } catch (err) {
    console.error(err);
    priceResult.innerText = "❌ Không kết nối được AI";
  }
});

/* ================= INIT ================= */
const listings = await fetchListings();
displayListings(listings);
