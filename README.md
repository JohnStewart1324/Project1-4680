# StockAI - Real-Time Stock Analysis Application

A comprehensive desktop application for real-time stock market analysis with AI-powered insights.

## 🚀 Quick Start

### First Time Setup
```bash
npm install
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

- **Real-Time Stock Data** - Live data from Yahoo Finance (545+ stocks)
- **Interactive Charts** - Multiple time ranges (1D to Max) with zoom controls
- **AI Analysis** - Powered by Google's Gemini API
- **AI Chatbot** - "Stockie" with conversation memory
- **Cryptocurrency Support** - BTC, ETH, and 18+ more cryptocurrencies
- **Fund History Graphs** - S&P 500, NASDAQ, Dow Jones

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
