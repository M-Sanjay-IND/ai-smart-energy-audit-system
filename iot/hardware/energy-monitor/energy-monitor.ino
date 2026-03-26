#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <AutoConnect.h>
#include <HTTPClient.h>

#define VOLTAGE_PIN 34
#define CURRENT_PIN 35

WebServer Server;
AutoConnect Portal(Server);

// Raspberry Pi backend endpoint
String serverURL = "http://10.215.224.209:5000/data";

float voltage = 0;
float current = 0;
float power = 0;
float energy = 0;

unsigned long lastTime = 0;
unsigned long previousMillis = 0;
const long updateInterval = 5000; // 5 seconds

void setup() {
  Serial.begin(115200);

  // Configure AutoConnect AP details and GUI branding
  AutoConnectConfig config;
  config.apid = "EnergyMonitor_Setup";
  config.psk  = ""; // No password for the setup portal
  config.title = "EnergyPulse Setup"; // Shows up natively on the captive portal web UI!
  config.autoReconnect = true;
  Portal.config(config);
  
  // Starts AutoConnect - it will host a captive portal if it can't find a known WiFi
  if (Portal.begin()) {
    Serial.println("Connected to WiFi successfully!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("AutoConnect failed to start or connect.");
    ESP.restart();
  }
}

void loop() {
  // CRITICAL: Must be called continuously to keep the Web GUI perfectly responsive
  Portal.handleClient();

  unsigned long currentMillis = millis();

  // Non-blocking timer instead of delay(5000) so the GUI never freezes
  if (currentMillis - previousMillis >= updateInterval) {
    previousMillis = currentMillis;

    // --- AC WAVEFORM RMS SAMPLING ---
    // We must sample for at least 1 full AC cycle (20ms for 50Hz or 16.6ms for 60Hz)
    // because taking a single analogRead() might randomly hit 0V on the sine wave!
    
    unsigned long sampleStart = millis();
    long vSumSquare = 0;
    long iSumSquare = 0;
    int samples = 0;
    
    // ESP32 ADC rests around 1.65V (half of 3.3V) which is ~2048 out of 4095
    const int adcOffset = 2048; 

    while (millis() - sampleStart < 20) {
      int vRaw = analogRead(VOLTAGE_PIN) - adcOffset;
      int iRaw = analogRead(CURRENT_PIN) - adcOffset;
      
      vSumSquare += vRaw * vRaw;
      iSumSquare += iRaw * iRaw;
      samples++;
    }

    // Calculate Root Mean Square (RMS) of the raw ADC readings
    float vRmsRaw = sqrt((float)vSumSquare / samples);
    float iRmsRaw = sqrt((float)iSumSquare / samples);

    // --- CALIBRATION FACTORS ---
    // The ZMPT101B has a trimpot you might need to turn manually.
    // Adjust these Multipliers based on a real multimeter reading to perfect the output!
    const float V_CALIBRATION = 5.23;  // Adjust until 'voltage' matches your multimeter (e.g. 230V)
    const float I_CALIBRATION = 0.15;  // Adjust until 'current' matches your clamp meter

    // Final True RMS Values
    voltage = vRmsRaw * V_CALIBRATION;
    current = iRmsRaw * I_CALIBRATION;

    // Fix: Tiny noise filter (if current is extremely tiny, snap to 0 so it doesn't wander)
    if (current < 0.05) current = 0;

    // Power calculation (Apparent Power)
    power = voltage * current;

    // Energy calculation
    unsigned long now = millis();
    float hours = (now - lastTime) / 3600000.0;
    
    // Fix: Convert Watts to Kilowatts (/1000) then multiply by hours to get true kWh
    energy += (power / 1000.0) * hours;
    
    lastTime = now;

    Serial.println("------");
    Serial.print("Voltage: ");
    Serial.println(voltage);
    Serial.print("Current: ");
    Serial.println(current);
    Serial.print("Power: ");
    Serial.println(power);
    Serial.print("Energy (kWh): ");
    Serial.println(energy);

    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(serverURL);
      http.addHeader("Content-Type", "application/json");

      String jsonData = "{";
      jsonData += "\"voltage\":" + String(voltage) + ",";
      jsonData += "\"current\":" + String(current) + ",";
      jsonData += "\"power\":" + String(power) + ",";
      jsonData += "\"energy\":" + String(energy);
      jsonData += "}";

      int responseCode = http.POST(jsonData);
      Serial.print("Server Response: ");
      Serial.println(responseCode);

      http.end();
    }
  }
}