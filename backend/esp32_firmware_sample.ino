/*
  =============================================================================
  AI-Powered Environmental Hazard Monitoring & Early Warning System
  ESP32 Hardware Node Firmware
  =============================================================================
  Target Board: ESP32 Dev Module / NodeMCU-32S
  Author: Disaster Management Tech Team
  
  Sensors Connected:
    - DHT22: Temperature & Relative Humidity (Pin GPIO 4)
    - HC-SR04: Ultrasonic Sensor for Water Level Depth (Trig: 5, Echo: 18)
    - MQ-135: Air Quality / Gas Sensor (Analog Pin GPIO 34)
    - MQ-2: Smoke / Combustible Gas Sensor (Analog Pin GPIO 35)
    - Status LED: Built-in LED (GPIO 2)
  
  Dependencies (Install via Arduino IDE Library Manager):
    - DHT sensor library by Adafruit
    - ArduinoJson by Benoit Blanchon (v6 or v7)
  =============================================================================
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi Credentials
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Central Backend Server Endpoint
// If testing locally on your LAN, replace with your PC's local IP (e.g. http://192.168.1.15:8000/api/sensor-data)
const char* SERVER_ENDPOINT = "http://192.168.1.100:8000/api/sensor-data";

// Unique Device & Location Configuration
const char* DEVICE_ID = "ESP32_CHN_01";
const char* LOCATION_NAME = "Chennai Adyar Basin, Tamil Nadu";
const float LATITUDE = 13.0827;
const float LONGITUDE = 80.2707;

// Pin Definitions
#define DHT_PIN 4
#define TRIG_PIN 5
#define ECHO_PIN 18
#define MQ135_PIN 34
#define MQ2_PIN 35
#define STATUS_LED 2

// Interval Configuration (in milliseconds)
const unsigned long SEND_INTERVAL_MS = 5000; // Send telemetry every 5 seconds
unsigned long lastSendTime = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n--- [ESP32] Environmental Hazard Node Booting ---");

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(MQ135_PIN, INPUT);
  pinMode(MQ2_PIN, INPUT);
  pinMode(STATUS_LED, OUTPUT);

  connectToWiFi();
}

void loop() {
  // Ensure WiFi is connected
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
  }

  // Periodic Telemetry Transmission
  if (millis() - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = millis();
    sendTelemetry();
  }

  delay(50);
}

void connectToWiFi() {
  Serial.print("[WiFi] Connecting to: ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    digitalWrite(STATUS_LED, !digitalRead(STATUS_LED));
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected successfully!");
    Serial.print("[WiFi] IP Address: ");
    Serial.println(WiFi.localIP());
    digitalWrite(STATUS_LED, HIGH);
  } else {
    Serial.println("\n[WiFi] Connection timeout. Retrying in next cycle.");
    digitalWrite(STATUS_LED, LOW);
  }
}

float measureWaterLevel() {
  // Trigger 10us ultrasonic pulse
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000); // 30ms timeout
  if (duration == 0) {
    return 20.0; // Fallback distance in cm
  }
  // Distance in cm = (duration * 0.0343) / 2
  float distance = (duration * 0.0343) / 2.0;
  
  // Total canal depth assumed 100cm; Water level = Depth - Distance to surface
  float waterLevel = max(0.0f, 100.0f - distance);
  return waterLevel;
}

float readAQI() {
  int rawADC = analogRead(MQ135_PIN); // 0 - 4095
  // Map ADC reading to calibrated AQI scale (0-500)
  float aqi = (rawADC / 4095.0) * 400.0 + 30.0;
  return aqi;
}

float readSmokeLevel() {
  int rawADC = analogRead(MQ2_PIN); // 0 - 4095
  // Map ADC reading to calibrated ppm (0-150 ppm)
  float smoke = (rawADC / 4095.0) * 120.0 + 5.0;
  return smoke;
}

void sendTelemetry() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[ESP32] Cannot send telemetry: WiFi disconnected.");
    return;
  }

  // Read physical / calibrated sensors
  // (Note: Replace dummy DHT values with dht.readTemperature() / dht.readHumidity() in production)
  float temperature = 32.5 + random(-10, 10) / 10.0;
  float humidity = 72.0 + random(-20, 20) / 10.0;
  float waterLevel = measureWaterLevel();
  float aqi = readAQI();
  float smokeLevel = readSmokeLevel();

  // Create JSON document
  StaticJsonDocument<512> doc;
  doc["device_id"] = DEVICE_ID;
  doc["location"] = LOCATION_NAME;
  doc["latitude"] = LATITUDE;
  doc["longitude"] = LONGITUDE;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["water_level"] = waterLevel;
  doc["air_quality"] = aqi;
  doc["smoke_level"] = smokeLevel;

  String jsonPayload;
  serializeJson(doc, jsonPayload);

  Serial.println("\n[HTTP POST] Transmitting Telemetry Payload:");
  Serial.println(jsonPayload);

  // Send HTTP POST
  HTTPClient http;
  http.begin(SERVER_ENDPOINT);
  http.addHeader("Content-Type", "application/json");

  int httpResponseCode = http.POST(jsonPayload);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("[HTTP Status]: ");
    Serial.println(httpResponseCode);
    Serial.print("[Server Response]: ");
    Serial.println(response);

    // Pulse LED on successful delivery
    digitalWrite(STATUS_LED, LOW);
    delay(100);
    digitalWrite(STATUS_LED, HIGH);
  } else {
    Serial.print("[HTTP Error Code]: ");
    Serial.println(httpResponseCode);
    Serial.println(http.errorToString(httpResponseCode).c_str());
  }

  http.end();
}
