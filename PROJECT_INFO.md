# Practice Trading Simulator

## 📍 Location
**Path:** `A:\Github\Project1-4680`

## 🎯 Overview
Practice Trading Simulator is a comprehensive Electron-based desktop application for learning stock trading with real market data. Start with $10,000 virtual money, build a portfolio, track gains/losses in real-time, and practice trading strategies without financial risk. Features live data from Yahoo Finance, interactive charts, and an integrated AI chatbot (Stockie) powered by Google's Gemini API.

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
│   │   ├── AccountBalance.tsx      # Account balance & funds management
│   │   ├── InvestmentModal.tsx     # Stock purchase dialog
│   │   ├── Portfolio.tsx           # Holdings & performance tracking
│   │   ├── FundGraph.tsx           # Interactive fund history graphs
│   │   ├── ChartView.tsx           # Stock price charts with time ranges
│   │   ├── SideAIChat.tsx          # AI chatbot (Stockie)
│   │   ├── AIAnalysis.tsx          # AI-powered stock analysis
│   │   ├── StockCard.tsx           # Individual stock cards
│   │   └── LoadingError.tsx        # Error handling component
│   ├── pages/             # React page components
│   ├── utils/             # Utility functions
│   │   └── tradingStorage.ts       # LocalStorage persistence for trades
│   └── App.tsx            # Main application component
├── dist/                  # Built application files
└── node_modules/          # Dependencies

```

## ✨ Key Features

### 1. **Practice Trading System** 🆕
- **Virtual Account**: Start with $10,000 in practice money
- **Buy Stocks**: Click "Invest" on any stock card
- **Investment Modal**: Choose dollar amount or number of shares
- **Real-Time Portfolio**: Track all holdings with live P&L
- **My Investments Tab**: Dedicated portfolio view showing:
  - Total portfolio value
  - Total cost basis
  - Overall gain/loss ($ and %)
  - Individual holdings with current prices
  - Per-stock gain/loss tracking
- **Persistent Storage**: All trades saved in localStorage
- **Account Management**: Add funds or reset account anytime
- **No Risk**: Practice with real market data, no real money

### 2. **Real-Time Stock Data**
- Live data from Yahoo Finance API
- 545+ stocks across multiple sectors
- Real-time price updates
- Volume and daily change tracking
- Cryptocurrency support (BTC, ETH, and 18+ more)

### 3. **Interactive Charts**
- **Time Range Selector**: 1D, 5D, 1M, 3M, 6M, 1Y, 2Y, 5Y, Max
- **Intraday Data**: Minute-by-minute data for 1-day view
- **Zoom Controls**: Mouse wheel zoom, zoom in/out buttons
- **Brush Selection**: Drag to select specific date ranges

### 4. **Fund History Graphs**
- Full-screen modal graphs for mutual funds (S&P 500, NASDAQ, Dow Jones)
- Real-time historical data with multiple time ranges
- Interactive tooltips and smooth animations
- Tracks ETFs: SPY (S&P 500), QQQ (NASDAQ), DIA (Dow Jones)

### 5. **AI-Powered Analysis**
- **Stockie**: AI chatbot with conversation memory (last 10 messages)
- Real-time stock analysis using Gemini 2.5 Flash
- Context-aware responses about stocks and market trends
- Integrated with live stock data

### 6. **Stock Categories**
- All Stocks
- S&P 500
- NASDAQ
- Dow Jones
- Cryptocurrency
- **My Investments** 🆕 - Dedicated portfolio tab

### 7. **Search & Filter**
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
The application uses Google's Gemini API for AI features. The API key is now secured using environment variables:
- **Location**: `.env` file (not committed to git)
- **Environment Variable**: `VITE_GEMINI_API_KEY`
- **Model**: `gemini-2.5-flash`
- **Setup**: Copy `.env.example` to `.env` and add your key
- **Get a Key**: https://makersuite.google.com/app/apikey (free)

⚠️ **Security Note**: The `.env` file is gitignored and will never be committed to GitHub. See `SECURITY.md` for details.

## 📊 Data Sources

### Yahoo Finance API
- **Endpoint**: `https://query1.finance.yahoo.com`
- **Quote API**: `/v7/finance/quote` (detailed financial data)
- **Chart API**: `/v8/finance/chart` (historical price data)
- **Rate Limits**: Batched requests (5 stocks per batch, 3-second delay)
- **Cache**: 30-minute cache to reduce API calls

## 🎨 UI Features

### Account Balance Header 🆕
- Prominent balance display in header ($10,000 default)
- "Add Funds" button with modal for adding practice money
- "Reset Account" button to start over
- Quick-add buttons ($100, $500, $1K, $5K)

### Stock Cards
- Real-time price with color-coded changes
- Sector badges
- Volume indicators
- **"Invest" button** - Opens investment modal
- **"Details" button** - View full stock analysis

### Investment Modal 🆕
- Two input modes: dollar amount or number of shares
- Real-time calculation of shares/cost
- Quick-add buttons ($100, $500, $1K, Max)
- Investment summary with remaining balance
- Insufficient funds warning
- Confirms purchase and updates portfolio

### My Investments Tab 🆕
- Portfolio summary cards (Total Value, Cost, Gain/Loss)
- Detailed holdings table with:
  - Ticker and company name
  - Shares owned
  - Average cost per share
  - Current price (real-time)
  - Current value
  - Gain/Loss ($ and %)
- Color-coded gains (green) and losses (red)
- Click any holding to view stock details
- Empty state with "Browse All Stocks" button

### Detail View
- Full stock information
- AI-powered analysis
- Interactive price charts with multiple time ranges
- Risk assessment (Volatility, Liquidity)
- Real-time financial metrics

### Dark Mode
- Modern dark theme throughout
- Green accents for gains, red for losses
- High contrast for readability

## 🐛 Known Issues & Fixes

### Recent Fixes
✅ Practice trading system implemented with localStorage persistence
✅ API keys secured with environment variables
✅ Removed 26+ unnecessary files for cleaner codebase
✅ Only real data displayed - no mock/hallucinated metrics
✅ Y-axis values show proper dollar formatting
✅ 1-day view shows minute-by-minute data
✅ Time range selector on all charts (1D to Max)
✅ Conversation context in AI chat (remembers last 10 messages)
✅ Search functionality completely reimplemented
✅ Crypto data (BTC, ETH + 18 more) loading correctly

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
1. **Practice Trading System** 🆕 - Full mock trading with virtual $10,000 account
2. **Investment Modal** 🆕 - Buy stocks by dollar amount or shares
3. **Portfolio Tracking** 🆕 - Real-time P&L on all holdings with persistence
4. **My Investments Tab** 🆕 - Dedicated portfolio view with performance metrics
5. **API Security** 🆕 - Environment variables for secure API key management
6. **Fund Graph Modal** - Interactive full-screen graphs for mutual funds
7. **Time Range Selector** - View stock history from 1 day to all-time
8. **AI Chat Memory** - Stockie remembers previous conversation (last 10 messages)
9. **Clean Codebase** - Removed 26+ unnecessary files, streamlined structure

## 📄 License & Credits

This project uses:
- Yahoo Finance API for stock data (free tier)
- Google Gemini API for AI features
- Open-source libraries (see package.json)

---

**Last Updated**: October 20, 2025
**Version**: 1.0.0
**Developer**: Created with Claude (Anthropic AI)

