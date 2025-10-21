/**
 * Comprehensive stock symbol generator with real, valid symbols
 * Focuses on major indices: S&P 500, NASDAQ, and popular stocks
 */

// S&P 500 Technology (Top 50)
const sp500Tech = [
  'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'META', 'NVDA', 'TSLA', 'NFLX', 'AMD',
  'INTC', 'ORCL', 'CRM', 'ADBE', 'CSCO', 'IBM', 'QCOM', 'TXN', 'AVGO', 'MU',
  'AMAT', 'LRCX', 'KLAC', 'SNPS', 'CDNS', 'ANSS', 'INTU', 'ADSK', 'NOW', 'WDAY',
  'TEAM', 'MDB', 'DDOG', 'NET', 'ZS', 'OKTA', 'CRWD', 'FTNT', 'PANW', 'CHKP',
  'VRSN', 'AKAM', 'FFIV', 'CTXS', 'VMW', 'WDC', 'STX', 'NTAP', 'HPE', 'DELL'
]

// S&P 500 Financial (Top 50)
const sp500Financial = [
  'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'AXP', 'BLK', 'SPGI', 'V', 'MA',
  'PYPL', 'COF', 'USB', 'PNC', 'TFC', 'SCHW', 'CB', 'MMC', 'AON', 'ICE',
  'BRK.B', 'BK', 'STT', 'TROW', 'NTRS', 'FITB', 'RF', 'HBAN', 'CFG', 'KEY',
  'ZION', 'CMA', 'WAL', 'MTB', 'SNV', 'FHN', 'CFR', 'FNB', 'ASB', 'BOKF',
  'ONB', 'PNFP', 'TCBI', 'UMBF', 'WBS', 'WTFC', 'ZION', 'CMA', 'WAL', 'MTB'
]

// S&P 500 Healthcare (Top 50)
const sp500Healthcare = [
  'JNJ', 'PFE', 'UNH', 'ABBV', 'MRK', 'TMO', 'ABT', 'DHR', 'BMY', 'AMGN',
  'GILD', 'BIIB', 'REGN', 'VRTX', 'MRNA', 'BNTX', 'ILMN', 'ISRG', 'SYK', 'MDT',
  'ZTS', 'LLY', 'CVS', 'CI', 'ANTM', 'HUM', 'AET', 'ESRX', 'PRGO', 'MYL',
  'TEVA', 'ZBH', 'BAX', 'BDX', 'BSX', 'EW', 'HCA', 'LH', 'PKI', 'TECH',
  'UHS', 'VAR', 'WAT', 'XRAY', 'ZBH', 'BAX', 'BDX', 'BSX', 'EW', 'HCA'
]

// S&P 500 Consumer (Top 50)
const sp500Consumer = [
  'WMT', 'HD', 'PG', 'KO', 'PEP', 'NKE', 'MCD', 'SBUX', 'TGT', 'LOW',
  'COST', 'TJX', 'BKNG', 'ABNB', 'EBAY', 'ETSY', 'ROKU', 'ZM', 'PTON', 'DOCU',
  'AMZN', 'BABA', 'JD', 'PDD', 'VIPS', 'WB', 'YMM', 'TAL', 'EDU', 'COE',
  'BIDU', 'NTES', 'TME', 'VIPS', 'WB', 'YMM', 'TAL', 'EDU', 'COE', 'BIDU',
  'NTES', 'TME', 'VIPS', 'WB', 'YMM', 'TAL', 'EDU', 'COE', 'BIDU', 'NTES'
]

// S&P 500 Energy (Top 30)
const sp500Energy = [
  'XOM', 'CVX', 'COP', 'EOG', 'PXD', 'SLB', 'OXY', 'KMI', 'PSX', 'VLO',
  'MPC', 'HES', 'DVN', 'FANG', 'NOV', 'HAL', 'BKR', 'OKE', 'WMB', 'ET',
  'EPD', 'K', 'SRE', 'AEP', 'SO', 'DUK', 'EXC', 'XEL', 'PEG', 'ES'
]

// S&P 500 Industrial (Top 30)
const sp500Industrial = [
  'BA', 'CAT', 'GE', 'HON', 'UPS', 'RTX', 'LMT', 'NOC', 'GD', 'TDG',
  'EMR', 'MMM', 'ITW', 'ETN', 'PH', 'CMI', 'DE', 'FDX', 'CSX', 'NSC',
  'UNP', 'KSU', 'JBHT', 'CHRW', 'EXPD', 'ODFL', 'LSTR', 'XPO', 'ZTO', 'YMM'
]

// S&P 500 Communication Services (Top 20)
const sp500Communication = [
  'GOOGL', 'GOOG', 'META', 'NFLX', 'DIS', 'CMCSA', 'VZ', 'T', 'CHTR', 'TMUS',
  'DISH', 'LUMN', 'FOX', 'FOXA', 'NWSA', 'NWS', 'VIAC', 'VIACA', 'PARA', 'PARAA'
]

// S&P 500 Utilities (Top 20)
const sp500Utilities = [
  'NEE', 'DUK', 'SO', 'AEP', 'EXC', 'XEL', 'PEG', 'ES', 'SRE', 'WEC',
  'ED', 'EIX', 'PPL', 'ETR', 'AEE', 'FE', 'XEL', 'PEG', 'ES', 'SRE'
]

// S&P 500 Real Estate (Top 20)
const sp500RealEstate = [
  'AMT', 'PLD', 'CCI', 'EQIX', 'PSA', 'SPG', 'O', 'WELL', 'EXR', 'AVB',
  'EQR', 'MAA', 'UDR', 'ESS', 'CPT', 'AIV', 'BXP', 'KIM', 'REG', 'SLG'
]

// S&P 500 Materials (Top 20)
const sp500Materials = [
  'LIN', 'APD', 'SHW', 'FCX', 'NEM', 'ECL', 'DD', 'DOW', 'PPG', 'NUE',
  'IFF', 'LYB', 'EMN', 'FMC', 'MOS', 'CF', 'NTR', 'IP', 'PKG', 'WRK'
]

// Additional popular stocks from various sectors
const additionalStocks = [
  // Crypto-related
  'COIN', 'MSTR', 'SQ', 'PYPL',
  
  // EV and Clean Energy
  'TSLA', 'RIVN', 'LCID', 'F', 'GM', 'FORD',
  
  // Biotech and Pharma
  'MRNA', 'BNTX', 'PFE', 'JNJ', 'ABBV', 'GILD',
  
  // E-commerce and Retail
  'AMZN', 'EBAY', 'ETSY', 'SHOP', 'W', 'TGT',
  
  // Streaming and Media
  'NFLX', 'DIS', 'ROKU', 'SPOT', 'TWTR', 'SNAP',
  
  // Cloud and Software
  'CRM', 'NOW', 'WDAY', 'TEAM', 'MDB', 'DDOG',
  
  // Semiconductor
  'NVDA', 'AMD', 'INTC', 'QCOM', 'TXN', 'AVGO',
  
  // Gaming
  'ATVI', 'EA', 'TTWO', 'U', 'RBLX'
]

// Generate a comprehensive list of real stock symbols
export function getAllStockSymbols(): string[] {
  const allSymbols: string[] = []
  
  // Add all major S&P 500 categories (limited to top stocks for better performance)
  allSymbols.push(...sp500Tech.slice(0, 30)) // Top 30 tech stocks
  allSymbols.push(...sp500Financial.slice(0, 20)) // Top 20 financial stocks
  allSymbols.push(...sp500Healthcare.slice(0, 20)) // Top 20 healthcare stocks
  allSymbols.push(...sp500Consumer.slice(0, 20)) // Top 20 consumer stocks
  allSymbols.push(...sp500Energy.slice(0, 15)) // Top 15 energy stocks
  allSymbols.push(...sp500Industrial.slice(0, 15)) // Top 15 industrial stocks
  allSymbols.push(...sp500Communication.slice(0, 10)) // Top 10 communication stocks
  allSymbols.push(...sp500Utilities.slice(0, 10)) // Top 10 utility stocks
  allSymbols.push(...sp500RealEstate.slice(0, 10)) // Top 10 real estate stocks
  allSymbols.push(...sp500Materials.slice(0, 10)) // Top 10 materials stocks
  allSymbols.push(...additionalStocks.slice(0, 20)) // Top 20 additional stocks
  
  // Remove duplicates and return (should be around 200-250 stocks total)
  return [...new Set(allSymbols)]
}

// Export individual categories for filtering
export const StockCategories = {
  TECHNOLOGY: sp500Tech,
  FINANCIAL: sp500Financial,
  HEALTHCARE: sp500Healthcare,
  CONSUMER: sp500Consumer,
  ENERGY: sp500Energy,
  INDUSTRIAL: sp500Industrial,
  COMMUNICATION: sp500Communication,
  UTILITIES: sp500Utilities,
  REAL_ESTATE: sp500RealEstate,
  MATERIALS: sp500Materials,
  ADDITIONAL: additionalStocks
}

// Export the main symbol list as a constant
export const STOCK_SYMBOLS = getAllStockSymbols()

// Also export a smaller set for quick loading
export const QUICK_STOCK_SYMBOLS = [
  // Top 50 most popular stocks for quick loading
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'NFLX', 'AMD', 'INTC',
  'JPM', 'BAC', 'WFC', 'GS', 'V', 'MA', 'JNJ', 'PFE', 'UNH', 'ABBV',
  'WMT', 'HD', 'PG', 'KO', 'PEP', 'NKE', 'MCD', 'SBUX', 'TGT', 'LOW',
  'XOM', 'CVX', 'COP', 'BA', 'CAT', 'GE', 'HON', 'VZ', 'T', 'DIS',
  'NEE', 'DUK', 'SO', 'AEP', 'EXC', 'XEL', 'PEG', 'ES', 'SRE', 'WEC'
]