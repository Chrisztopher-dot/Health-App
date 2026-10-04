# Daily Health Check-In & Senior Wellness Companion

A thoughtful, AI-powered health monitoring and daily check-in application tailored for seniors and older adults. Built with **React 18**, **TypeScript**, **Vite**, **Tailwind CSS**, and **Google Gemini 1.5 Flash**, backed by an **Express & SQLite** server.

---

## 🌟 Key Features

- **🗣️ Conversational & Standard Check-In:**
  - Natural daily check-ins supporting voice input (Speech-to-Text) and voice responses (Text-to-Speech) with customizable personas.
  - Multi-step check-in wizard tracking mood, energy, sleep quality, pain levels, weight, and daily notes.

- **🩺 Vitals & Medication Management:**
  - Blood pressure & pulse tracker with automated target range categorization (AHA guidelines).
  - Medication adherence schedule and logs.
  - Interactive charts and health trend graphs powered by **Recharts**.

- **🤖 Multimodal AI Food Scanner & Dining Assistant:**
  - Real-time camera snapshots and image upload for meal scanning.
  - Gemini AI analysis of nutritional breakdown, low-sodium suitability, allergens, and senior dietary guidance.

- **🚨 Smart Risk Alerts & Clinical Summaries:**
  - Real-time rule-based and AI-driven detection of health anomalies (gradual blood pressure elevation, missed medication clusters, recurring dizziness/fatigue).
  - Daily summaries formatted with clear clinical disclaimers and actionable motivation.

- **🔍 Retrospective AI Q&A Assistant:**
  - Query health history in plain English (e.g., *"When did my fatigue start?"*, *"How has my blood pressure changed this week?"*).

- **🌤️ Senior Weather & Air Quality Health Advisory:**
  - Hyper-local weather, temperature, humidity, and Air Quality Index (AQI) analysis tailored for senior respiratory and outdoor safety.

- **🏃 Physical Activities, Reminders & Bay Area Events:**
  - Low-impact exercise & activity tracker.
  - Reminders & task manager with voice playback ("Task Voicemail Speaker").
  - Curated Bay Area senior-friendly events, activities, and nature walks.

- **🥗 Healthy & Low-Sodium Recipe Generator:**
  - Heart-healthy meal ideas and customized recipes based on dietary preferences.

- **♿ Accessible & Adaptive Design:**
  - Dynamic Wellbeing Avatar that mirrors real-time health indicators.
  - Customizable text scaling (`normal`, `large`, `extra-large`).
  - Adaptive atmospheric themes with system-aware Dark & Light mode support.

- **🔒 Local-First Privacy & Security:**
  - Local authentication and client-side credential encryption.
  - SQLite backend database with automated snapshots and backup support.
  - Offline heuristic fallbacks when cloud AI is not connected.

---

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts, Canvas Confetti
- **Backend:** Node.js, Express, TSX, SQLite (`better-sqlite3`)
- **AI & Multimodal:** `@google/generative-ai` (Google Gemini 1.5 Flash)
- **Audio & Accessibility:** Web Speech API (SpeechSynthesis & SpeechRecognition)

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- [npm](https://www.npmjs.com/)
- *(Optional)* [Google Gemini API Key](https://aistudio.google.com/) for cloud multimodal AI features.

---

### Installation

1. **Clone the repository / open the directory:**
   ```bash
   cd "Health App"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
   Add your Google Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=3001
   ```
   > **Note:** If no Gemini API key is provided, the application runs gracefully with local heuristic fallbacks.

---

## 💻 Running the Application

### Development Mode (Frontend + Backend Concurrently)

Run both the Express API server and the Vite dev server with one command:
```bash
npm run dev
```

- **Frontend:** `http://localhost:5173` (or the port indicated by Vite)
- **Backend API:** `http://localhost:3001` (or your configured `PORT`)

### Running Separately

- **Backend Server only:**
  ```bash
  npm run server
  ```
- **Frontend only:**
  ```bash
  npm run dev:frontend
  ```

---

## 📦 Building for Production

To create an optimized production build:
```bash
npm run build
```

To preview the built production output locally:
```bash
npm run preview
```

---

## 🧪 Verification & Testing

Run the included verification script to test health analytics, daily summary calculations, smart risk alerts, and retrospective query heuristics:

```bash
npx tsx scripts/verify-health-system.ts
```

---

## 📂 Project Structure

```text
├── index.html                  # HTML entry point
├── package.json                # Project dependencies and npm scripts
├── vite.config.ts              # Vite configuration & API proxy
├── tailwind.config.js          # Tailwind CSS styling & theme configuration
├── server/                     # Express backend & local SQLite services
│   ├── index.ts                # Express REST API routes
│   ├── geminiService.ts        # Gemini AI multimodal & text integration
│   ├── db.ts                   # SQLite database manager & backups
│   ├── weatherService.ts       # Weather & AQI senior health advisory
│   └── data/                   # SQLite database files & backups
├── src/                        # React Frontend application
│   ├── main.tsx                # Application mounting point
│   ├── App.tsx                 # Core application shell & navigation
│   ├── types/                  # TypeScript data interfaces & types
│   ├── components/
│   │   ├── assistant/          # Voice & Text AI companion
│   │   ├── chat/               # Conversational check-in chat interface
│   │   ├── checkin/            # Wizard & daily summary cards
│   │   ├── timeline/           # BP, medication & vitals history
│   │   ├── foodscanner/        # Multimodal food camera & plate analyzer
│   │   ├── alerts/             # Smart health anomaly risk alerts
│   │   ├── activities/         # Exercise & physical activity tracker
│   │   ├── recipes/            # Heart-healthy meal ideas
│   │   ├── reminders/          # Voice task player & reminders
│   │   ├── happenings/         # Senior-friendly Bay Area events
│   │   ├── common/             # Avatars, weather cards, header
│   │   ├── layout/             # Sidebar, top bar, mobile navigation
│   │   ├── settings/           # Profile preferences & text scaling
│   │   └── auth/               # Secure login & registration
│   └── services/               # Analytics, encryption, speech, storage
└── scripts/                    # Automated verification and health test scripts
```

---

## 🛡️ Medical Disclaimer

*This application is an assistive health tracking tool and wellness companion. It is **not** a replacement for professional medical advice, clinical diagnosis, or emergency healthcare services. Always consult a qualified physician or healthcare provider for medical concerns.*
