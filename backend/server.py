from flask import Flask, request, jsonify
import joblib
import numpy as np
from datetime import datetime

# Firebase
import firebase_admin
from firebase_admin import credentials, firestore

# -------------------------
# INITIAL SETUP
# -------------------------

app = Flask(__name__)

# Load ML models ONCE (with safety fallback if missing)
try:
    rf_model = joblib.load("rf_power_model.pkl") 
    rf_scaler = joblib.load("rf_power_scaler.pkl")
except:
    rf_model = None
    rf_scaler = None

try:
    iso_model = joblib.load("iso_model.pkl")
    iso_scaler = joblib.load("iso_scaler.pkl")
except:
    iso_model = None
    iso_scaler = None

# In-memory state to track the LAST reading from ESP32
# This allows us to calculate rate-of-change (deltas) on the fly.
last_reading = {
    "voltage": 230.0,
    "current": 0.0,
    "power": 0.0
}

# Firebase setup
cred = credentials.Certificate("firebase_key.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# -------------------------
# ROUTES
# -------------------------

@app.route('/')
def home():
    return "Smart Energy Audit Backend Running"

# -------------------------
# STATUS ROUTE (for frontend)
# -------------------------
@app.route('/status')
def status():
    return jsonify({
        "backend": "online",
        "ml_model": "loaded" if (rf_model and iso_model) else "missing",
        "database": "connected",
        "esp32": "unknown"  # frontend determines using latest timestamp
    })

# -------------------------
# RECEIVE DATA FROM ESP32
# -------------------------
@app.route('/data', methods=['POST'])
def receive_data():
    try:
        data = request.json

        # Extract values
        voltage = float(data.get("voltage", 0))
        current = float(data.get("current", 0))
        power = float(data.get("power", voltage * current))
        energy = float(data.get("energy", 0))

        # Calculate Deltas (Rate of Change)
        delta_v = voltage - last_reading["voltage"]
        delta_i = current - last_reading["current"]
        delta_p = power - last_reading["power"]

        # Update in-memory state for the next reading
        last_reading["voltage"] = voltage
        last_reading["current"] = current
        last_reading["power"] = power

        # -------------------------
        # ML PREDICTION (Dynamic Random Forest)
        # -------------------------
        if rf_model is not None and rf_scaler is not None:
            try:
                # Feed current deltas to predict NEXT delta
                features_delta = np.array([[delta_v, delta_i, delta_p]])
                features_scaled = rf_scaler.transform(features_delta)
                predicted_delta_p = float(rf_model.predict(features_scaled)[0])
                
                # Next absolute power = current power + predicted change
                predicted_energy = power + predicted_delta_p
            except Exception as e:
                print("RF Prediction failed:", e)
                predicted_energy = power
        else:
            predicted_energy = power  

        # -------------------------
        # ANOMALY DETECTION (Isolation Forest)
        # -------------------------
        anomaly = False
        confidence = 100.0  # By default very confident it's normal

        if iso_model is not None and iso_scaler is not None:
            try:
                # IMPORTANT: Feed DELTAS (rate of change) to Isolation Forest!
                features_delta = np.array([[delta_v, delta_i, delta_p]])
                features_scaled = iso_scaler.transform(features_delta)
                
                anomaly_raw = iso_model.predict(features_scaled)[0]
                anomaly = bool(anomaly_raw == -1)
                
                # decision_function yields score (negative=anomaly, positive=normal)
                score = float(iso_model.decision_function(features_scaled)[0])
                
                # Map roughly [-0.5, 0.5] range to [0, 100]% confidence
                # For anomalies, a more negative score indicates higher confidence it's an anomaly.
                # For normals, a more positive score indicates higher confidence it's normal.
                # Use a sigmoid-like transformation bounding to [0, 100]
                probability = 1.0 / (1.0 + np.exp(-10 * score))
                if anomaly:
                    # If anomaly, probability of normal is low. so confidence in "anomaly" = 100 - (prob*100)
                    confidence = round((1.0 - probability) * 100, 1)
                else:
                    confidence = round(probability * 100, 1)
            except Exception as e:
                print("Model inference failed:", e)
                # Fallback to rule-based if inference crashes
                anomaly = bool(power > 1000 or voltage < 210)
        else:
            # Fallback placeholder rule-based anomaly detection used by user
            anomaly = bool(power > 1000 or voltage < 210)

        # -------------------------
        # STORE IN FIRESTORE
        # -------------------------
        doc = {
            "timestamp": datetime.utcnow(),
            "voltage": voltage,
            "current": current,
            "power": power,
            "energy": energy,
            "predicted_energy": predicted_energy,
            "anomaly": anomaly,
            "confidence": confidence
        }

        db.collection("energy_data").add(doc)

        # -------------------------
        # RESPONSE TO ESP32
        # -------------------------
        return jsonify({
            "status": "success",
            "predicted_energy": predicted_energy,
            "anomaly": anomaly,
            "confidence": confidence
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


# -------------------------
# GET DATA FOR FRONTEND
# -------------------------
@app.route('/get-data', methods=['GET'])
def get_data():
    try:
        docs = db.collection("energy_data")\
                 .order_by("timestamp", direction=firestore.Query.DESCENDING)\
                 .limit(100)\
                 .stream()

        data_list = []

        for doc in docs:
            d = doc.to_dict()

            # Convert timestamp for JSON
            if "timestamp" in d:
                d["timestamp"] = d["timestamp"].isoformat()

            data_list.append(d)

        return jsonify(data_list)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------------------------
# RUN SERVER
# -------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)