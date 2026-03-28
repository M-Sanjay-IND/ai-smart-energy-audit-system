"""
generate_cases_notebook.py
==========================
Generates a complete Jupyter Notebook (.ipynb) containing the 4 specific case studies:
1. Low Voltage
2. Normal Grid Supply
3. Demand = Supply
4. PVe + Normal Grid

When executed, this script will create 'case_studies_evaluation.ipynb' inside the backend folder.
"""

import json
import os

def create_notebook():
    cells = []

    def mk_md(text):
        cells.append({
            "cell_type": "markdown",
            "metadata": {},
            "source": [t + "\n" for t in text.split("\n")]
        })

    def mk_code(text):
        cells.append({
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": [t + "\n" for t in text.split("\n")]
        })

    # Cell 1: Intro
    mk_md("# AI Smart Energy Audit - 4 Case Studies Analysis\n"
          "This notebook evaluates the Isolation Forest (Anomaly Detection) and Random Forest (Power-Delta Prediction) models across four distinct grid scenarios:\n"
          "1. **Low Voltage**\n"
          "2. **Normal Grid Supply**\n"
          "3. **Demand = Supply** (Net Zero)\n"
          "4. **PVe + Normal Grid**")

    # Cell 2: Imports & Loading Models
    mk_code("import numpy as np\n"
            "import pandas as pd\n"
            "import matplotlib.pyplot as plt\n"
            "import joblib\n"
            "import warnings\n"
            "warnings.filterwarnings('ignore')\n\n"
            "plt.style.use('seaborn-v0_8-darkgrid')\n"
            "plt.rcParams['figure.figsize'] = (14, 8)\n\n"
            "try:\n"
            "    rf_model = joblib.load('rf_power_model.pkl')\n"
            "    rf_scaler = joblib.load('rf_power_scaler.pkl')\n"
            "    iso_model = joblib.load('iso_model.pkl')\n"
            "    iso_scaler = joblib.load('iso_scaler.pkl')\n"
            "    print('✅ ML Models loaded successfully.')\n"
            "except Exception as e:\n"
            "    print(f'❌ Error loading models: {e}. Make sure you run if.py and rf.py first!')")

    # Cell 3: Helper visualization function
    mk_code("def evaluate_and_plot(case_name, df):\n"
            "    print(f'\\n========== {case_name} ==========')\n"
            "    dfd = df.copy()\n"
            "    # Feature Engineering exactly as in production (Deltas)\n"
            "    dfd['delta_v'] = dfd['voltage'].diff().fillna(0)\n"
            "    dfd['delta_i'] = dfd['current'].diff().fillna(0)\n"
            "    dfd['delta_p'] = dfd['power'].diff().fillna(0)\n"
            "    features = dfd[['delta_v', 'delta_i', 'delta_p']].values\n"
            "\n"
            "    # 1. Isolation Forest Predict\n"
            "    try:\n"
            "        iso_scaled = iso_scaler.transform(features)\n"
            "        preds = iso_model.predict(iso_scaled) # -1 is anomaly, 1 is normal\n"
            "        anomalies = (preds == -1)\n"
            "    except:\n"
            "        anomalies = np.zeros(len(df), dtype=bool)\n"
            "\n"
            "    dfd['is_anomaly'] = anomalies\n"
            "    print(f'Isolation Forest Output: Detected {anomalies.sum()} anomalies out of {len(df)} samples.')\n"
            "\n"
            "    # Plotting\n"
            "    fig, ax = plt.subplots(3, 1, sharex=True, figsize=(12, 10))\n"
            "    fig.suptitle(f'{case_name} - Telemetry & Anomalies', fontsize=16)\n"
            "\n"
            "    # Voltage\n"
            "    ax[0].scatter(dfd.index, dfd['voltage'], color='#3498db', s=10, label='Voltage (V)')\n"
            "    ax[0].set_ylabel('Voltage (V)')\n"
            "    ax[0].legend(loc='upper right')\n"
            "\n"
            "    # Current\n"
            "    ax[1].scatter(dfd.index, dfd['current'], color='#e67e22', s=10, label='Current (A)')\n"
            "    ax[1].set_ylabel('Current (A)')\n"
            "    ax[1].legend(loc='upper right')\n"
            "\n"
            "    # Power & Scatter anomalies\n"
            "    ax[2].scatter(dfd.index, dfd['power'], color='#2ecc71', s=10, label='Real Power (W)')\n"
            "    anomaly_points = dfd[dfd['is_anomaly']]\n"
            "    if not anomaly_points.empty:\n"
            "        # Highlight anomalies\n"
            "        ax[2].scatter(anomaly_points.index, anomaly_points['power'], \n"
            "                      color='red', s=80, edgecolors='black', zorder=5, label='Detected Anomaly')\n"
            "    ax[2].set_ylabel('Real Power (W)')\n"
            "    ax[2].set_xlabel('Time (samples)')\n"
            "    ax[2].legend(loc='upper right')\n"
            "\n"
            "    plt.tight_layout()\n"
            "    safe_name = case_name.replace(' ', '_').replace(':', '').replace('=', '_')\n"
            "    # Save the figure to disk as a PNG\n"
            "    plt.savefig(f'{safe_name}.png', dpi=150)\n"
            "    plt.show()\n"
            "\n"
            "    return dfd")

    # Cell 4: Case 1
    mk_md("### Case 1: Low Voltage\n"
          "Simulating a grid that is under strain, consistently supplying around 200V with intermittent severe drops. Let's capture how models perceive the rapid shift.")
    mk_code("np.random.seed(42)\n"
            "n = 120\n"
            "t = np.linspace(0, 10, n)\n"
            "v_low = 200 + np.sin(t) + np.random.normal(0, 0.5, n)\n"
            "# Severe instantaneous voltage dip (sag) mid-run\n"
            "v_low[40:48] = np.random.normal(160, 4, 8)\n"
            "\n"
            "i_low = 5 + 0.5 * np.cos(t) + np.random.normal(0, 0.3, n)\n"
            "p_low = v_low * i_low\n"
            "\n"
            "df_case1 = pd.DataFrame({'voltage': v_low, 'current': i_low, 'power': p_low})\n"
            "res1 = evaluate_and_plot('Case 1: Low Voltage Grid', df_case1)")

    # Cell 5: Case 2
    mk_md("### Case 2: Normal Grid Supply\n"
          "Standard household 230V mains with typical residential load cycles. A heavy load (e.g., compressor / air conditioner) suddenly engages.")
    mk_code("np.random.seed(43)\n"
            "v_norm = 230 + np.sin(t) + np.random.normal(0, 0.5, n)\n"
            "i_norm = 3 + 0.3 * np.cos(t) + np.random.normal(0, 0.2, n)\n"
            "# Air-conditioner compressor kicks in sharply\n"
            "i_norm[60:92] += 8.5\n"
            "\n"
            "p_norm = v_norm * i_norm\n"
            "\n"
            "df_case2 = pd.DataFrame({'voltage': v_norm, 'current': i_norm, 'power': p_norm})\n"
            "res2 = evaluate_and_plot('Case 2: Normal Grid Supply', df_case2)")

    # Cell 6: Case 3
    mk_md("### Case 3: Demand = Supply\n"
          "A steady state (Microgrid/Net Zero environment) where local generation (battery/solar) perfectly balances household demand. Meaning the net current off the main external supply effectively floats at zero Watts, barring very minor mismatches.")
    mk_code("np.random.seed(44)\n"
            "v_bal = 230 + np.sin(t) + np.random.normal(0, 0.5, n)\n"
            "# Flawless load balancing - Net current is roughly zero\n"
            "i_bal = np.random.normal(0, 0.1, n)\n"
            "# Very brief sudden mismatch spikes (Anomaly clearly visible!)\n"
            "i_bal[40:42] = np.random.normal(10.5, 0.5, 2)\n"
            "i_bal[100:102] = np.random.normal(-8.0, 0.5, 2)\n"
            "\n"
            "p_bal = v_bal * i_bal\n"
            "\n"
            "df_case3 = pd.DataFrame({'voltage': v_bal, 'current': i_bal, 'power': p_bal})\n"
            "res3 = evaluate_and_plot('Case 3: Demand = Supply', df_case3)")

    # Cell 7: Case 4
    mk_md("### Case 4: PVe + Normal Grid\n"
          "High solar penetration creating a 'Duck Curve'. During mid-day (solar peak), home demand drops while PV pushes massive power back into the grid (negative net load). Local grid voltage naturally rises due to power export. Intense cloud blocks suddenly kill PV capacity abruptly bringing net load massively positive (returning to import).")
    mk_code("np.random.seed(45)\n"
            "n = 120\n"
            "# Realistic residential duck-curve load profile (higher morning & evening)\n"
            "x = np.linspace(-1, 1, n)\n"
            "house_demand = 5 + 3*(x**2) + np.random.normal(0, 0.2, n)\n"
            "\n"
            "# Solar PV generation (bell curve, peaking mid-day)\n"
            "pv_gen = 14 * np.exp(-(x*2.5)**2)\n"
            "\n"
            "# Thick cloud completely knocks off solar output suddenly\n"
            "pv_gen[48:54] *= 0.15 # 85% lost\n"
            "pv_gen[85:92] *= 0.25 # 75% lost\n"
            "\n"
            "# Negative Net means exporting back to external grid\n"
            "i_pve = house_demand - pv_gen\n"
            "\n"
            "# Local grid voltage actively rises when pushing negative amps back to grid\n"
            "v_pve = 230 - (0.5 * i_pve) + np.random.normal(0, 0.5, n)\n"
            "p_pve = v_pve * i_pve\n"
            "\n"
            "df_case4 = pd.DataFrame({'voltage': v_pve, 'current': i_pve, 'power': p_pve})\n"
            "res4 = evaluate_and_plot('Case 4: PVe + Normal Grid', df_case4)")

    # Cell 8: Combined Plot
    mk_md("### Conclusion: All Cases Combined\n"
          "A single visual summary chart comprising all four cases across voltage, current, and real power dimensions.")
    mk_code("fig, axes = plt.subplots(4, 3, figsize=(18, 16))\n"
            "fig.suptitle('Comprehensive Energy Audit - 4 Case Studies Evaluated', fontsize=20, y=1.02)\n\n"
            "datasets = [\n"
            "    ('Case 1: Low Voltage', res1),\n"
            "    ('Case 2: Normal Grid', res2),\n"
            "    ('Case 3: Demand=Supply', res3),\n"
            "    ('Case 4: PVe+Grid', res4)\n"
            "]\n\n"
            "for i, (name, df_case) in enumerate(datasets):\n"
            "    # Voltage\n"
            "    axes[i, 0].scatter(df_case.index, df_case['voltage'], color='#3498db', s=5)\n"
            "    axes[i, 0].set_title(f'{name} - Voltage', fontweight='bold')\n"
            "    axes[i, 0].set_ylabel('Volts')\n\n"
            "    # Current\n"
            "    axes[i, 1].scatter(df_case.index, df_case['current'], color='#e67e22', s=5)\n"
            "    axes[i, 1].set_title(f'{name} - Current', fontweight='bold')\n"
            "    axes[i, 1].set_ylabel('Amps')\n\n"
            "    # Power\n"
            "    axes[i, 2].scatter(df_case.index, df_case['power'], color='#2ecc71', s=5)\n"
            "    anoms = df_case[df_case['is_anomaly']]\n"
            "    if not anoms.empty:\n"
            "        axes[i, 2].scatter(anoms.index, anoms['power'], color='red', s=40, zorder=5)\n"
            "    axes[i, 2].set_title(f'{name} - Power (Anomalies in Red)', fontweight='bold')\n"
            "    axes[i, 2].set_ylabel('Watts')\n\n"
            "plt.tight_layout()\n"
            "plt.savefig('combined_case_studies_summary.png', dpi=200, bbox_inches='tight')\n"
            "plt.show()")

    # Generate JSON structure
    nb_dict = {
        "cells": cells,
        "metadata": {
            "kernelspec": {
                "display_name": "Python 3",
                "language": "python",
                "name": "python3"
            },
            "language_info": {
                "codemirror_mode": {"name": "ipython", "version": 3},
                "file_extension": ".py",
                "mimetype": "text/x-python",
                "name": "python",
                "nbconvert_exporter": "python",
                "pygments_lexer": "ipython3",
                "version": "3.8.0"
            }
        },
        "nbformat": 4,
        "nbformat_minor": 4
    }

    output_path = os.path.join(os.path.dirname(__file__), "case_studies_evaluation.ipynb")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(nb_dict, f, indent=2)
    print(f"✅ Successfully written notebook file: {output_path}")
    print("Run this file using Jupyter Notebook or Jupyter Lab.")

if __name__ == "__main__":
    create_notebook()
