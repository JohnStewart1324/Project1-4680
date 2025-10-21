# Practice Trading Simulator

A comprehensive desktop application for practicing stock trading with real-time market data and AI-powered insights. Learn to trade with $10,000 virtual money without any financial risk!

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
```bash
# Option 1: Use the startup script
START_APP.bat

# Option 2: Manual start
npm run server    # Terminal 1
npm run electron  # Terminal 2
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

## 📁 Project Structure

```
├── app/              # Electron main process
├── renderer/         # React frontend
│   ├── components/   # UI components
│   ├── pages/        # Page components
│   └── utils/        # Utilities
├── server/           # Express API server
└── dist/             # Built files
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
- **Desktop**: Electron
- **APIs**: Yahoo Finance, Google Gemini

## 📝 License

This project uses Yahoo Finance API (free tier) and Google Gemini API.

---

**Version**: 1.0.0  
**Last Updated**: October 2025
