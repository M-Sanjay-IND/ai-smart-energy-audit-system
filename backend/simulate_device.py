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
    
    try:
        while True:
            # Simulate slight fluctuations
            voltage = base_voltage + random.uniform(-2.0, 2.0)
            
            # Simulate a fridge cycling on/off or someone turning on a microwave
            # Random current between 1.0A and 3.0A normally, occasional spikes
            if random.random() < 0.1:
                current = random.uniform(5.0, 10.0)  # Spike (e.g., microwave/ac)
            else:
                current = random.uniform(1.0, 3.0)  # Normal usage
                
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
                response = requests.post(SERVER_URL, json=payload, timeout=10)
                if response.status_code == 200:
                    print(f"Sent: {payload['power']}W -- ML Confidence: {response.json().get('confidence')}%")
                else:
                    print(f"Failed to send: {response.status_code}")
            except Exception as e:
                print(f"Connection error: {e}")
                
            time.sleep(5)
            
    except KeyboardInterrupt:
        print("\nSimulation stopped.")

if __name__ == "__main__":
    simulate()
