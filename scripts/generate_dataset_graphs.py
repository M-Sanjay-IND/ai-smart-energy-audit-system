"""
generate_dataset_graphs.py
==========================
Generates individual PNG graphs for each signal/view of the datasets
used by the DOCX report generator.

Usage:
    python generate_dataset_graphs.py
"""

import os
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

# ── Data generation (same as report: seed=99, n=6000) ──

def generate_report_data(n=6000, seed=99):
    rng = np.random.default_rng(seed)
    v, i, vv, iv = 230.0, 5.0, 0.0, 0.0
    voltage, current = np.zeros(n), np.zeros(n)
    for t in range(n):
        vv = 0.8*vv + rng.normal(0,0.05)
        iv = 0.8*iv + rng.normal(0,0.02)
        if v>240: vv-=0.5
        if v<220: vv+=0.5
        if i>15: iv-=0.2
        if i<1: iv+=0.2
        v+=vv; i+=iv
        voltage[t]=v; current[t]=i
    current[200:350]+=0.26; current[800:1000]+=0.35
    current[2500:2600]+=1.2; current[4000:4050]+=8.5
    power = voltage*current
    energy = np.cumsum(power/1000)*(1/3600)
    is_anomaly = np.zeros(n, dtype=int)
    sag=np.arange(1500,1508); voltage[sag]=rng.normal(160,2,len(sag)); is_anomaly[sag]=1
    surge=np.arange(3200,3208); current[surge]=rng.normal(48,1.5,len(surge)); is_anomaly[surge]=1
    drop=np.arange(4500,4508); voltage[drop]=0; current[drop]=0; is_anomaly[drop]=1
    osc=np.arange(5500,5520); voltage[osc]+=rng.normal(0,30,len(osc)); current[osc]+=rng.normal(0,12,len(osc)); is_anomaly[osc]=1
    power = voltage*current
    return pd.DataFrame({"voltage":voltage,"current":current,"power":power,"energy":energy,"is_anomaly":is_anomaly})

def _compute_deltas(df):
    out=df.copy()
    out["delta_v"]=out["voltage"].diff().fillna(0)
    out["delta_i"]=out["current"].diff().fillna(0)
    out["delta_p"]=out["power"].diff().fillna(0)
    out["hist_mean_p_10"]=out["power"].rolling(10,min_periods=1).mean()
    out["hist_mean_p_50"]=out["power"].rolling(50,min_periods=1).mean()
    return out

# ── Style ──
C = {"train":"#3498db","test":"#e74c3c","normal":"#2ecc71","anomaly":"#e74c3c","text":"#2c3e50","bg":"#fafbfc"}
plt.rcParams.update({
    "figure.facecolor":C["bg"],"axes.facecolor":"#ffffff",
    "axes.edgecolor":"#bdc3c7","axes.labelcolor":C["text"],
    "xtick.color":C["text"],"ytick.color":C["text"],
    "text.color":C["text"],"font.family":"sans-serif",
    "font.size":11,"axes.grid":True,"grid.alpha":0.3,
})

def _save(fig, path):
    fig.savefig(path, dpi=180, bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close(fig)
    print(f"    ✓ {os.path.basename(path)}")


def generate_all(df, out_dir):
    idx = np.arange(len(df))
    dfd = _compute_deltas(df)
    am = df["is_anomaly"].values == 1

    # ═══════════════════════════════════════
    # FULL DATASET — Raw signals (no anomaly)
    # ═══════════════════════════════════════
    print("\n  Full dataset signals:")

    # 1) Voltage
    fig, ax = plt.subplots(figsize=(14, 4))
    ax.plot(idx, df["voltage"].values, color="#0984e3", lw=0.6)
    ax.set_xlabel("Sample Index"); ax.set_ylabel("Voltage (V)")
    ax.set_title("Dataset — Voltage Signal (6,000 Samples)", fontsize=14, fontweight="bold")
    _save(fig, os.path.join(out_dir, "dataset_voltage.png"))

    # 2) Current
    fig, ax = plt.subplots(figsize=(14, 4))
    ax.plot(idx, df["current"].values, color="#e17055", lw=0.6)
    ax.set_xlabel("Sample Index"); ax.set_ylabel("Current (A)")
    ax.set_title("Dataset — Current Signal (6,000 Samples)", fontsize=14, fontweight="bold")
    _save(fig, os.path.join(out_dir, "dataset_current.png"))

    # 3) Power
    fig, ax = plt.subplots(figsize=(14, 4))
    ax.plot(idx, df["power"].values, color="#00b894", lw=0.6)
    ax.set_xlabel("Sample Index"); ax.set_ylabel("Power (W)")
    ax.set_title("Dataset — Power Signal (6,000 Samples)", fontsize=14, fontweight="bold")
    _save(fig, os.path.join(out_dir, "dataset_power.png"))

    # ═══════════════════════════════════════
    # RF — Train / Test split
    # ═══════════════════════════════════════
    print("\n  RF train/test split:")

    dfd_rf = _compute_deltas(df)
    dfd_rf['lag1_delta_p'] = dfd_rf['delta_p'].shift(1).fillna(0)
    dfd_rf['lag2_delta_p'] = dfd_rf['delta_p'].shift(2).fillna(0)
    dfd_rf['lag3_delta_p'] = dfd_rf['delta_p'].shift(3).fillna(0)
    dfd_rf["next_p"] = dfd_rf["power"].shift(-1)
    dfd_rf.dropna(inplace=True)
    dfd_rf = dfd_rf[dfd_rf["is_anomaly"]==0]
    dfd_rf = dfd_rf[dfd_rf["delta_p"].abs()<100]

    feat = ["delta_v","delta_i","delta_p","lag1_delta_p","lag2_delta_p","lag3_delta_p","hist_mean_p_10","hist_mean_p_50"]
    X = dfd_rf[feat].values
    y = dfd_rf["next_p"].values
    orig_idx = dfd_rf.index.values

    X_train, X_test, y_train, y_test, idx_train, idx_test = train_test_split(
        X, y, orig_idx, test_size=0.2, shuffle=False)

    # 4) Train/Test by sample index
    fig, ax = plt.subplots(figsize=(14, 5))
    ax.scatter(idx_train, y_train, s=2, alpha=0.25, color=C["train"], label=f"Train ({len(idx_train):,})")
    ax.scatter(idx_test, y_test, s=2, alpha=0.35, color=C["test"], label=f"Test ({len(idx_test):,})")
    ax.set_xlabel("Original Sample Index"); ax.set_ylabel("Target: Next ΔP (W)")
    ax.set_title("RF — Train / Test Split by Sample Index", fontsize=14, fontweight="bold")
    ax.legend(fontsize=10)
    _save(fig, os.path.join(out_dir, "dataset_rf_split_index.png"))

    # 5) Target distribution
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.hist(y_train, bins=80, color=C["train"], alpha=0.65, edgecolor="white", density=True, label="Train")
    ax.hist(y_test, bins=80, color=C["test"], alpha=0.55, edgecolor="white", density=True, label="Test")
    ax.set_xlabel("Next ΔP (W)"); ax.set_ylabel("Density")
    ax.set_title("RF — Target Value Distribution (Train vs Test)", fontsize=14, fontweight="bold")
    ax.legend(fontsize=10)
    _save(fig, os.path.join(out_dir, "dataset_rf_target_dist.png"))

    # 6) Feature space ΔV vs ΔI
    fig, ax = plt.subplots(figsize=(10, 7))
    ax.scatter(X_train[:,0], X_train[:,1], s=6, alpha=0.3, color=C["train"], label="Train")
    ax.scatter(X_test[:,0], X_test[:,1], s=6, alpha=0.45, color=C["test"], label="Test")
    # Clip axes to 99th percentile so the dense cluster is visible
    all_dv = np.concatenate([X_train[:,0], X_test[:,0]])
    all_di = np.concatenate([X_train[:,1], X_test[:,1]])
    ax.set_xlim(np.percentile(all_dv, 0.5), np.percentile(all_dv, 99.5))
    ax.set_ylim(np.percentile(all_di, 0.5), np.percentile(all_di, 99.5))
    ax.set_xlabel("delta_v"); ax.set_ylabel("delta_i")
    ax.set_title("RF — Feature Space ΔV vs ΔI (Train vs Test)", fontsize=14, fontweight="bold")
    ax.legend(fontsize=10)
    _save(fig, os.path.join(out_dir, "dataset_rf_feature_dv_di.png"))

    # 7) Feature space rolling averages
    fig, ax = plt.subplots(figsize=(10, 7))
    ax.scatter(X_train[:,3], X_train[:,4], s=2, alpha=0.15, color=C["train"], label="Train")
    ax.scatter(X_test[:,3], X_test[:,4], s=2, alpha=0.3, color=C["test"], label="Test")
    ax.set_xlabel("hist_mean_p_10"); ax.set_ylabel("hist_mean_p_50")
    ax.set_title("RF — Feature Space Rolling Averages (Train vs Test)", fontsize=14, fontweight="bold")
    ax.legend(fontsize=10)
    _save(fig, os.path.join(out_dir, "dataset_rf_feature_hist.png"))

    # ═══════════════════════════════════════
    # IF — Full dataset with anomaly labels
    # ═══════════════════════════════════════
    print("\n  IF dataset (normal vs anomaly):")

    # 8) Delta Voltage
    fig, ax = plt.subplots(figsize=(14, 5))
    ax.scatter(idx[~am], dfd["delta_v"].values[~am], s=1, alpha=0.2, color=C["normal"], label="Normal")
    ax.scatter(idx[am], dfd["delta_v"].values[am], s=15, alpha=0.9, color=C["anomaly"], label="Anomaly", marker="x")
    ax.set_xlabel("Sample Index"); ax.set_ylabel("ΔV (V)")
    ax.set_title("IF Dataset — Delta Voltage", fontsize=14, fontweight="bold")
    ax.legend(fontsize=10)
    _save(fig, os.path.join(out_dir, "dataset_if_delta_v.png"))

    # 9) Delta Current
    fig, ax = plt.subplots(figsize=(14, 5))
    ax.scatter(idx[~am], dfd["delta_i"].values[~am], s=1, alpha=0.2, color=C["normal"], label="Normal")
    ax.scatter(idx[am], dfd["delta_i"].values[am], s=15, alpha=0.9, color=C["anomaly"], label="Anomaly", marker="x")
    ax.set_xlabel("Sample Index"); ax.set_ylabel("ΔI (A)")
    ax.set_title("IF Dataset — Delta Current", fontsize=14, fontweight="bold")
    ax.legend(fontsize=10)
    _save(fig, os.path.join(out_dir, "dataset_if_delta_i.png"))

    # 10) Delta Power
    fig, ax = plt.subplots(figsize=(14, 5))
    ax.scatter(idx[~am], dfd["delta_p"].values[~am], s=1, alpha=0.2, color=C["normal"], label="Normal")
    ax.scatter(idx[am], dfd["delta_p"].values[am], s=15, alpha=0.9, color=C["anomaly"], label="Anomaly", marker="x")
    ax.set_xlabel("Sample Index"); ax.set_ylabel("ΔP (W)")
    ax.set_title("IF Dataset — Delta Power", fontsize=14, fontweight="bold")
    ax.legend(fontsize=10)
    _save(fig, os.path.join(out_dir, "dataset_if_delta_p.png"))

    # 11) Feature space ΔV vs ΔI
    fig, ax = plt.subplots(figsize=(10, 7))
    ax.scatter(dfd["delta_v"].values[~am], dfd["delta_i"].values[~am], s=6, alpha=0.3, color=C["normal"], label="Normal")
    ax.scatter(dfd["delta_v"].values[am], dfd["delta_i"].values[am], s=40, alpha=0.9, color=C["anomaly"], label="Anomaly", marker="x", linewidths=1.5)
    # Clip to 99th percentile so normal cluster is visible (outliers noted in legend)
    all_dv = dfd["delta_v"].values
    all_di = dfd["delta_i"].values
    ax.set_xlim(np.percentile(all_dv, 0.5), np.percentile(all_dv, 99.5))
    ax.set_ylim(np.percentile(all_di, 0.5), np.percentile(all_di, 99.5))
    ax.set_xlabel("ΔV (V)"); ax.set_ylabel("ΔI (A)")
    ax.set_title("IF Dataset — Feature Space ΔV vs ΔI", fontsize=14, fontweight="bold")
    ax.legend(fontsize=10)
    _save(fig, os.path.join(out_dir, "dataset_if_feature_dv_di.png"))


def main():
    print("="*50)
    print("  Dataset Graph Generator (Individual PNGs)")
    print("="*50)
    out_dir = os.path.dirname(os.path.abspath(__file__))
    print("\nGenerating data (n=6000, seed=99)...")
    df = generate_report_data()
    print(f"  → {len(df)} samples, {int(df['is_anomaly'].sum())} anomalies")
    generate_all(df, out_dir)
    print(f"\n{'='*50}")
    print(f"  ✓ Done! Generated 11 individual PNGs")
    print(f"{'='*50}")

if __name__ == "__main__":
    main()
