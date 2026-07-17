#include <HTTPClient.h>
#include <WiFi.h>

// -------- WIFI (USE HOTSPOT) --------
const char *ssid = "Galaxy"; // change if needed
const char *password = "sanjay12";

// -------- PINS --------
#define VOLTAGE_PIN 35
#define CURRENT_PIN 34

// -------- VARIABLES --------
float voltage = 0;
float current = 0;
float power = 0;
float energy = 0;

unsigned long lastTime = 0;
unsigned long previousMillis = 0;
const long interval = 3000;

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("=== ENERGY MONITOR START ===");

  // -------- WIFI CONNECT --------
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");

  int attempts = 0;

  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nConnected!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi Failed! (still working offline)");
  }

  lastTime = millis();
}

void loop() {
  unsigned long currentMillis = millis();

  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;

    // -------- SENSOR SAMPLING --------
    long vSum = 0, iSum = 0;
    int samples = 0;

    unsigned long start = millis();

    while (millis() - start < 100) {
      vSum += analogRead(VOLTAGE_PIN);
      iSum += analogRead(CURRENT_PIN);
      samples++;
    }

    float vAvg = vSum / samples;
    float iAvg = iSum / samples;

    // -------- CALCULATION --------
    voltage =
        vAvg * 0.1243; // Corrected to scale 185V readings closer to ~230V mains
    current = iAvg *
              0.035; // Increased multiplier for current to avoid resolving to 0

    if (current < 0.05)
      current = 0;

    power = voltage * current;

    float hours = (millis() - lastTime) / 3600000.0;
    energy += (power / 1000.0) * hours;
    lastTime = millis();

    // -------- OUTPUT --------
    Serial.println("\n----- DATA -----");

    Serial.print("Voltage: ");
    Serial.println(voltage);

    Serial.print("Current: ");
    Serial.println(current);

    Serial.print("Power: ");
    Serial.println(power);

    Serial.print("Energy (kWh): ");
    Serial.println(energy);

    // -------- WIFI STATUS --------
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("WiFi OK - Sending JSON to Raspberry Pi");

      HTTPClient http;
      http.begin(""); // Raspberry Pi backend URL
      http.addHeader("Content-Type", "application/json");

      String jsonPayload = "{\"voltage\":" + String(voltage, 2) +
                           ",\"current\":" + String(current, 3) +
                           ",\"power\":" + String(power, 2) +
                           ",\"energy\":" + String(energy, 4) + "}";

      int httpResponseCode = http.POST(jsonPayload);

      if (httpResponseCode > 0) {
        String response = http.getString();
        Serial.print("HTTP Response code: ");
        Serial.println(httpResponseCode);
      } else {
        Serial.print("Error code: ");
        Serial.println(httpResponseCode);
      }

      http.end();
    } else {
      Serial.println("Running Offline");
    }
  }
}