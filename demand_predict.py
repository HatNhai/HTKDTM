import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.ensemble import RandomForestClassifier

app = Flask(__name__)
CORS(app)

# Load & train model
df = pd.read_csv("demand_data.csv")

X = df[['area', 'price', 'type_code', 'district_code', 'month']]
y = df['demand_level']

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X, y)

@app.route("/")
def home():
    return "Flask ML API is running"

@app.route("/predict-demand", methods=["POST"])
def predict_demand():
    data = request.json

    area = data.get("area", 0)
    price = data.get("price", 0)
    type_code = data.get("type_code", 1)
    district_code = data.get("district_code", 1)
    month = data.get("month", 6)

    sample = [[area, price, type_code, district_code, month]]
    level = int(model.predict(sample)[0])

    return jsonify({"demand_level": level})

if __name__ == "__main__":
    app.run(debug=True)
