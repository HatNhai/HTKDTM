from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from sklearn.ensemble import RandomForestRegressor

app = Flask(__name__)
CORS(app)

# Load data & train model
df = pd.read_csv("price_data.csv")

X = df[['area', 'rooms', 'furnished', 'type_code', 'district_code']]
y = df['price']

model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X, y)

@app.route("/")
def home():
    return "Price Prediction API is running"

@app.route("/predict-price", methods=["POST"])
def predict_price():
    data = request.json

    area = data.get("area", 0)
    rooms = data.get("rooms", 1)
    furnished = data.get("furnished", 0)
    type_code = data.get("type_code", 1)
    district_code = data.get("district_code", 1)

    sample = [[area, rooms, furnished, type_code, district_code]]
    price = model.predict(sample)[0]

    return jsonify({
        "predicted_price": int(price)
    })

if __name__ == "__main__":
    app.run(debug=True)
