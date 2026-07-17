import time
import requests
import random
import math

SERVER_URL = "http://127.0.0.1:5000/data"

def simulate():
    print(f"Starting ESP32 simulation... sending data to {SERVER_URL} every 5 seconds\n")
    
    energy_kwh = 0.0
    
    # Base load
    base_voltage = 230.0
    
    session = requests.Session()
    session.headers.update({"ngrok-skip-browser-warning": "true"})
    
    try:
        while True:
            # Simulate slight fluctuations for a 200W bulb
            voltage = base_voltage + random.uniform(-1.0, 1.0)
            
            # 200W at 230V is approx 0.87A
            # Random current around 0.87A normally, very small occasional spikes
            if random.random() < 0.1:
                current = random.uniform(0.92, 0.98)  # Very small anomaly (approx 215-225W)
            else:
                current = random.uniform(0.86, 0.88)  # Normal usage (approx 200W)
                
            power = voltage * current
            
            # Increment energy (kW * hours)
            # 5 seconds is 5/3600 hours
            energy_kwh += (power / 1000.0) * (5.0 / 3600.0)
            
            payload = {
                "voltage": round(voltage, 2),
                "current": round(current, 2),
                "power": round(power, 2),
                "energy": round(energy_kwh, 6)
            }
            
            try:
                response = session.post(SERVER_URL, json=payload, timeout=10)
                if response.status_code == 200:
                    data_out = response.json()
                    print(f"Sent: {payload['power']}W -- ML Confidence: {data_out.get('confidence')}% | Anomaly: {data_out.get('anomaly')}")
                else:
                    print(f"Failed to send: {response.status_code} - {response.text}")
            except Exception as e:
                print(f"Connection error: {e}. Retrying next cycle...")
                
            time.sleep(5)
            
    except KeyboardInterrupt:
        print("\nSimulation stopped.")

if __name__ == "__main__":
    simulate()
