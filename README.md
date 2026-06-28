# Readable - Adaptive AI Reading Platform

Readable is an intelligent AI-powered educational platform designed to enhance reading proficiency through assistive technologies, real-time eye-tracking, speech recognition, and personalized learning experiences. The platform provides educators with comprehensive classroom management tools while enabling students to develop reading fluency, comprehension, and pronunciation through interactive, data-driven learning modules.

---

# Table of Contents

* Overview
* Objectives
* Features
* System Architecture
* Technology Stack
* Project Structure
* Installation
* Running the Application
* Browser Requirements
* Platform Workflow
* Future Enhancements
* License
* Author

---

# Overview

Readable is a web-based adaptive learning platform that combines artificial intelligence, computer vision, optical character recognition (OCR), and speech processing to create an interactive reading environment. The platform continuously analyzes student engagement, reading behavior, and pronunciation accuracy to deliver personalized educational experiences.

Teachers can upload learning materials, generate assignments, monitor classroom performance, and evaluate student progress through an integrated analytics dashboard. Students benefit from real-time reading assistance, gaze tracking, speech evaluation, and accessibility features that improve reading comprehension and fluency.

---

# Objectives

The platform is designed to:

* Improve reading fluency through AI-assisted learning.
* Track student attention using eye-tracking technology.
* Evaluate pronunciation using speech recognition.
* Provide personalized reading experiences.
* Assist educators with classroom analytics.
* Generate accessible educational content from uploaded documents.
* Monitor student engagement through real-time performance metrics.

---

# Features

## AI-Assisted Reading Environment

The platform delivers personalized reading sessions using intelligent assistance technologies.

Key capabilities include:

* AI-powered reading assistance
* Personalized learning workflows
* Dynamic lesson adaptation
* Interactive reading environment

---

## Optical Character Recognition (OCR)

Teachers can upload educational documents for automatic text extraction.

Supported materials include:

* PDF documents
* Story books
* Worksheets
* Reading exercises
* Classroom notes

Extracted content is automatically converted into editable learning material.

---

## Eye-Tracking Analysis

The integrated computer vision engine monitors student reading behavior in real time.

Tracked metrics include:

* Reading progression
* Line tracking
* Reading regressions
* Focus consistency
* Attention distribution
* Reading completion

---

## Speech Recognition Assessment

Students read aloud while the platform evaluates pronunciation quality.

Speech analysis includes:

* Pronunciation accuracy
* Word recognition
* Reading fluency
* Speech confidence
* Reading pace

---

## Teacher Management Console

Teachers can manage educational content and classroom activities through a centralized administration portal.

Available functions include:

* Student management
* Assignment creation
* OCR document processing
* Reading material distribution
* Classroom monitoring
* Performance analytics

---

## Student Dashboard

Each student receives a personalized dashboard displaying learning progress.

Dashboard metrics include:

* Reading accuracy
* Words per minute (WPM)
* Lesson completion
* Daily learning streak
* Focus score
* Reading history

---

## Accessibility Features

Readable includes several assistive learning tools to improve accessibility.

Features include:

* Adjustable reading speed
* Audio-assisted reading
* Phonics highlighting
* Story visualization
* Reading focus mode
* Background audio support

---

## Learning Analytics

The platform continuously records performance metrics for both teachers and students.

Analytics include:

* Reading speed
* Accuracy score
* Attention consistency
* Session duration
* Pronunciation score
* Engagement trends

---

# System Architecture

```
                    React Frontend
                           │
                           │
                  AI Learning Modules
                           │
      ┌────────────────────┼────────────────────┐
      │                    │                    │
 OCR Processing      Eye Tracking API   Speech Recognition
      │                    │                    │
      └────────────────────┼────────────────────┘
                           │
                  Learning Analytics Engine
                           │
                     Student Dashboard
```

---

# Technology Stack

| Layer             | Technology                                   |
| ----------------- | -------------------------------------------- |
| Frontend          | React.js                                     |
| Styling           | Tailwind CSS                                 |
| Build Tool        | Vite                                         |
| OCR Engine        | Optical Character Recognition                |
| Computer Vision   | Webcam Eye-Tracking API                      |
| Speech Processing | HTML5 Speech Recognition API                 |
| Analytics         | Real-Time Learning Metrics                   |
| Storage           | Browser Local Storage / Database Integration |

---

# Project Structure

```
Readable/
│
├── public/
│
├── src/
│   ├── assets/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── services/
│   ├── utils/
│   └── App.jsx
│
├── package.json
├── vite.config.js
└── README.md
```

---

# Installation

## Prerequisites

Ensure the following software is installed before running the project.

* Node.js 18 or later
* npm
* Modern web browser
* Webcam
* Microphone

---

## Clone the Repository

```bash
git clone https://github.com/your-username/readable.git

cd readable
```

---

# Install Dependencies

```bash
npm install
```

---

# Running the Application

Start the development server.

```bash
npm run dev
```

The application will be available at:

```
http://localhost:5173
```

---

# Browser Requirements

The application requires permission to access:

* Camera
* Microphone
* Local Storage

For optimal performance, use the latest version of:

* Google Chrome
* Microsoft Edge
* Mozilla Firefox

---

# Platform Workflow

```
Teacher Uploads Document
            │
            ▼
OCR Text Extraction
            │
            ▼
Assignment Generation
            │
            ▼
Student Reading Session
            │
            ▼
Eye Tracking Analysis
            │
            ▼
Speech Evaluation
            │
            ▼
Performance Analytics
            │
            ▼
Progress Dashboard
```

---

# Future Enhancements

Planned improvements include:

* AI-generated reading recommendations
* Multilingual content support
* Dyslexia detection assistance
* Cloud synchronization
* Mobile application
* Learning Management System integration
* Adaptive difficulty adjustment
* Gamification modules
* Predictive learning analytics
* Teacher collaboration tools

---

# License

This project is intended for educational, academic, and research purposes.

Permission is granted to use, modify, and extend this software for non-commercial educational use.

---

# Author

**Balakrishnan R**

Bachelor of Engineering
Computer Science and Engineering

Sri Venkateswara College of Engineering

GitHub: https://github.com/BalaKrishnan1708
