
import { db } from "./js/firebase.js";
import { ref, get, update } from "firebase/database";

// ====== GEOCODE ======
async function geocodeAddress(address) {
  const url =
    "https://nominatim.openstreetmap.org/search?format=json&q=" +
    encodeURIComponent(address);

  const res = await fetch(url, {
    headers: {
      "User-Agent": "SmartRent-Geocoder/1.0"
    }
  });

  const data = await res.json();
  if (!data.length) return null;

  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon)
  };
}

// ====== MAIN ======
async function convertAll() {
  const snap = await get(ref(db, "list"));
  if (!snap.exists()) {
    console.log("❌ Không có dữ liệu");
    return;
  }

  const data = snap.val();
  let count = 0;

  for (const id in data) {
    const item = data[id];
    if (!item.address) continue;

    const addressText =
      `${item.address.ward}, ${item.address.district}, ${item.address.city || "Hà Nội"}`;

    console.log("📍 Geocode:", addressText);

    const geo = await geocodeAddress(addressText);
    if (!geo) {
      console.log("❌ Fail:", id);
      continue;
    }

    await update(ref(db, `geo/${id}`), {
      lat: geo.lat,
      lng: geo.lng,
      source: addressText,
      updatedAt: Date.now()
    });

    console.log(`✅ ${id}: ${geo.lat}, ${geo.lng}`);
    count++;

    // tránh bị block API
    await new Promise(r => setTimeout(r, 1200));
  }

  console.log(`🎉 XONG: ${count} bản ghi`);
}

convertAll();
