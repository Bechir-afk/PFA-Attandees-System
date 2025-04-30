#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <WiFiClientSecure.h>

// Function prototypes
void connectToWiFi();
void handleRFIDScan();
void checkFirebaseResponse();
String getUserNameFromFirebase(String uid);
bool checkAlreadyClockedIn(String uid);
void recordAttendance(String uid, String userName, bool isClockIn);
void updateLatestScan(String uid, String userName, bool isClockIn);
bool makeFirebaseRequest(HTTPClient &http, String &url, String &response, bool isGet = true, String postData = "");
String getCurrentDate();
String getRFIDUID();
void beep(int count);
void setLED(int red, int green, int blue);
void updateStatusLED();
bool isAdmin(String uid);

// Hardware Pins for ESP32
#define SS_PIN 5
#define RST_PIN 22
#define BUZZER_PIN 21
#define LED_R 4       
#define LED_G 16      
#define LED_B 17      
#define SDA_PIN 25
#define SCL_PIN 26
#define MOSI_PIN 23
#define MISO_PIN 19
#define SCK_PIN 18

// WiFi credentials
const char* ssid = "test";
const char* password = "test12345";

// Firebase Details
const char* FIREBASE_HOST = "fdhf-4403b-default-rtdb.firebaseio.com";
const char* FIREBASE_AUTH = "Owh7MHTxs5FTxQ4KHPF885cFknNZlusGWhgHRB1i";

// Initialize components
MFRC522 rfid(SS_PIN, RST_PIN);
LiquidCrystal_I2C lcd(0x27, 16, 2);

// State variables
enum SystemState { CONNECTING_WIFI, READY_FOR_SCAN, PROCESSING_CARD };
SystemState currentState = CONNECTING_WIFI;
unsigned long stateTime = 0;
String currentUID = "";
bool wifiConnected = false;

void setup() {
  Serial.begin(115200);
  
  // Initialize pins
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_R, OUTPUT);
  pinMode(LED_G, OUTPUT);
  pinMode(LED_B, OUTPUT);
  
  setLED(0, 0, 1); // Blue LED while initializing

  // Initialize LCD
  Wire.begin(SDA_PIN, SCL_PIN);
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.print("Initializing...");
  
  // Initialize RFID reader
  SPI.begin(SCK_PIN, MISO_PIN, MOSI_PIN);
  rfid.PCD_Init();
  
  configTime(0, 0, "pool.ntp.org");
  connectToWiFi();
}

void updateStatusLED() {
  static unsigned long lastBlinkTime = 0;
  static bool ledState = false;
  
  switch (currentState) {
    case CONNECTING_WIFI:
      if (millis() - lastBlinkTime > 300) {
        ledState = !ledState;
        setLED(0, 0, ledState ? 1 : 0);
        lastBlinkTime = millis();
      }
      break;
      
    case READY_FOR_SCAN:
      // Solid green LED when waiting for scan
      setLED(0, 1, 0);
      break;
      
    case PROCESSING_CARD:
      if (millis() - lastBlinkTime > 100) {
        ledState = !ledState;
        setLED(ledState ? 1 : 0, 0, ledState ? 1 : 0);
        lastBlinkTime = millis();
      }
      break;
  }
}

void loop() {
  // Check for WiFi periodically and reconnect if needed ONLY if not in PROCESSING_CARD state
  static unsigned long lastWifiCheck = 0;
  if (millis() - lastWifiCheck > 30000 && currentState != PROCESSING_CARD) { // Check every 30 seconds
    if (WiFi.status() != WL_CONNECTED) {
      connectToWiFi();
    }
    lastWifiCheck = millis();
  }
  
  // Add timeout handling
  if (currentState == PROCESSING_CARD && (millis() - stateTime > 6000)) { // CHANGED FROM 10000 to 6000ms
    lcd.clear();
    lcd.print("Timeout!");
    delay(500); // CHANGED FROM 1000 to 500ms
    lcd.clear();
    lcd.print("Scan your card");
    currentState = READY_FOR_SCAN;
  }
  
  updateStatusLED();
  
  switch (currentState) {
    case CONNECTING_WIFI:
      if (WiFi.status() != WL_CONNECTED) {
        connectToWiFi();
      } else {
        currentState = READY_FOR_SCAN;
        lcd.clear();
        lcd.print("Scan your card");
      }
      break;
      
    case READY_FOR_SCAN:
      handleRFIDScan();
      break;
      
    case PROCESSING_CARD:
      checkFirebaseResponse();
      break;
  }
}

void connectToWiFi() {
  // Don't initialize WiFi if it's already connected
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    return;
  }
  
  // Disconnect first to ensure clean connection
  WiFi.disconnect(true);
  delay(500);
  
  lcd.clear();
  lcd.print("Connecting WiFi");
  
  WiFi.begin(ssid, password);
  
  unsigned long startMillis = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startMillis < 20000) {
    setLED(0, 0, 1);
    delay(250);
    setLED(0, 0, 0);
    delay(250);
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    setLED(0, 1, 0); // Solid green when connected
    lcd.clear();
    lcd.print("WiFi Connected");
    wifiConnected = true;
    delay(1000);
    lcd.clear();
    lcd.print("Scan your card");
    currentState = READY_FOR_SCAN;
  } else {
    setLED(1, 0, 0);
    lcd.clear();
    lcd.print("WiFi Failed!");
    wifiConnected = false;
    delay(3000);
    currentState = CONNECTING_WIFI;
  }
}

void handleRFIDScan() {
  static unsigned long lastScanTime = 0;
  
  if (millis() - lastScanTime < 1500) return; // CHANGED FROM 3000 to 1500ms
  
  // Check if card is present
  if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
    currentUID = getRFIDUID();
    Serial.println("Card read: " + currentUID);
    
    // Feedback
    setLED(0, 1, 1);
    beep(1);
    
    lcd.clear();
    lcd.print("UID:");
    lcd.setCursor(0, 1);
    lcd.print(currentUID);
    
    currentState = PROCESSING_CARD;
    stateTime = millis();
    
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
    
    lastScanTime = millis();
  }
}

void checkFirebaseResponse() {
  lcd.clear();
  lcd.print("Processing...");
  
  // Check WiFi without attempting to reconnect
  if (WiFi.status() != WL_CONNECTED) {
    lcd.clear();
    lcd.print("WiFi Error!");
    delay(2000);
    lcd.clear();
    lcd.print("Scan your card");
    currentState = READY_FOR_SCAN;
    return;
  }
  
  // Get user data
  String userName = getUserNameFromFirebase(currentUID);
  
  // First check if the name is empty or null
  if (userName == "" || userName == "null") {
    lcd.clear();
    lcd.print("Invalid UID");
    lcd.setCursor(0, 1);
    lcd.print("Access Denied");
    setLED(1, 0, 0);
    beep(3);
  } else {
    // User exists in Firebase
    bool isUserAdmin = isAdmin(currentUID);
    bool isClockOut = checkAlreadyClockedIn(currentUID);
    
    if (isClockOut) {
      // User is clocked in, so now clocking out
      lcd.clear();
      lcd.print("Goodbye");
      lcd.setCursor(0, 1);
      if (isUserAdmin) {
        lcd.print("Mr " + userName);
      } else {
        lcd.print(userName);
      }
      setLED(0, 0, 1);
      beep(2);
      recordAttendance(currentUID, userName, false);
    } else {
      // User is clocked out or first time, so clocking in
      lcd.clear();
      lcd.print("Welcome");
      lcd.setCursor(0, 1);
      if (isUserAdmin) {
        lcd.print("Mr " + userName);
      } else {
        lcd.print(userName);
      }
      setLED(0, 1, 0);
      beep(1);
      recordAttendance(currentUID, userName, true);
    }

    // Add debug info
    Serial.print("User: ");
    Serial.print(userName);
    Serial.print(" - Status after operation: ");
    Serial.println(isClockOut ? "Now clocked OUT" : "Now clocked IN");
  }

  delay(500); // CHANGED FROM 1000 to 500ms for faster processing
  lcd.clear();
  lcd.print("Scan your card");
  setLED(0, 1, 0);
  currentState = READY_FOR_SCAN;
}

// Check if user is an admin
bool isAdmin(String uid) {
  if (WiFi.status() != WL_CONNECTED) return false;
  
  HTTPClient http;
  String url = "https://" + String(FIREBASE_HOST) + "/users/" + uid + "/isAdmin.json";
  if (FIREBASE_AUTH && strlen(FIREBASE_AUTH) > 0) {
    url += "?auth=" + String(FIREBASE_AUTH);
  }
  
  String response;
  if (makeFirebaseRequest(http, url, response)) {
    return (response == "true");
  }
  return false;
}

bool makeFirebaseRequest(HTTPClient &http, String &url, String &response, bool isGet, String postData) {
  WiFiClientSecure *client = new WiFiClientSecure;
  if (!client) return false;
  
  client->setInsecure();
  http.begin(*client, url);
  http.setTimeout(3000); // CHANGED FROM 5000 to 3000ms
  http.addHeader("Content-Type", "application/json");
  
  int httpCode = isGet ? http.GET() : http.POST(postData);
  
  bool success = false;
  if (httpCode > 0 && httpCode == HTTP_CODE_OK) {
    response = http.getString();
    success = true;
  }
  
  http.end();
  delete client;
  return success;
}

String getUserNameFromFirebase(String uid) {
  if (WiFi.status() != WL_CONNECTED) return "";
  
  HTTPClient http;
  String url = "https://" + String(FIREBASE_HOST) + "/users/" + uid + "/name.json";
  if (FIREBASE_AUTH && strlen(FIREBASE_AUTH) > 0) {
    url += "?auth=" + String(FIREBASE_AUTH);
  }
  
  String response;
  if (makeFirebaseRequest(http, url, response)) {
    response.replace("\"", "");
    return response;
  }
  return "";
}

bool checkAlreadyClockedIn(String uid) {
  if (WiFi.status() != WL_CONNECTED) return false;
  
  static String lastCheckedUID = "";
  static unsigned long lastCheckTime = 0;
  static bool lastCheckResult = false;
  
  // Cache check results for 5 seconds to avoid repeated Firebase queries
  if (uid == lastCheckedUID && (millis() - lastCheckTime < 5000)) {
    return lastCheckResult;
  }
  
  HTTPClient http;
  String date = getCurrentDate();
  String url = "https://" + String(FIREBASE_HOST) + "/attendance/" + date + "/" + uid + ".json";
  
  String response;
  if (makeFirebaseRequest(http, url, response)) {
    Serial.print("Clock status response: ");
    Serial.println(response);
    
    // Parse the JSON response to check status more accurately
    DynamicJsonDocument doc(1024);
    DeserializationError error = deserializeJson(doc, response);
    
    if (!error && !doc.isNull()) {
      // Check if clockIn exists but clockOut doesn't
      bool hasClockIn = doc.containsKey("clockIn");
      bool hasClockOut = doc.containsKey("clockOut");
      
      Serial.print("Has clockIn: ");
      Serial.print(hasClockIn ? "YES" : "NO");
      Serial.print(", Has clockOut: ");
      Serial.println(hasClockOut ? "YES" : "NO");
      
      // The key logic: if they have both clockIn AND clockOut, 
      // they're considered NOT clocked in (ready to clock in again)
      lastCheckedUID = uid;
      lastCheckTime = millis();
      lastCheckResult = hasClockIn && !hasClockOut;
      
      return lastCheckResult;
    }
  }
  // If no data exists or communication error, consider not clocked in
  return false;
}

void recordAttendance(String uid, String userName, bool isClockIn) {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  String date = getCurrentDate();
  String url = "https://" + String(FIREBASE_HOST) + "/attendance/" + date + "/" + uid + ".json";
  
  String response; // Add this missing declaration
  String timestamp = String(millis());
  String jsonData;
  
  if (isClockIn) {
    // Fix: The clockIn timestamp should be a value, not another date string
    jsonData = "{\"name\":\"" + userName + "\",\"clockIn\":" + timestamp + "}";
    // Use PUT for clocking in (creates new entry)
    makeFirebaseRequest(http, url, response, false, jsonData);
  } else {
    // For clockOut, use PATCH to update existing record
    jsonData = "{\"clockOut\":" + timestamp + "}";
    // Add PATCH method for updating
    http.addHeader("X-HTTP-Method-Override", "PATCH");
    bool success = makeFirebaseRequest(http, url, response, false, jsonData);
    
    // Add debug info to confirm clock-out was recorded
    Serial.print("Clock out success: ");
    Serial.println(success ? "YES" : "NO");
    Serial.print("Response: ");
    Serial.println(response);
  }
  
  updateLatestScan(uid, userName, isClockIn);
}

void updateLatestScan(String uid, String userName, bool isClockIn) {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  String url = "https://" + String(FIREBASE_HOST) + "/latest_scan.json";
  
  String jsonData = "{";
  jsonData += "\"uid\":\"" + uid + "\",";
  jsonData += "\"name\":\"" + userName + "\",";
  jsonData += "\"action\":\"" + String(isClockIn ? "clockIn" : "clockOut") + "\",";
  jsonData += "\"timestamp\":" + String(millis());
  jsonData += "}";
  
  String response;
  makeFirebaseRequest(http, url, response, false, jsonData);
}

String getCurrentDate() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    return "2025-04-19"; // Fallback date
  }
  
  char dateStr[11];
  sprintf(dateStr, "%04d-%02d-%02d", 
          1900 + timeinfo.tm_year, 
          timeinfo.tm_mon + 1, 
          timeinfo.tm_mday);
  return String(dateStr);
}

String getRFIDUID() {
  String uid;
  for (byte i = 0; i < rfid.uid.size; i++) {
    uid += String(rfid.uid.uidByte[i] < 0x10 ? "0" : "");
    uid += String(rfid.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();
  return uid;
}

void beep(int count) {
  for (int i = 0; i < count; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(200);
    digitalWrite(BUZZER_PIN, LOW);
    if (i < count - 1) delay(150);
  }
}

void setLED(int red, int green, int blue) {
  digitalWrite(LED_R, red);
  digitalWrite(LED_G, green);
  digitalWrite(LED_B, blue);
}