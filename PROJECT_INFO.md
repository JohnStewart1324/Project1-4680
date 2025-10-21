# StockAI - Real-Time Stock Analysis Application

## 📍 Location
**Path:** `A:\Github\Project1-4680`

## 🎯 Overview
StockAI is a comprehensive Electron-based desktop application for real-time stock market analysis with AI-powered insights. It features live data from Yahoo Finance, interactive charts, and an integrated AI chatbot (Stockie) powered by Google's Gemini API.

## 🚀 Quick Start

### Installation
```bash
npm install
```

### Running the Application

**Option 1: Start Everything (Recommended)**
```bash
npm run build
npm run server    # In one terminal
npm run electron  # In another terminal
```

**Option 2: Use Batch Files**
- `start_app.bat` - Quick start script
- `install.bat` - Install dependencies

## 📁 Project Structure

```
A:\Github\Project1-4680\
├── app/                    # Electron main process files
├── server/                 # Backend API server (Express + TypeScript)
│   ├── index.ts           # Main server with stock data API
│   └── stock-cache.json   # Cached stock data
├── renderer/              # Frontend React application
│   ├── components/        # React components
│   │   ├── FundGraph.tsx           # NEW: Interactive fund history graphs
│   │   ├── ChartView.tsx           # Stock price charts with time ranges
│   │   ├── SideAIChat.tsx          # AI chatbot (Stockie)
│   │   ├── AIAnalysis.tsx          # AI-powered stock analysis
│   │   ├── StockCard.tsx           # Individual stock cards
│   │   └── CategoryTabs.tsx        # Stock category navigation
│   ├── pages/             # React page components
│   ├── utils/             # Utility functions
│   └── App.tsx            # Main application component
├── dist/                  # Built application files
└── node_modules/          # Dependencies

```

## ✨ Key Features

### 1. **Real-Time Stock Data**
- Live data from Yahoo Finance API
- 545+ stocks across multiple sectors
- Real-time price updates
- Market cap, P/E ratio, dividend yield
- Cryptocurrency support (BTC, ETH, and 18+ more)

### 2. **Interactive Charts**
- **Time Range Selector**: 1D, 5D, 1M, 3M, 6M, 1Y, 2Y, 5Y, Max
- **Intraday Data**: Minute-by-minute data for 1-day view
- **Zoom Controls**: Mouse wheel zoom, zoom in/out buttons
- **Brush Selection**: Drag to select specific date ranges

### 3. **Fund History Graphs** (NEW)
- Full-screen modal graphs for mutual funds (S&P 500, NASDAQ, Dow Jones)
- Real-time historical data with multiple time ranges
- Interactive tooltips and smooth animations
- Tracks ETFs: SPY (S&P 500), QQQ (NASDAQ), DIA (Dow Jones)

### 4. **AI-Powered Analysis**
- **Stockie**: AI chatbot with conversation memory (last 10 messages)
- Real-time stock analysis using Gemini 2.5 Flash
- Context-aware responses about stocks and market trends
- Integrated with live stock data

### 5. **Stock Categories**
- All Stocks
- S&P 500
- NASDAQ
- Dow Jones
- Technology
- Financial
- Healthcare
- Consumer
- Energy
- Cryptocurrency
- And more...

### 6. **Search & Filter**
- Real-time search by ticker, name, or sector
- Client-side filtering for instant results
- Shows match count

## 🔧 Technical Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **Electron** for desktop app

### Backend
- **Node.js** with Express
- **TypeScript**
- **Yahoo Finance API** for stock data
- **Google Gemini API** for AI features

## 🔑 API Keys

### Gemini API Key
The application uses Google's Gemini API for AI features. The API key is stored in the code:
- **Location**: `renderer/components/SideAIChat.tsx`
- **API Key**: `AIzaSyB4NzbWgOHnDHUAEi_phPwkAFgBQTNT0ro`
- **Model**: `gemini-2.5-flash`

## 📊 Data Sources

### Yahoo Finance API
- **Endpoint**: `https://query1.finance.yahoo.com`
- **Quote API**: `/v7/finance/quote` (detailed financial data)
- **Chart API**: `/v8/finance/chart` (historical price data)
- **Rate Limits**: Batched requests (5 stocks per batch, 3-second delay)
- **Cache**: 30-minute cache to reduce API calls

## 🎨 UI Features

### Stock Cards
- Real-time price with color-coded changes
- Sector badges
- Volume indicators
- Click to view detailed analysis

### Detail View
- Full stock information
- AI-powered analysis
- Interactive price charts
- Risk assessment
- Financial metrics

### Dark Mode
- Modern dark theme throughout
- Blue accent colors
- High contrast for readability

## 🐛 Known Issues & Fixes

### Recent Fixes
✅ Y-axis values now show proper dollar formatting
✅ 1-day view shows minute-by-minute data
✅ Time range selector added to stock details
✅ Conversation context in AI chat (remembers last 10 messages)
✅ Search functionality completely reimplemented
✅ Crypto data (BTC, ETH) now loading correctly
✅ Financial data (P/E, Market Cap, Dividend Yield) using real Yahoo Finance data

### Troubleshooting
- If stocks don't load: Restart the server (check `stock-cache.json` age)
- If Electron won't start: Kill all `electron.exe` processes and rebuild
- If server port is busy: Kill all `node.exe` processes

## 📝 Development Scripts

```bash
npm run build          # Build the application
npm run electron       # Start Electron app
npm run server         # Start API server
npm run dev           # Development mode (Vite)
```

## 📦 Dependencies

### Main
- `electron`: ^27.1.2
- `react`: ^18.2.0
- `recharts`: ^2.10.3
- `express`: ^4.18.2
- `tsx`: ^4.7.0

### Dev Dependencies
- `vite`: ^5.0.8
- `typescript`: ^5.0.0
- `tailwindcss`: ^3.4.0
- `@types/react`: ^18.2.0

## 🌟 Recent Updates

### Latest Features (October 2025)
1. **Fund Graph Modal** - Interactive full-screen graphs for mutual funds
2. **Time Range Selector** - View stock history from 1 day to all-time
3. **Improved Y-axis Formatting** - Proper dollar values on charts
4. **AI Chat Memory** - Stockie now remembers previous conversation
5. **Enhanced Data Accuracy** - Dual API approach for better financial metrics

## 📄 License & Credits

This project uses:
- Yahoo Finance API for stock data (free tier)
- Google Gemini API for AI features
- Open-source libraries (see package.json)

---

**Last Updated**: October 20, 2025
**Version**: 1.0.0
**Developer**: Created with Claude (Anthropic AI)

