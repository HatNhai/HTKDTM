from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from sklearn.ensemble import RandomForestRegressor

app = Flask(__name__)
CORS(app)

# ================= LOAD & TRAIN MODEL =================
df = pd.read_csv("price_data.csv")

X = df[['area', 'rooms', 'furnished', 'type_code', 'district_code']]
y = df['price']

price_model = RandomForestRegressor(n_estimators=100, random_state=42)
price_model.fit(X, y)
# =====================================================

@app.route("/")
def home():
    return "Flask ML API is running"

# ================= DỰ ĐOÁN GIÁ =================
@app.route("/predict-price", methods=["POST"])
def predict_price():
    data = request.json or {}

    X_input = [[
        data.get("area", 0),
        data.get("rooms", 1),
        data.get("furnished", 1),
        data.get("type_code", 1),
        data.get("district_code", 1)
    ]]

    price = price_model.predict(X_input)[0]

    return jsonify({
        "predicted_price": int(price)
    })

# ================= DỰ ĐOÁN NHU CẦU =================
@app.route("/predict-demand", methods=["POST"])
def predict_demand():
    data = request.json or {}

    price = data.get("price", 0)
    area = data.get("area", 0)

    if price < 5_000_000 and area < 30:
        level = 3
    elif price < 10_000_000:
        level = 2
    else:
        level = 1

    return jsonify({"demand_level": level})

if __name__ == "__main__":
    app.run(debug=True)
