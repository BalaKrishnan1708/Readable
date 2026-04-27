# 📖 Readable - AI-Powered Reading Intervention Platform

Readable is an innovative, AI-assisted learning platform specifically designed to empower students with dyslexia. By combining real-time eye tracking, multi-modal AI analysis, and evidence-based adaptive learning paths, Readable transforms reading education by turning raw reading data into actionable, medical-grade intelligence.

---

## 🌟 Key Features

### 👁️ Real-Time Eye & Voice Tracking
*   **GazeFlow Integration:** Tracks eye movements across the text in real-time, identifying areas of visual difficulty or re-reading.
*   **Audio Analysis:** Real-time waveform visualization, speech-to-text feedback, pause detection, and pitch variation tracking.
*   **Multi-Modal AI Pipeline:** Fuses eye movement data and vocal cadence to provide robust performance metrics.

### 🧠 Dyslexia-Specific Insights Engine
*   **Diagnostic Testing:** Evaluates reading fluency, phonological difficulty, visual processing, and attention in a comprehensive diagnostic session.
*   **AI ML Profiling:** Analyzes reading behavior to generate medical-grade insights, categorizing difficulties with actionable recommendations.
*   **Personalized Feedback:** Identifies exactly which sounds or word structures cause issues and creates adaptive, tailored practice paths.

### 🎮 Gamification & Engagement
*   **Student Dashboard:** A clean, engaging hub displaying progress, daily streaks, and "Level" progression.
*   **Progress Dashboard:** Visualizes quantifiable learning outcomes—like accuracy trends and WPM progression—over time using interactive charts.
*   **Achievements System:** Badges, streaks (e.g., "7-Day Streak 🔥"), and milestones to motivate consistent practice.

### 👓 Adaptive Reading Environment
*   **Customizable Supports:** Bionic reading, Gaze Ruler (line focus), Phonics highlighting, Audio echo, and custom Pacer tools.
*   **Aesthetic & Accessible UI:** A premium, "soft-blue" interface built with Tailwind CSS and Framer Motion, optimized for large-scale, easy-to-read text layouts without visual clutter.
*   **Story Maps & "Next Word" Guides:** Frontend-driven interactive story concept maps and visual pointers that guide the reader through the text dynamically.

---

## 🛠️ Tech Stack

### Frontend
*   **Framework:** React (Vite)
*   **Styling:** Tailwind CSS
*   **Animations:** Framer Motion
*   **Data Visualization:** Recharts
*   **Routing & State:** React Router, Zustand (via generic stores)

### Backend
*   **Framework:** FastAPI (Python)
*   **Database:** PostgreSQL (assumed, managed via SQLAlchemy)
*   **Migrations:** Alembic
*   **AI/ML:** Python-based feature extraction and multi-modal diagnostic models

---

## 🚀 Getting Started

### 1. Run the Backend
Navigate to the `backend` directory, ensure your environment variables are configured (via `.env`), and run the server (or use Docker):
```bash
cd backend
# Make sure to run DB migrations first
alembic upgrade head
# Start FastAPI server
uvicorn app.main:app --reload
```

### 2. Run the Frontend
Navigate to the `frontend` directory and start the Vite development server:
```bash
cd frontend
npm install
npm run dev
```

### 3. Eye Tracking Server
Ensure your local eye-tracking server (e.g., GazeFlow) is running on the configured port (default `43333`) to enable the gaze-tracking features in the `LessonPage`.

---

## 🏆 Impact & Judging Alignment

Readable is designed to win:
*   **Innovation:** First platform combining adaptive learning paths with multi-modal AI and eye-tracking.
*   **User Experience:** Real-time feedback wrapped in a gorgeous, gamified, and highly accessible interface.
*   **Social Good:** Measurable outcomes providing quantifiable reading progress to students, teachers, and parents.
