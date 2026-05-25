# 🚗 SafeDrive AI

> **Your Phone Becomes Your Smartest Driving Companion.** > A futuristic, Tesla-inspired AI road safety mobile web application designed specifically for Indian roads 🇮🇳

---

<div align="center">

[![Status](https://img.shields.io/badge/Status-Prototype-00C2FF?style=for-the-badge)](https://github.com/)
[![Platform](https://img.shields.io/badge/Platform-Mobile_Web_App-black?style=for-the-badge&logo=react)](https://github.com/)
[![Design](https://img.shields.io/badge/Design-Glassmorphism-00FF99?style=for-the-badge)](https://github.com/)
[![License](https://img.shields.io/badge/License-MIT-FFC107?style=for-the-badge)](LICENSE)
[![Made for India](https://img.shields.io/badge/Made%20for-Indian%20Roads-FF4C4C?style=for-the-badge)](https://github.com/)

<br />

### 🔗 Quick Links & Media

| 🌐 [Launch Live Web App](https://your-website-link-here.com) | 🛠️ [Explore Current Prototype](https://your-current-prototype-link-here.com) | 📺 [Watch Google Drive Concept Video](https://your-google-drive-video-link-here.com) |
| :---: | :---: | :---: |

</div>

---

## 🌌 Overview

**SafeDrive AI** transforms a standard smartphone into an intelligent, computer-vision-simulated driving assistant. Engineered specifically to tackle the unique challenges of Indian road conditions (focusing initially on the Andhra Pradesh region), the application pairs a premium, dark-mode HUD interface with proactive safety features.

### 🎨 Design Philosophy
* **Tesla-Inspired Aesthetics:** Deep black backgrounds coupled with vibrant neon accent signatures.
* **Intelligent UI States:** Dynamic color routing mapped to real-time safety metrics:
    * 🟢 **Neon Green (`#00FF99`)** — Active safety systems & operational health indicators.
    * 🟡 **Amber (`#FFC107`)** — Moderate risk warnings & passive telemetry alerts.
    * 🔴 **Danger Red (`#FF3B30`)** — Critical alerts, crashes, & immediate panic overrides.
* **Glassmorphism Layouts:** Multi-layered translucent card structures utilizing rich, fluid visual animations powered by Framer Motion.

---

## ✨ Core Features

### 🏠 1. Smart Dashboard
The central command hub of the vehicle displaying live telemetry and defensive driving feedback at a single glance:
* **Live Telemetry:** Active speed tracking (defaulting at 42 km/h) and a dynamic, rolling Safe Driving Score scaled up to 100.
* **System Toggles:** Live visibility states for Camera AI layers, Driver Alert tracking matrices, Crash Detection, and Emergency SOS relays.
* **Instant Override:** A persistent, floating **Red Panic Button** that completely bypasses safety countdown protocols to trigger immediate crisis workflows from any screen layout.

### 🚗 2. AI Drive Mode (HUD)
A futuristic, real-time Heads-Up Display simulation mimicking advanced driver-assistance systems (ADAS) optimized for local road flow:
* **Object Boundary Mapping:** Visual AI bounding box simulation recognizing cars, bikes, pedestrians, and transport trucks.
* **Lane Overlay Matrices:** Live perspective-guided lane tracing overlay with automated drift alerts.
* **Voice Synthesis Engine:** Real-time audial warnings triggered on boundary breaches (e.g., *“Overspeeding”* when exceeding 80 km/h, or *“Vehicle too close ahead”* when approach ranges drop below 10m).

### 😴 3. Driver Monitoring System (DMS)
An inward-facing safety layer simulating real-time biometric face mapping to prevent fatigue-related mishaps:
* **Fatigue Analysis:** Real-time telemetry tracking for eye closure percentage and structural yawning patterns.
* **Distraction Filters:** Continuous tracking for head nodding patterns and active handheld phone usage.
* **Crisis Actions:** Drowsiness identification launches high-intensity flashing red UI components, physical device vibration scripts, and authoritative audio warning prompts (*"You seem drowsy. Please take a break."*).

### 🚨 4. Crash Detection & SOS System
Automated emergency dispatch sequence triggered via impact spikes or internal software testing vectors:
* **Crash Triage:** Displays an instant Impact Force Meter alongside localized real-time GPS pinpoint metadata.
* **10-Second Dead-Man Switch:** Initiates a strict emergency countdown window, allowing manual cancelation in the event of false positives.
* **Automated Dispatch:** Upon expiration, executes simulated background emergency SMS delivery to designated contacts, streams rear-camera footage logs, and displays localized tracking data (*"Accident detected. Suspected vehicle: AP09XX1234"*).

### ⚖️ 5. Legal AI Assistant
A voice-enabled localized conversational agent pre-mapped to regional regulatory statutes to minimize traffic infractions.

#### Andhra Pradesh Traffic Compliance Directory:
| Infraction Type | Base Fine (INR) | Statutory Application Rules |
| :--- | :--- | :--- |
| **Helmet Violation** | ₹1,000 (First) / ₹2,000 (Repeat) | Mandatory compliance for both rider & pillion |
| **Triple Riding** | ₹1,000 | Strict limit of 2 occupants max per two-wheeler |
| **Mobile Distraction** | ₹1,500 | Includes hand-held voice calls and terminal texting |
| **School Zone Speeding** | ₹2,000 | Capped velocity threshold of 25 km/h in marked zones |

### 📸 6. Incident Reporter
Crowdsourced infrastructure auditing designed like a modern digital-government dashboard to report local hazards.
* **Visual Log Uploads:** Processes road hazard media captures directly from the driver's device camera view.
* **Automated Triage System:** Mimics rule-based classification assigning tags for **Potholes**, **Broken Signals**, **Waterlogging**, or **Road Cracks**.
* **Report Compilation:** Auto-generates formal contextual summaries paired with explicit GPS stamps for submission reviews.

### 📊 7. Analytics Dashboard
Long-term driving behavior logs tracking personal safety patterns:
* Displays weekly performance scores along with metrics tracking harsh braking counts and overspeed warnings.
* Accumulates total safe kilometers driven (defaulting at 142 km) mapped onto smooth neon graphs and line charts.

---

## 📱 Application Architecture

The application handles client-side views via a persistent layout shell mapped here using an interactive visual flowchart:

```mermaid
flowchart TD
    %% Base Styles
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
