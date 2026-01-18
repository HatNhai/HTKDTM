import json
import random
import time

# ==== DANH SÁCH DỮ LIỆU NGẪU NHIÊN ====
business_types = [
    "Cửa hàng kinh doanh", "Văn Phòng", "Homestay",
    "Phòng Trọ", "Cafe", "Nhà hàng", "Studio", "Căn hộ dịch vụ"
]

districts = [
    "Cầu Giấy", "Đống Đa", "Hai Bà Trưng", "Ba Đình", "Hoàn Kiếm",
    "Thanh Xuân", "Long Biên", "Tây Hồ", "Nam Từ Liêm", "Bắc Từ Liêm", "Hà Đông"
]

wards = ["Dịch Vọng", "Trung Liệt", "Phương Liệt", "Kim Liên", "Tràng Tiền", "Mễ Trì", "Phú Diễn", "Bồ Đề"]

titles = [
    "Căn hộ mini gần Times City, có ban công rộng",
    "Phòng trọ giá rẻ, an ninh tốt",
    "Cho thuê văn phòng nhỏ tiện nghi",
    "Homestay trung tâm Hà Nội, đầy đủ nội thất",
    "Shop mặt đường đông người qua lại",
    "Cafe góc phố đẹp, view hồ",
    "Căn hộ dịch vụ cao cấp",
    "Phòng studio gần trường đại học",
    "Văn phòng chia sẻ hiện đại",
    "Nhà hàng sang trọng, sẵn nội thất bếp"
]

descriptions = [
    "Căn hộ mới, đầy đủ tiện nghi, ban công view thoáng.",
    "Phòng sạch sẽ, an ninh đảm bảo, gần chợ và trường học.",
    "Vị trí đắc địa, thuận tiện di chuyển, có chỗ để xe.",
    "Giá cả hợp lý, nội thất cao cấp, phù hợp sinh viên và nhân viên văn phòng.",
    "Không chung chủ, giờ giấc tự do, có thang máy và camera an ninh."
]

# ==== USERS (5 người cố định) ====
users = {
    "ThuThuy": {
        "createdAt": 1762360159155,
        "password": "123456",
        "role": "renter",
        "favorites": [],
        "posted": []
    },
    "Nhai": {
        "createdAt": 1762348988258,
        "password": "12345",
        "role": "owner",
        "favorites": [],
        "posted": []
    },
    "Tham": {
        "createdAt": 1762347111607,
        "password": "123456",
        "role": "owner",
        "favorites": [],
        "posted": []
    },
    "Huyen": {
        "createdAt": 1762358661857,
        "password": "12345",
        "role": "renter",
        "favorites": [],
        "posted": []
    },
    "NguyenVanA": {
        "createdAt": 1762360115462,
        "password": "123456",
        "role": "renter",
        "favorites": [],
        "posted": []
    }
}

# ==== HÀM HỖ TRỢ ====
def random_phone():
    return "09" + str(random.randint(10000000, 99999999))

def random_features():
    return {
        "wifi": random.choice([True, False]),
        "parking": random.choice([True, False]),
        "airConditioner": random.choice([True, False]),
        "kitchen": random.choice([True, False]),
        "balcony": random.choice([True, False])
    }

# ==== TẠO DANH SÁCH MẶT BẰNG (70 bản ghi) ====
listings = {}
for i in range(1, 71):
    listing_id = f"id_{i}"
    price_val = random.randint(3, 15)
    area_val = random.randint(20, 80)
    owner = random.choice(list(users.keys()))
    district = random.choice(districts)
    ward = random.choice(wards)
    created_at = int(time.time() * 1000) - random.randint(10000, 5000000)

    listing = {
        "id": listing_id,
        "title": random.choice(titles),
        "price": price_val * 1000000,
        "priceText": f"{price_val} triệu/tháng",
        "area": area_val,
        "areaText": f"{area_val} m²",
        "address": {
            "ward": f"Phường {ward}",
            "district": f"Quận {district}",
            "city": "Hà Nội"
        },
        "description": random.choice(descriptions),
        "contact": {
            "phone": random_phone(),
            "owner": owner
        },
        "imageURL": "",
        "businessType": random.choice(business_types),
        "features": random_features(),
        "rating": round(random.uniform(3.0, 5.0), 1),
        "reviewCount": 0,
        "createdAt": created_at
    }

    listings[listing_id] = listing
    users[owner]["posted"].append(listing_id)

# ==== TẠO REVIEWS (30 bản ghi) ====
review_texts = ["Rất hài lòng", "Tốt", "Tệ", "Phòng sạch đẹp", "Không đáng tiền", "Dịch vụ ổn"]
reviews = {}

for _ in range(30):
    listing_id = f"id_{random.randint(1, 70)}"
    if listing_id not in reviews:
        reviews[listing_id] = {}

    review_id = f"-Od{random.randint(10000,99999)}"
    user = random.choice(list(users.keys()))
    rating = random.randint(1, 5)

    reviews[listing_id][review_id] = {
        "name": user,
        "rating": rating,
        "text": random.choice(review_texts),
        "timestamp": int(time.time() * 1000)
    }

    listings[listing_id]["reviewCount"] += 1

# ==== GHÉP TẤT CẢ VÀO CẤU TRÚC FIREBASE ====
data = {
    "list": listings,
    "reviews": reviews,
    "users": users
}

# ==== GHI RA FILE JSON ====
with open("bds_data.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("✅ File 'bds_data.json' đã được tạo thành công theo cấu trúc chuẩn Firebase!")