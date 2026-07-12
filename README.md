# 🎬 Content Automation Pipeline

A powerful, end-to-end automation platform for downloading, processing, and managing video content from social media platforms. This comprehensive solution combines video downloading, editing, audio generation, subtitle creation, watermarking, and social media scheduling into a unified pipeline.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Usage Examples](#usage-examples)
- [Architecture](#architecture)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

**Content Automation Pipeline** is an intelligent automation framework designed for content creators, social media managers, and video production teams. It streamlines the entire workflow from content discovery to multi-platform distribution, eliminating repetitive manual tasks and enabling scalable content management.

Whether you're looking to download Instagram content, create engaging videos with auto-generated voiceovers, add professional subtitles, apply watermarks, or schedule posts across multiple platforms—this platform handles it all with ease.

---

## ✨ Key Features

### 📥 **Content Downloading**
- **Instagram Integration**: Download reels, posts, videos, photos, stories, and highlights
- **YouTube Support**: Download YouTube Shorts and video content with metadata
- **Bulk Operations**: Process entire profiles or channels at once
- **Media Metadata**: Capture captions, descriptions, and metadata
- **High-Quality Assets**: Always fetch the highest resolution available

### 🎨 **Video Editing & Processing**
- **Batch Video Processing**: Process multiple videos simultaneously
- **Customizable Settings**: Control resolution, format, bitrate, and more
- **Intelligent Resizing**: Auto-adjust video dimensions for different platforms
- **Effects & Filters**: Apply visual enhancements to your videos
- **Quality Control**: Monitor and optimize video output quality

### 🎙️ **Audio Generation**
- **Text-to-Speech (TTS)**: Convert scripts to professional audio narration
- **Multiple Voices**: 50+ voice options with different accents and tones
- **Per-Video Customization**: Unique scripts and voice settings for each video
- **Auto-Script Generation**: AI-powered script generation using Google Gemini API
- **Audio Modes**: Replace, overlay, or blend audio with existing content
- **Volume & Speed Control**: Fine-tune audio parameters (rate, volume)

### 📝 **Automatic Subtitles**
- **Multi-Language Support**: Generate subtitles in multiple languages
- **AI-Powered Transcription**: Uses Google Gemini API for accurate speech-to-text
- **Customizable Styling**: 
  - Font size and color selection
  - Outline and shadow effects
  - Alignment and positioning
  - Background opacity
- **SRT & VTT Export**: Industry-standard subtitle formats
- **Timing Precision**: Frame-accurate subtitle synchronization

### 💧 **Watermark Management**
- **Logo Watermarking**: Add custom logos or images to videos
- **Text Watermarks**: Add text-based watermarks (URLs, handles, etc.)
- **Flexible Positioning**: Place watermarks anywhere on the video
  - Corner positions (top-left, top-right, bottom-left, bottom-right)
  - Custom coordinates
- **Opacity Control**: Adjust transparency for subtle or prominent watermarks
- **Batch Processing**: Apply watermarks to multiple videos instantly
- **Size Customization**: Scale watermarks proportionally

### 📅 **Social Media Scheduling**
- **Multi-Platform Support**: Instagram, Facebook, YouTube, TikTok
- **Scheduled Posting**: Plan content distribution weeks in advance
- **Smart Queue Management**: Track and manage scheduled posts
- **Instant Publishing**: Trigger immediate post publishing when needed
- **Credential Management**: Secure storage and handling of API credentials
- **Caption Customization**: Add custom captions and hashtags per post

### 🔄 **Unified Automation Pipeline**
- **End-to-End Workflow**: Single endpoint to orchestrate the entire process
- **Smart Sequencing**: Automatically chains all processing steps
- **Progress Tracking**: Real-time monitoring of pipeline execution
- **Error Handling**: Graceful error recovery and retry mechanisms
- **Batch Processing**: Process multiple content pieces simultaneously

---

## 🛠️ Tech Stack

### **Backend**
- **Framework**: FastAPI (Python 3.10+)
- **API Documentation**: Swagger UI / OpenAPI
- **Background Tasks**: Threading for async job processing
- **Job Management**: In-memory job tracking system
- **CORS**: Pre-configured for web-based frontends

### **Core Libraries**
- **Video Processing**: FFmpeg-python
- **Audio Processing**: pydub, edge-tts
- **Web Scraping**: Selenium, BeautifulSoup
- **AI/ML**: Google Generative AI (Gemini)
- **Data Validation**: Pydantic
- **Scheduling**: APScheduler

### **Frontend** (Optional React + Vite setup)
- **React 18+**
- **Vite** (Build tool & dev server)
- **HMR** (Hot Module Replacement)
- **ESLint** (Code quality)

### **Language Composition**
- Python: 97.7%
- JavaScript: 2.0%
- CSS: 0.2%
- PowerShell: 0.1%
- Others: 0.0%

---

## 📁 Project Structure
