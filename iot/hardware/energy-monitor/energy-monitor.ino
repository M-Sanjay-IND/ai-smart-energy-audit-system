#include <Arduino.h>
#include <WiFi.h>
#include <WiFiManager.h>
#include <HTTPClient.h>

#define VOLTAGE_PIN 34
#define CURRENT_PIN 35

// Raspberry Pi backend endpoint
String serverURL = "http://192.168.1.45:5000/data";

float voltage = 0;
float current = 0;
float power = 0;
float energy = 0;

unsigned long lastTime = 0;

void setup() {

  Serial.begin(115200);

  WiFiManager wm;

  bool res = wm.autoConnect("EnergyAuditSetup");

  if(!res) {
    Serial.println("WiFi connection failed");
    ESP.restart();
  }

  Serial.println("Connected to WiFi");
}

void loop() {

  int voltageRaw = analogRead(VOLTAGE_PIN);
  int currentRaw = analogRead(CURRENT_PIN);

  // Convert ADC values (approximate scaling)
  voltage = (voltageRaw * 3.3 / 4095.0) * 100;
  current = (currentRaw * 3.3 / 4095.0) * 10;

  // Power calculation
  power = voltage * current;

  // Energy calculation
  unsigned long now = millis();
  float hours = (now - lastTime) / 3600000.0;

  energy += power * hours;

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

  if(WiFi.status() == WL_CONNECTED) {

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

  delay(5000);
}