import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import warnings
import os

warnings.filterwarnings('ignore')

def generate_graphs():
    plt.style.use('seaborn-v0_8-darkgrid')
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    raw_data_path = os.path.join(base_dir, os.path.join('..', 'backend', 'raw_data.csv'))

    print("Loading data and training RF model...")
    df_train = pd.read_csv(raw_data_path)
    dft = df_train.copy()
    dft['delta_v'] = dft['voltage'].diff().fillna(0)
    dft['delta_i'] = dft['current'].diff().fillna(0)
    dft['delta_p'] = dft['power'].diff().fillna(0)
    dft['hist_mean_p_10'] = dft['power'].rolling(10, min_periods=1).mean()
    dft['hist_mean_p_50'] = dft['power'].rolling(50, min_periods=1).mean()
    
    df_rf = dft.copy()
    df_rf['lag1_delta_p'] = df_rf['delta_p'].shift(1).fillna(0)
    df_rf['lag2_delta_p'] = df_rf['delta_p'].shift(2).fillna(0)
    df_rf['lag3_delta_p'] = df_rf['delta_p'].shift(3).fillna(0)
    df_rf['next_p'] = df_rf['power'].shift(-1)
    df_rf.dropna(inplace=True)
    
    X_rf = df_rf[['delta_v','delta_i','delta_p','lag1_delta_p','lag2_delta_p','lag3_delta_p','hist_mean_p_10','hist_mean_p_50']].values
    y_rf = df_rf['next_p'].values
    
    rf_scaler = StandardScaler()
    X_rf_scaled = rf_scaler.fit_transform(X_rf)
    
    rf_model = RandomForestRegressor(n_estimators=300, max_depth=20, random_state=42, n_jobs=-1)
    rf_model.fit(X_rf_scaled, y_rf)
    print(f"✅ Random Forest trained on {len(X_rf):,} samples.")

    def plot_rf_case(case_name, df):
        dfd = df.copy().reset_index(drop=True)
        dfd['delta_v']        = dfd['voltage'].diff().fillna(0)
        dfd['delta_i']        = dfd['current'].diff().fillna(0)
        dfd['delta_p']        = dfd['power'].diff().fillna(0)
        dfd['lag1_delta_p']   = dfd['delta_p'].shift(1).fillna(0)
        dfd['lag2_delta_p']   = dfd['delta_p'].shift(2).fillna(0)
        dfd['lag3_delta_p']   = dfd['delta_p'].shift(3).fillna(0)
        dfd['hist_mean_p_10'] = dfd['power'].rolling(10, min_periods=1).mean()
        dfd['hist_mean_p_50'] = dfd['power'].rolling(50, min_periods=1).mean()
        features = dfd[['delta_v','delta_i','delta_p','lag1_delta_p','lag2_delta_p','lag3_delta_p','hist_mean_p_10','hist_mean_p_50']].values

        rf_scaled = rf_scaler.transform(features)
        predicted_p = rf_model.predict(rf_scaled)
        
        # Shift predicted absolute power to align with the *next* point it predicts
        forecast_power = np.roll(predicted_p, 1)
        forecast_power[0] = dfd['power'].iloc[0]
        
        idx = dfd.index
        
        fig, ax = plt.subplots(figsize=(10, 4.5))
        ax.set_title(f"{case_name} (RF Forecast vs Actual)", fontsize=14, fontweight='bold')
        
        ax.plot(idx, dfd['power'], color='#27ae60', lw=2.5, alpha=0.6, label='Actual Power')
        ax.plot(idx, forecast_power, color='#8e44ad', lw=2, alpha=1.0, linestyle='--', label='RF Forecast Power')
        
        ax.set_ylabel('Power (Watts)', fontsize=11)
        ax.set_xlabel('Sample Index', fontsize=11)
        ax.legend(loc='lower right')
        ax.grid(True, alpha=0.3, linestyle='--')
        plt.tight_layout()
        
        safe = case_name.replace(' ', '_').replace(':', '').replace('=', '_')
        out_file = os.path.join(base_dir, f'{safe}_RF.png')
        plt.savefig(out_file, dpi=180, bbox_inches='tight')
        plt.close()
        print(f"  ✓ Saved {out_file}")

    print("\nGenerating graphs...")
    n = 150
    t = np.linspace(0, 10, n)
    
    # Case 1
    np.random.seed(42)
    v_low = 200 + 0.5*np.sin(t) + np.random.normal(0, 0.08, n)
    i_low = 5.0 + 0.1*np.cos(t) + np.random.normal(0, 0.02, n)
    v_low[60:72] = np.random.normal(158, 1.5, 12)
    df_case1 = pd.DataFrame({'voltage': v_low, 'current': i_low, 'power': v_low * i_low})
    plot_rf_case('Case 1 - Low Voltage Grid', df_case1)

    # Case 2
    np.random.seed(43)
    v_norm = 230 + 0.3*np.sin(t) + np.random.normal(0, 0.08, n)
    i_norm = 3.0 + 0.1*np.cos(t) + np.random.normal(0, 0.02, n)
    i_norm[80:120] += 9.0
    df_case2 = pd.DataFrame({'voltage': v_norm, 'current': i_norm, 'power': v_norm * i_norm})
    plot_rf_case('Case 2 - Normal Grid Supply', df_case2)

    # Case 3
    np.random.seed(44)
    v_bal = 230 + 0.2*np.sin(t) + np.random.normal(0, 0.05, n)
    i_bal = np.random.normal(0, 0.03, n)
    i_bal[55:58]   = np.random.normal(11.0, 0.3, 3)
    i_bal[115:118] = np.random.normal(-9.0, 0.3, 3)
    df_case3 = pd.DataFrame({'voltage': v_bal, 'current': i_bal, 'power': v_bal * i_bal})
    plot_rf_case('Case 3 - Demand = Supply', df_case3)

    # Case 4
    np.random.seed(45)
    x = np.linspace(-1, 1, n)
    house_demand = 5 + 3*(x**2) + np.random.normal(0, 0.05, n)
    pv_gen = 14 * np.exp(-(x*2.5)**2)
    pv_gen[60:70]  *= 0.05
    pv_gen[115:125] *= 0.10
    i_pve = house_demand - pv_gen
    v_pve = 230 - (0.5 * i_pve) + np.random.normal(0, 0.08, n)
    df_case4 = pd.DataFrame({'voltage': v_pve, 'current': i_pve, 'power': v_pve * i_pve})
    plot_rf_case('Case 4 - PVe + Normal Grid', df_case4)

if __name__ == "__main__":
    generate_graphs()
