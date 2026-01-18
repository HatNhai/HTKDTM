import { db } from "./js/firebase-config.js";
import { ref, push } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

// ================= MAP =================
let map = L.map("map").setView([21.0278, 105.8342], 12); // Hà Nội

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap"
}).addTo(map);

let marker = null;
let latLng = null;

// ================= GEOCODING =================
async function geocodeAddress(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
  const res = await fetch(url);
  const data = await res.json();
  return data[0];
}

// ================= UPDATE MAP =================
async function updateMap() {
  const fullAddress = [
    address.value,
    ward.value,
    district.value,
    city.value
  ].filter(Boolean).join(", ");

  if (fullAddress.length < 10) return;

  try {
    const result = await geocodeAddress(fullAddress);
    if (!result) return;

    const lat = Number(result.lat);
    const lon = Number(result.lon);

    latLng = { lat, lon };

    if (marker) map.removeLayer(marker);
    marker = L.marker([lat, lon]).addTo(map);

    map.setView([lat, lon], 15);
    mapText.innerText = fullAddress;
  } catch (err) {
    console.error(err);
  }
}

// Tránh spam API → blur
["address", "ward", "district", "city"].forEach(id => {
  document.getElementById(id).addEventListener("blur", updateMap);
});

// ================= SUBMIT =================
postForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!latLng) {
    alert("Vui lòng nhập địa chỉ để xác định vị trí");
    return;
  }

  const areaVal = Number(area.value);
  const priceVal = Number(price.value);

  const postData = {
    address: {
      detail: address.value,
      city: city.value,
      district: district.value,
      ward: ward.value
    },

    area: areaVal,
    areaText: `${areaVal} m²`,

    price: priceVal,
    priceText: `${priceVal.toLocaleString()} đ/tháng`,

    businessType: businessType.value,

    description: description.value,

    imageUrl: imageUrl.value || "",

    features: {
      wifi: wifi.checked,
      parking: parking.checked,
      airConditioner: airConditioner.checked,
      toilet: toilet.checked
    },

    contact: {
      owner: owner.value,
      phone: phone.value
    },

    location: latLng,

    rating: 0,
    reviewCount: 0,
    createdAt: Date.now()
  };

  try {
    await push(ref(db, "list"), postData);
    alert("✅ Đăng bài thành công");
    postForm.reset();
  } catch (err) {
    console.error(err);
    alert("❌ Lỗi lưu dữ liệu");
  }
});
