# Stockie - AI-Powered Practice Trading Simulator

A comprehensive web application for practicing stock trading with real-time market data and AI-powered insights. Learn to trade with $10,000 virtual money without any financial risk! Accessible from any device with a web browser.

## 🚀 Quick Start

### First Time Setup

1. **Install dependencies**
```bash
npm install
```

2. **Set up API Key** (Required for AI features)
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your Gemini API key
# Get a free key at: https://makersuite.google.com/app/apikey
```

3. **Build the application**
```bash
npm run build
```

### Run the Application

#### Desktop Version
```bash
# Use the startup script (Recommended)
START_APP.bat

# Manual start
npm run dev:desktop  # Development (frontend + backend + electron)
npm run build        # Build for production
npm run electron     # Run desktop app
```

#### Web Version
```bash
# Use the web startup script
START_WEB.bat

# Manual start
npm run dev:web      # Development (frontend + backend)
npm run build:web    # Build for production
npm run preview      # Preview built app
```

## ✨ Features

### 💰 Practice Trading
- **$10,000 Virtual Account** - Start with practice money, add more anytime
- **Real Market Data** - Trade with live prices from Yahoo Finance (545+ stocks)
- **Buy Stocks** - Invest by dollar amount or number of shares
- **Portfolio Tracking** - See real-time gains/losses on all holdings
- **Persistent Data** - Your account and investments saved between sessions
- **My Investments Tab** - Dedicated view of all your holdings and performance

### 📊 Market Analysis
- **Real-Time Stock Data** - Live data from Yahoo Finance (545+ stocks)
- **Interactive Charts** - Multiple time ranges (1D to Max) with zoom controls
- **AI Analysis** - Powered by Google's Gemini API
- **AI Chatbot** - "Stockie" with conversation memory
- **Cryptocurrency Support** - BTC, ETH, and 18+ more cryptocurrencies
- **Fund History Graphs** - S&P 500, NASDAQ, Dow Jones ETF tracking

## 🌐 Web Deployment

For web deployment options, see **[WEB_DEPLOYMENT.md](WEB_DEPLOYMENT.md)**.

## 📁 Project Structure

```
├── renderer/         # React frontend (web app)
│   ├── components/   # UI components
│   ├── pages/        # Page components
│   └── utils/        # Utilities
├── server/           # Express API server
├── dist/             # Built web files
├── app/              # Electron main process (legacy)
├── START_APP.bat     # Desktop app launcher
├── START_WEB.bat      # Web app launcher
└── vercel.json       # Vercel deployment config
```

## 📚 Full Documentation

See **[PROJECT_INFO.md](PROJECT_INFO.md)** for complete documentation including:
- Detailed feature list
- Technical architecture
- API configuration
- Development guide
- Troubleshooting

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Recharts
- **Backend**: Node.js, Express, TypeScript
- **Deployment**: Vercel, Netlify, GitHub Pages
- **APIs**: Yahoo Finance, Google Gemini
- **Legacy**: Electron (desktop version available)

## 📝 License

This project uses Yahoo Finance API (free tier) and Google Gemini API.

---

**Version**: 1.0.0  
**Last Updated**: October 2025
