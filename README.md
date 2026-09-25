# SochVyapaar — Smart Thinking for Local Business Growth

> An AI business doctor that finds why your shop is losing customers and tells you exactly what to fix, affordably.

## 🎯 What is SochVyapaar?

SochVyapaar is an AI-powered business analytics platform designed for local Indian shop owners (kirana stores, small retailers, etc.). Instead of just telling you "sales are falling," it explains **WHY** they're falling and **WHAT** you can realistically do about it.

### Core Flow
```
Daily Business Data → Analytics → Root Cause Detection → AI Explanation → Affordable Recommendation → Action Tracking → Feedback
```

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- A Google Gemini API key (free tier) — optional, works without it too

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your settings
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

### Environment Variables
Copy `.env.example` to `.env` in the backend directory and configure:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | SQLite connection string (default works) |
| `SECRET_KEY` | JWT secret key (change in production!) |
| `GEMINI_API_KEY` | Google Gemini API key (optional, uses templates as fallback) |

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, Tailwind CSS, Recharts |
| Backend | Python, FastAPI, SQLAlchemy |
| Database | SQLite (MVP) → PostgreSQL (production) |
| AI | Google Gemini API (free tier) |

## 📱 Features

- **Dashboard** — KPI cards, recent data, quick actions
- **Data Entry** — Simple daily business data input
- **Analytics** — Sales, footfall, expense trends with interactive charts
- **AI Insights** — Root cause analysis with affordable recommendations
- **Action Tracking** — Track implementation and compare before/after performance
- **Hindi + English** — Full bilingual support
- **Responsive** — Works on desktop, tablet, and mobile browsers

## 📂 Project Structure

```
sochvyapaar/
├── frontend/          # React + Vite + Tailwind
│   └── src/
│       ├── components/    # Reusable UI components
│       ├── pages/         # Page components
│       ├── layouts/       # Dashboard layout
│       ├── context/       # Auth & Language context
│       ├── services/      # API service layer
│       └── utils/         # Translations, helpers
├── backend/           # FastAPI + SQLAlchemy
│   └── app/
│       ├── api/           # Route handlers
│       ├── models/        # Database models
│       ├── schemas/       # Pydantic schemas
│       ├── services/      # Business logic
│       ├── analytics/     # Analytics & root cause engine
│       └── ai/            # Gemini AI integration
└── README.md
```

## 🔒 Security

- Password hashing with bcrypt
- JWT authentication
- Protected API routes
- User-scoped data access
- No API keys exposed to frontend

## 🌐 Deployment

| Component | Platform |
|-----------|----------|
| Frontend | Vercel |
| Backend | Render / AWS |
| Database | Supabase PostgreSQL |

## 📄 License

MIT
