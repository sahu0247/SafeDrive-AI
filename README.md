# 🚗 SafeDrive AI

> **Your Phone Becomes Your Smartest Driving Companion.** > A futuristic, Tesla-inspired AI road safety mobile web application engineered explicitly for the unique complexities of Indian road conditions 🇮🇳

---

<div align="center">

[![Status](https://img.shields.io/badge/Status-Prototype-00C2FF?style=for-the-badge)](https://github.com/)
[![Platform](https://img.shields.io/badge/Platform-Mobile_Web_App-black?style=for-the-badge&logo=react)](https://github.com/)
[![Design](https://img.shields.io/badge/Design-Glassmorphism-00FF99?style=for-the-badge)](https://github.com/)
[![License](https://img.shields.io/badge/License-MIT-FFC107?style=for-the-badge)](LICENSE)
[![Made for India](https://img.shields.io/badge/Made%20for-Indian%20Roads-FF4C4C?style=for-the-badge)](https://github.com/)

<br />

### 🔗 Quick Links & System Media

| 🌐 [Launch Live Web App](https://your-website-link-here.com) | 🛠️ [Explore Current Prototype](https://your-current-prototype-link-here.com) | 📺 [Watch Google Drive Concept Video](https://your-google-drive-video-link-here.com) |
| :---: | :---: | :---: |

</div>

---

## 🌌 Overview

**SafeDrive AI** transforms a standard smartphone into an intelligent, computer-vision-simulated driving assistant. Engineered specifically to tackle the unique challenges of Indian road conditions (focusing initially on the Andhra Pradesh region), the application pairs a premium, dark-mode HUD interface with proactive safety, monitoring, and compliance tools.

### 🎨 Design System & Philosophy
* **Tesla-Inspired Aesthetics:** Deep black backgrounds coupled with high-vibrancy neon accent signatures.
* **Intelligent UI States:** Dynamic color routing mapped directly to live system telemetry:
    * 🟢 **Neon Green (`#00FF99`):** Active safety systems & operational health indicators.
    * 🟡 **Amber (`#FFC107`):** Moderate risk warnings & passive alerts.
    * 🔴 **Danger Red (`#FF3B30`):** Critical alerts, impact triggers, and urgent panic overrides.
* **Glassmorphism Layouts:** Multi-layered translucent card structures utilizing rich, fluid visual animations powered by Framer Motion.

---

## 🛠️ Modern Technology Stack

| Layer | Technology | Purpose & Architectural Context |
| :--- | :--- | :--- |
| **Core Frontend** | React 18 & TypeScript | Solid component structure, explicit type safety, and efficient rendering cycles. |
| **Styling & Theme** | Tailwind CSS & PostCSS | Custom dark-mode utility system featuring premium Glassmorphism cards and neon hues. |
| **Build Tooling** | Vite (Rolldown) | Ultra-fast Hot Module Replacement (HMR) and optimized chunk-splitting. |
| **Maps & Geospatial**| Leaflet & React Leaflet | Responsive rendering of dark-themed OpenStreetMap tiles and recorded polylines. |
| **Data Visuals** | Recharts | Interactive canvas-based line and bar charts to display safety trends. |
| **AI Computer Vision**| MediaPipe FaceMesh & tfjs | Low-latency facial landmark scanning (468 pts) running locally in WebGL. |
| **Native API Wrappers**| Geolocation, Wake Lock, Web SMS | Native device access for live speeds, screen-on locks, and emergency SMS. |
| **Concurrency** | Web Workers & IndexedDB | Background route logging, offline caching, and local preference storage. |

---

## ✨ Core Feature Matrix & Implementation Details

### 🎬 1. Launch Splash & Auto-Route Permission Gate
* **Core Functionality:** Handles application startup by displaying an animated glowing logo, loading progress ring, and initializing background services. It screens the driver profile; if onboarding is incomplete, it diverts to setup, else it boots straight to the dashboard.
* **Technical Details:** Utilizes dynamic intervals to track loading progress while querying `localStorage` via a custom `useLocalStorage` hook to check the onboarding profile state. It queries `navigator.permissions` to safely assert camera and location readiness.

### 📝 2. Smart Onboarding & Medical ID Setup
* **Core Functionality:** Drivers configure user metrics, baseline medical details (e.g., Blood Group), and establish a list of up to 3 emergency contacts.
* **Technical Details:** Employs the native **Web Contacts API** (`navigator.contacts.select`) on supported mobile devices to let users import trusted contacts directly from their address book without typing. High-contrast selector states handle immediate visual validation.

### 🏠 3. Smart Home Dashboard
* **Core Functionality:** Central telemetry command hub highlighting active system widgets:
    * **Live Telemetry:** Active speed metrics (default 42 km/h) and a rolling Safe Driving Score (87/100).
    * **System Toggles:** Visual confirmation flags for Camera AI, Driver Alert tracking, Crash Detection, and SOS relays.
    * **Instant Override:** Persistent floating **Red Panic Button** bypassing safety countdown sequences to drop immediately into an active SOS state.
* **Technical Details:** Incorporates a custom `useClock` hook and live geolocation watches. An integrated canvas/CSS `VoiceWave` component utilizes keyframe height shifting to simulate real-time voice assistant response cycles.

### 🏎️ 4. AI Drive Mode (HUD & Object Detection)
* **Core Functionality:** High-contrast Heads-Up Display showing simulated machine vision targeting road hazards:
    * **Object Boundary Mapping:** Renders dynamic bounding boxes over detected cars, bikes, pedestrians, and transport trucks.
    * **Lane Overlay Matrices:** Traces lane-keeping overlay guidelines alongside active lane drift alarms.
    * **Audial Warning System:** Generates precise speech alert overlays when boundaries are breached (e.g., *“Overspeeding”* if velocity > 80 km/h; *“Vehicle too close ahead”* if distance < 10m).
* **Technical Details:** Real-time speed is evaluated by pulling `pos.coords.speed` via the native **Geolocation API**. The app requests a native **Screen Wake Lock** (`navigator.wakeLock.request`) to prevent screen timeout. A dedicated background **Web Worker** (`route-worker.js`) asynchronously writes GPS points directly to **IndexedDB**, ensuring trip tracking persists if the browser tab is backgrounded.

### 📊 5. Post-Drive Summary & Map Visualization
* **Core Functionality:** Provides post-trip evaluations detailing absolute safe kilometers traveled, alert counts, harsh braking instances, and plots historical journey coordinates.
* **Technical Details:** Uses `react-leaflet` wrapped around customized dark map tile sets (CartoDB Dark Matter CSS) to plot the trip polyline retrieved from IndexedDB. Features an automated custom `<FitBounds>` hook to instantly scale the viewport around the route coordinates.

### 👁️ 6. AI Driver Drowsiness & Fatigue Monitoring (DMS)
* **Core Functionality:** Biometric monitoring system analyzing structural facial configurations to stop fatigue-related mishaps:
    * **Fatigue Analysis:** Real-time tracking of eye closure percentage and structural yawning patterns.
    * **Distraction Filters:** Raises immediate alarms on head nodding patterns or handheld mobile phone usage.
    * **Crisis Actions:** Confirmed drowsiness activates high-intensity flashing red UI components, loops continuous physical vibration pulses, and fires audio cues (*"You seem drowsy. Please take a break."*).
* **Technical Details:** Captures device camera inputs through `react-webcam` to seed an instantiated **MediaPipe FaceMesh** model, processing 468 neural mesh points locally. **Eye Aspect Ratio (EAR)** is computed via indices arrays `[362, 385, 387, 263, 373, 380]` and `[33, 160, 158, 133, 153, 144]`. Alerts loop physical hardware feedback using the browser's native **Vibration API** (`navigator.vibrate`). If camera permissions are unavailable, it features an automatic fallback to an in-app simulated demo experience.

### ⚖️ 7. Legal AI Assistant
* **Core Functionality:** A specialized conversational voice/text assistant mapped to the official statutory fine guidelines of the **Andhra Pradesh Traffic Region**.
* **Technical Details:** Combines keyword token arrays with an automated window slider element (`scrollTo({ behavior: 'smooth' })`) to yield instantaneous card responses matching user queries.

#### Regional Traffic Compliance Reference Table:
| Infraction Type | Base Fine (INR) | Statutory Application Rules |
| :--- | :--- | :--- |
| **Helmet Violation** | ₹1,000 (First) / ₹2,000 (Repeat) | Mandatory compliance for both main rider & pillion |
| **Triple Riding** | ₹1,000 | Strict limit of maximum 2 occupants per two-wheeler |
| **Mobile Distraction** | ₹1,500 | Includes hand-held voice calls and interactive messaging |
| **School Zone Speeding** | ₹2,000 | Capped velocity threshold of 25 km/h in marked zones |

### 📸 8. AI Incident & Civic Hazard Reporter
* **Core Functionality:** Crowdsourced civic infrastructure reporting that builds structured logs from field observations. Drivers capture road anomalies like **Potholes**, **Broken Signals**, **Waterlogging**, or **Road Cracks**.
* **Technical Details:** Uses hidden HTML `<input type="file" accept="image/*">` forms triggered via styled buttons to stream native camera captures. Converts file objects to data URLs using a `FileReader` instance to display instant previews before routing formalized reports alongside raw GPS stamps to regional municipal agencies (e.g., NHAI, PWD).

---

## 📱 Application Architecture & Context Flow

The application manages data streams across layout screens using the state architecture mapped below:

```mermaid
flowchart TD
    %% Custom Themed Styles
    classDef default fill:#0A0A0A,stroke:#333,stroke-width:1px,color:#fff;
    classDef primary fill:#00FF99,stroke:#00FF99,stroke-width:2px,color:#000;
    classDef emergency fill:#FF3B30,stroke:#FF3B30,stroke-width:2px,color:#fff;
    classDef utility fill:#00C2FF,stroke:#00C2FF,stroke-width:1px,color:#000;

    A[🎬 Splash Screen] --> B[🏠 Home Dashboard]
    
    B --> C[🏎️ AI Drive Mode HUD]
    B --> D[👁️ Driver Monitoring]
    B --> E[⚖️ Legal AI Assistant]
    B --> F[📸 Incident Reporter]
    B --> H[📊 Analytics & Logs]
    B --> I[⚙️ Settings]
    
    C --> J[📊 Drive Summary]
    C --> G[🚨 Crash Detection & SOS]
    D --> G

    %% Assign Styles
    class B primary;
    class G emergency;
    class E,F,H utility;
