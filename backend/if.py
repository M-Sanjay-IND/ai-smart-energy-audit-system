import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
import os

def load_training_data(filepath='raw_data.csv'):
    """
    Load training data from CSV file
    Expected columns: voltage, current, power, energy
    """
    if not os.path.exists(filepath):
        print(f"Error: Training data file '{filepath}' not found.")
        print("Please generate synthetic data first using generate_synthetic_data.py")
        return None
    
    df = pd.read_csv(filepath)
    print(f"Loaded {len(df)} training samples")
    print(f"Columns: {df.columns.tolist()}")
    return df

def train_isolation_forest(X, contamination=0.05, random_state=42):
    """
    Train Isolation Forest for anomaly detection
    
    Args:
        X: Feature matrix (voltage, current, power)
        contamination: Expected proportion of anomalies (default: 0.05 = 5%)
        random_state: Random seed for reproducibility
    
    Returns:
        Trained model, scaler, and statistics
    """
    print(f"\nTraining Isolation Forest...")
    print(f"Feature matrix shape: {X.shape}")
    print(f"Expected anomaly rate: {contamination*100}%")
    
    # Standardize features for better anomaly detection
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    print(f"\nFeature scaling applied:")
    print(f"  Original range: [{X.min():.2f}, {X.max():.2f}]")
    print(f"  Scaled range: [{X_scaled.min():.2f}, {X_scaled.max():.2f}]")
    
    # Initialize and train Isolation Forest
    model = IsolationForest(
        n_estimators=100,
        contamination=contamination,
        random_state=random_state,
        n_jobs=-1,  # Use all CPU cores
        verbose=1
    )
    
    model.fit(X_scaled)
    
    # Make predictions on training data
    predictions = model.predict(X_scaled)
    anomaly_scores = model.decision_function(X_scaled)
    
    # Calculate statistics
    num_anomalies = np.sum(predictions == -1)
    num_normal = np.sum(predictions == 1)
    anomaly_rate = num_anomalies / len(predictions) * 100
    
    print("\n" + "="*50)
    print("ISOLATION FOREST TRAINING RESULTS")
    print("="*50)
    print(f"Total samples: {len(predictions)}")
    print(f"Normal samples (1): {num_normal}")
    print(f"Anomaly samples (-1): {num_anomalies}")
    print(f"Anomaly rate: {anomaly_rate:.2f}%")
    print(f"\nAnomaly scores:")
    print(f"  Mean: {anomaly_scores.mean():.4f}")
    print(f"  Std: {anomaly_scores.std():.4f}")
    print(f"  Min (most anomalous): {anomaly_scores.min():.4f}")
    print(f"  Max (most normal): {anomaly_scores.max():.4f}")
    print("="*50)
    
    return model, scaler, {
        'num_anomalies': num_anomalies,
        'num_normal': num_normal,
        'anomaly_rate': anomaly_rate,
        'score_mean': anomaly_scores.mean(),
        'score_std': anomaly_scores.std()
    }

def save_model(model, scaler, model_path='iso_model.pkl', scaler_path='iso_scaler.pkl'):
    """
    Save trained model and scaler to disk
    """
    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)
    print(f"\nModel saved to: {model_path}")
    print(f"Scaler saved to: {scaler_path}")

def test_model(model, scaler, test_cases):
    """
    Test the model with specific test cases
    """
    print("\n" + "="*50)
    print("TESTING ISOLATION FOREST")
    print("="*50)
    
    for case_name, (voltage, current, power, h10, h50) in test_cases.items():
        features = np.array([[voltage, current, power, h10, h50]])
        features_scaled = scaler.transform(features)
        prediction = model.predict(features_scaled)[0]
        score = model.decision_function(features_scaled)[0]
        
        status = "NORMAL" if prediction == 1 else "ANOMALY"
        print(f"\n{case_name}:")
        print(f"  Input: V={voltage}V, I={current}A, P={power}W")
        print(f"  Prediction: {status} ({prediction})")
        print(f"  Anomaly Score: {score:.4f}")

def main():
    print("Smart Energy Audit System - Isolation Forest Training")
    print("="*50)
    
    # Load training data
    df = load_training_data('raw_data.csv')
    if df is None:
        return
    
    # Prepare features as DELTAS (rate of change) so the model adapts to new steady states
    print("\nConverting absolute readings to deltas (rate of change)...")
    X_df = df[['voltage', 'current', 'power']].diff().fillna(0)
    X_df['hist_mean_p_10'] = df['power'].rolling(window=10, min_periods=1).mean()
    X_df['hist_mean_p_50'] = df['power'].rolling(window=50, min_periods=1).mean()
    X = X_df.values
    
    # Train model
    model, scaler, stats = train_isolation_forest(X, contamination=0.05)
    
    # Save model and scaler
    save_model(model, scaler)
    
    # Test with example cases (now representing CHANGE, not absolute values)
    test_cases = {
        "Steady state (no change)": (0, 0, 0, 1150, 1150),
        "Tiny fluctuation": (1.2, 0.05, 12, 1150, 1150),
        "Turned on 60W bulb": (0, 0.26, 60, 1150, 1150),
        "Massive power surge": (10, 8.0, 1500, 1150, 1150),
        "Sudden voltage drop": (-40, 0, -50, 1150, 1150),
        "Appliance disconnected": (0, -5.0, -1150, 1150, 1150)
    }
    
    test_model(model, scaler, test_cases)
    
    print("\n✓ Training completed successfully!")
    print("\nNext steps:")
    print("  1. Copy 'iso_model.pkl' and 'iso_scaler.pkl' to your backend/ml directory")
    print("  2. Restart your Flask server")
    print("  3. Anomaly detection will be enabled automatically")

if __name__ == '__main__':
    main()