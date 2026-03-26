import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import os

RAW_DATA_PATH = "raw_data.csv"
MODEL_PATH = "rf_power_model.pkl"
SCALER_PATH = "rf_power_scaler.pkl"

def load_data():
    if not os.path.exists(RAW_DATA_PATH):
        raise FileNotFoundError("raw_data.csv not found")
    df = pd.read_csv(RAW_DATA_PATH)
    return df

def create_features(df):
    df = df.copy()
    
    # Calculate DELTAS (rate of change)
    df['delta_v'] = df['voltage'].diff().fillna(0)
    df['delta_i'] = df['current'].diff().fillna(0)
    df['delta_p'] = df['power'].diff().fillna(0)

    # Target is predicting the NEXT delta power
    df['next_delta_p'] = df['delta_p'].shift(-1)
    
    df.dropna(inplace=True)
    return df

def train_model(df):
    # We only need 3 features so it matches live ESP32 server capabilities seamlessly!
    feature_cols = ['delta_v', 'delta_i', 'delta_p']

    X = df[feature_cols].values
    y = df['next_delta_p'].values

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42
    )

    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=10,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    print("\nDynamic Random Forest (Delta-based) Evaluation:")
    print("MAE (W change error):", mean_absolute_error(y_test, y_pred))
    print("R2:", r2_score(y_test, y_pred))

    return model, scaler, feature_cols

def save(model, scaler, feature_cols):
    joblib.dump(model, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    joblib.dump(feature_cols, "rf_features.pkl")
    print("\nSaved Dynamic RF model, scaler, and feature list")

def main():
    print("Training Dynamic RF for power delta prediction...")
    df = load_data()
    df = create_features(df)
    model, scaler, feature_cols = train_model(df)
    save(model, scaler, feature_cols)
    print("DONE")

if __name__ == "__main__":
    main()