# 🎫 PFA Attendees System — RFID-Based Attendance Tracker

<p align="center">
  <b>An IoT + web attendance management system — an ESP32 with an RFID reader records clock-in/clock-out events to Firebase Realtime Database, and a web dashboard displays live attendance data in real time.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/ESP32-Arduino-blue?logo=espressif" />
  <img src="https://img.shields.io/badge/RFID-MFRC522-red" />
  <img src="https://img.shields.io/badge/Firebase-Realtime_DB-orange?logo=firebase" />
  <img src="https://img.shields.io/badge/Web-HTML%2FCSS%2FJS-yellow" />
</p>

---

## 📖 Overview

**PFA Attendees System** is a complete, two-part attendance tracking solution built as an end-of-year project (PFA). On the **hardware side**, an **ESP32** reads RFID cards using an **MFRC522** reader, looks up the scanned UID in a **Firebase Realtime Database**, and records a clock-in or clock-out event with a timestamp. Feedback is given through an **LCD display**, an **RGB LED**, and a **buzzer**. On the **software side**, a web dashboard served via **Firebase Hosting** displays the current attendance list in real time, shows who just scanned their card, and lets admins manage the system.

The system distinguishes between regular users and admins: admin cards trigger a special `Mr.` prefix greeting. The Firebase Cloud Functions handle server-side logic and the system auto-reconnects to Wi-Fi with a timeout-based state machine.

---

## ✨ Features

### 🛠️ Hardware (ESP32 + RFID)
- 📳 **RFID card scan** — reads any MFRC522-compatible MIFARE card or key fob
- 🔐 **Firebase user lookup** — validates UID against `/users/{uid}` in Firebase Realtime DB
- ⏰ **Smart clock-in/out** — automatically detects if a user is clocking in (first scan of day) or clocking out (already clocked in)
- 👨‍💼 **Admin detection** — reads `isAdmin` flag from Firebase and greets admins with `Mr.` prefix
- 📺 **LCD feedback** — 16x2 I2C LCD shows status messages (Welcome / Goodbye / Invalid UID / WiFi errors)
- 🚦 **RGB LED status** — Blue (connecting), Green (ready/success), Red (error), Purple (processing)
- 🔔 **Buzzer beeps** — 1 beep for clock-in, 2 beeps for clock-out, 3 beeps for invalid card
- ⌛ **10-second timeout** — processing state auto-resets if Firebase doesn’t respond in time
- 🔄 **Auto WiFi reconnect** — checks connection every 30 seconds and reconnects if dropped

### 🖥️ Web Dashboard
- 📅 **Daily attendance list** — shows all clock-in/clock-out records for the current date
- ⚡ **Live updates** — Firebase Realtime Database listener updates the UI instantly when a card is scanned
- 👤 **Latest scan panel** — shows the most recent card scan (name, UID, action, time)
- 🔑 **Firebase Auth login** — access to the admin dashboard is protected
- 📦 **Firebase Hosting** — deployed and served via Firebase

---

## 🏗️ System Architecture

```
┌──────────────────┐         ┌───────────────────────────┐
│  RFID Card Scan  │         │    Firebase Realtime DB     │
│  (MFRC522)       │         │                           │
└───────┬─────────┘         │  /users/{uid}/name        │
               │               │  /users/{uid}/isAdmin      │
┌─────────────┴────┐  HTTPS  │  /attendance/{date}/{uid}  │
│   ESP32 Controller   ├───────│  /latest_scan              │
│                      │         └────────────┬──────────────┘
│  LCD + RGB LED        │                        │
│  Buzzer               │                        │ Live sync
└────────────────────┘                        ▼
                                      ┌─────────────────┐
                                      │  Web Dashboard    │
                                      │  (Firebase Host)  │
                                      │  Attendance table │
                                      └─────────────────┘
```

---

## 🗂️ Repository Structure

```
PFA-Attandees-System/
├── arduino/
│   └── code.ino                  # Full ESP32 Arduino firmware
├── web pages/
│   ├── indexx.html               # Main attendance dashboard (43KB)
│   ├── main.html                 # Entry/landing page
│   ├── styles.css                # Dashboard styles
│   ├── torch.css / torch.js      # Torch/flashlight UI effect
│   └── test.js                   # Firebase connection test
├── Attandees system web/         # Newer version of the web frontend
├── webpagenew/                   # Latest iteration of web pages
├── login to use/                 # Login page assets
├── functions/
│   └── index.js                  # Firebase Cloud Functions
├── firebase.json                 # Firebase Hosting & Functions config
└── .firebaserc                   # Firebase project alias
```

---

## 🛠️ Hardware Setup

### Components

| Component | Part | Quantity |
|---|---|---|
| Microcontroller | ESP32 (DevKit) | 1 |
| RFID Reader | MFRC522 | 1 |
| Display | 16x2 I2C LCD (address 0x27) | 1 |
| LED | Common-cathode RGB LED | 1 |
| Buzzer | Active buzzer | 1 |
| Resistors | 220Ω–330Ω | 3 (for LED) |

### Pin Mapping (default firmware)

| Pin | Function |
|---|---|
| GPIO 5 | RFID SS (SDA) |
| GPIO 22 | RFID RST |
| GPIO 23 | SPI MOSI |
| GPIO 19 | SPI MISO |
| GPIO 18 | SPI SCK |
| GPIO 25 | I2C SDA (LCD) |
| GPIO 26 | I2C SCL (LCD) |
| GPIO 4 | LED Red |
| GPIO 16 | LED Green |
| GPIO 17 | LED Blue |
| GPIO 21 | Buzzer |

---

## 🚀 Getting Started

### Step 1 — Set Up Firebase

1. Create a [Firebase project](https://console.firebase.google.com/).
2. Enable **Realtime Database** and set rules to allow authenticated reads/writes.
3. Enable **Authentication** (Email/Password).
4. Create the initial database structure:
```json
{
  "users": {
    "<RFID_UID>": {
      "name": "Ahmed Ben Ali",
      "isAdmin": false
    }
  }
}
```
5. Note your **Firebase host** (e.g. `your-project-default-rtdb.firebaseio.com`) and **database secret** (legacy auth token).

---

### Step 2 — Flash the ESP32

1. Install **Arduino IDE** and add the ESP32 board package.
2. Install required libraries via Library Manager:
   - `MFRC522` (by miguelbalboa)
   - `LiquidCrystal I2C` (by Frank de Brabander)
   - `ArduinoJson`
3. Open `arduino/code.ino` and update:
   ```cpp
   const char* ssid     = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   const char* FIREBASE_HOST = "your-project-default-rtdb.firebaseio.com";
   const char* FIREBASE_AUTH = "your-database-secret";
   ```
4. Flash to your ESP32.

---

### Step 3 — Register RFID Cards

1. Scan a card — the LCD will display the UID (e.g. `A1B2C3D4`).
2. In Firebase Realtime Database, create:
   ```
   /users/A1B2C3D4/name = "Student Name"
   /users/A1B2C3D4/isAdmin = false
   ```
3. The next time that card is scanned, the system will greet the user by name.

---

### Step 4 — Deploy the Web Dashboard

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Configure Firebase SDK credentials in the HTML files.
4. Deploy: `firebase deploy`
5. Access the dashboard at your Firebase Hosting URL.

---

## 📋 How It Works

```
Card scanned
    ↓
ESP32 reads RFID UID
    ↓
GET /users/{uid}/name  →  Firebase Realtime DB
    ↓
├─ Name not found  →  "Invalid UID" / 3 beeps / Red LED
└─ Name found
       │
       ├─ Already clocked in today?  →  Clock OUT  →  "Goodbye" / 2 beeps / Blue LED
       └─ Not yet clocked in         →  Clock IN   →  "Welcome" / 1 beep  / Green LED
            │
       POST /attendance/{date}/{uid} to Firebase
       POST /latest_scan to Firebase
            │
       Web dashboard updates in real time
```

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Microcontroller | ESP32 (Espressif) |
| RFID | MFRC522 |
| Firmware | Arduino C++ |
| Display | 16x2 I2C LCD |
| Backend / DB | Firebase Realtime Database |
| Auth | Firebase Authentication |
| Cloud Functions | Firebase Cloud Functions (Node.js) |
| Hosting | Firebase Hosting |
| Frontend | Vanilla HTML5 + CSS3 + JavaScript |

---

## 📄 License

This project is open for educational use.

---

<p align="center">Built with ❤️ by <b>Bechir Ben Rabia</b></p>
