# SignBridge

A computer vision and machine learning system that recognizes sign language gestures and converts them into text.

## Overview

SignBridge takes an image containing a sign language gesture, processes it using computer vision techniques, and uses a trained machine learning model to identify the corresponding sign.

Recognized signs can be combined into sentences and displayed through the application interface.

## Features

* Sign language gesture recognition
* Image upload
* ML-based sign classification
* Prediction confidence
* Sign-to-text conversion
* Sentence construction
* Minimal and accessible interface
* Future text-to-speech support

## Technology Stack

* React
* Vite
* Tailwind CSS
* Python
* OpenCV
* Machine Learning / Deep Learning

## Workflow

```text
Input Image
     ↓
Image Preprocessing
     ↓
Hand / Gesture Detection
     ↓
Feature Extraction
     ↓
ML Classification
     ↓
Recognized Sign
     ↓
Text Output
```

## Project Structure

```text
SignBridge/
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   └── ...
│
├── model/
│   └── ...
│
└── README.md
```

## Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

## Project Status

The frontend is currently under development. The machine learning model and backend API will be integrated as development progresses.

## Goal

SignBridge aims to provide a simple computer vision-based communication system that converts sign language into readable text, helping bridge communication between sign language users and people who do not understand sign language.
