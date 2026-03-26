# AI-Based Smart Energy Audit System

An AI-powered IoT platform designed to monitor, analyze, and optimize household energy consumption. The system collects real-time electrical data using sensors connected to an ESP32 microcontroller, processes the data through a Raspberry Pi gateway and Flask backend, stores it in Firebase, and visualizes insights through a dashboard with machine learning analytics.

---

## Project Overview

The goal of this project is to build an intelligent energy monitoring system that helps users understand and optimize their electricity consumption. By combining IoT hardware, backend APIs, a cloud database, and machine learning models, the system provides real-time monitoring, anomaly detection, and energy usage insights.

---

## System Architecture
Sensors (Voltage + Current) ↓ ESP32 Microcontroller ↓ Raspberry Pi Gateway ↓ Flask Backend API ↓ Firebase Database ↓ Frontend Dashboard ↓ Machine Learning Analysis
Copy code

---

## Key Features

- Real-time energy consumption monitoring
- IoT-based data collection using ESP32
- Raspberry Pi gateway for edge data handling
- RESTful backend APIs using Flask
- Cloud database using Firebase
- Interactive dashboard for visualization
- Machine learning for:
  - Energy consumption forecasting
  - Anomaly detection in power usage

---

## Tech Stack

### Hardware
- ESP32 Microcontroller
- SCT-013 Current Sensor
- ZMPT101B Voltage Sensor
- Raspberry Pi (Gateway)

### Backend
- Python
- Flask

### Database
- Firebase

### Frontend
- React / Streamlit

### Machine Learning
- Python
- Scikit-learn
- Pandas
- NumPy

---

## Repository Structure
ai-smart-energy-audit-system │ ├── hardware │   ├── circuit-diagrams │   └── sensor-calibration │ ├── firmware │   ├── esp32-code │   └── raspberry-pi-gateway │ ├── backend │   ├── flask-api │   └── data-processing │ ├── frontend │   ├── dashboard │   └── ui-assets │ ├── ml-models │   ├── forecasting │   └── anomaly-detection │ ├── database │   └── firebase-config │ ├── docs │   ├── architecture │   ├── setup-guide │   └── presentation │ ├── scripts ├── requirements.txt └── README.md
Copy code

---

## Team Members

| Member | Role |
|------|------|
| Sarvagya | Hardware & Firmware Development |
| Sanjay | Machine Learning, DevOps, UI Design |
| Jaswanth | Backend Development (Flask APIs) |
| Asmit | Frontend Development & Firebase Database |

---

## Development Workflow

1. Hardware sensors capture voltage and current data.
2. ESP32 processes and transmits sensor data.
3. Raspberry Pi acts as a gateway to manage incoming data.
4. Flask backend APIs receive and process the data.
5. Data is stored in Firebase.
6. Frontend dashboard displays real-time insights.
7. Machine learning models analyze energy patterns and detect anomalies.

---
