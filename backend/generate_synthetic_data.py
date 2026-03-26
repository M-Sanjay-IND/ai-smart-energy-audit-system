import pandas as pd
import numpy as np

# Total records to simulate
n_records = 5000

# Base realistic values
voltage = np.random.normal(230, 2, n_records)
current = np.random.normal(5, 1, n_records)

# Introduce some appliances (jumps in current)
# Bulb on (0.26A ~ 60W)
current[100:200] += 0.26 
# Microwave on (5A ~ 1150W)
current[1000:1050] += 5.0
# Heavy machinery (15A)
current[3000:3020] += 15.0

# Calculate power 
power = voltage * current

# Calculate accumulated energy (kwh) for RF
# Assuming 1 second intervals for simplicity
kwh = (power / 1000) * (np.arange(n_records) / 3600)

df = pd.DataFrame({
    'voltage': voltage,
    'current': current,
    'power': power,
    'kwh': kwh
})

df.to_csv('raw_data.csv', index=False)
print(f"Generated raw_data.csv with {n_records} synthetic readings for model training.")
