import express from 'express'
import cors from 'cors'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Stock data interface - NO MOCK DATA, ONLY REAL VALUES
interface Stock {
  ticker: string
  name: string
  sector: string
  price: number
  pe: number | null  // Real value or null - NO ESTIMATES
  dividendYield: number | null  // Real value or null - NO ESTIMATES
  marketCap: number | null  // Real value or null - NO ESTIMATES
  volume: number
  change: number
  changePercent: number
  lastUpdated: string
}

interface StockCache {
  stocks: Stock[]
  lastUpdated: string
  totalStocks: number
  version: string
}

// Comprehensive stock symbols - S&P 500 + NASDAQ 100 + Dow Jones + Popular stocks
const COMPREHENSIVE_STOCK_SYMBOLS = [
  // S&P 500 (already included)
  'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'META', 'NVDA', 'TSLA', 'NFLX', 'AMD',
  'INTC', 'ORCL', 'CRM', 'ADBE', 'CSCO', 'IBM', 'QCOM', 'TXN', 'AVGO', 'MU',
  'AMAT', 'LRCX', 'KLAC', 'SNPS', 'CDNS', 'ANSS', 'INTU', 'ADSK', 'NOW', 'WDAY',
  'TEAM', 'MDB', 'DDOG', 'NET', 'ZS', 'OKTA', 'CRWD', 'FTNT', 'PANW', 'CHKP',
  'VRSN', 'AKAM', 'FFIV', 'CTXS', 'VMW', 'WDC', 'STX', 'NTAP', 'HPE', 'DELL',
  'HPQ', 'ACN', 'CTSH', 'FIS', 'FISV', 'GPN', 'JKHY', 'PAYX', 'WU',
  'IT', 'GLW', 'APH', 'TEL', 'JNPR', 'CIEN', 'ANET', 'ARW', 'TDY', 'KEYS',
  'SWKS', 'QRVO', 'MCHP', 'SLAB', 'ALGN', 'ISRG', 'ILMN', 'VRSK',
  'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'AXP', 'BLK', 'SPGI', 'V', 'MA',
  'PYPL', 'COF', 'USB', 'PNC', 'TFC', 'SCHW', 'CB', 'MMC', 'AON', 'ICE',
  'BRK.B', 'BK', 'STT', 'TROW', 'NTRS', 'FITB', 'RF', 'HBAN', 'CFG', 'KEY',
  'ZION', 'CMA', 'WAL', 'MTB', 'SNV', 'FHN', 'CFR', 'FNB', 'ASB', 'BOKF',
  'ONB', 'PNFP', 'TCBI', 'UMBF', 'WBS', 'WTFC', 'PBCT', 'SIVB', 'SBNY', 'FRC',
  'EWBC', 'CBSH', 'HOMB', 'UBSI', 'FFIN', 'IBOC', 'BKU', 'CATY', 'COLB', 'CVBF',
  'FULT', 'GBCI', 'HWC', 'INDB', 'LKFN', 'MBIN', 'NBTB', 'NWBI', 'OZK', 'PPBI',
  'SFNC', 'STBA', 'TBBK', 'UMPQ', 'VBTX', 'WAFD', 'WASH', 'WSBC',
  'JNJ', 'PFE', 'UNH', 'ABBV', 'MRK', 'TMO', 'ABT', 'DHR', 'BMY', 'AMGN',
  'GILD', 'BIIB', 'REGN', 'VRTX', 'MRNA', 'BNTX', 'ILMN', 'ISRG', 'SYK', 'MDT',
  'ZTS', 'LLY', 'CVS', 'CI', 'ANTM', 'HUM', 'AET', 'ESRX', 'PRGO', 'MYL',
  'TEVA', 'ZBH', 'BAX', 'BDX', 'BSX', 'EW', 'HCA', 'LH', 'PKI', 'TECH',
  'UHS', 'VAR', 'WAT', 'XRAY', 'DGX', 'HOLX', 'IDXX',
  'IQV', 'MOH', 'PENN', 'RMD', 'STE', 'TFX', 'WST',
  'HD', 'MCD', 'NKE', 'SBUX', 'BKNG', 'ABNB', 'EBAY', 'ETSY',
  'ROKU', 'ZM', 'PTON', 'DOCU', 'TGT', 'LOW', 'COST', 'TJX', 'MAR', 'HLT',
  'CHTR', 'CMCSA', 'DIS', 'VZ', 'T', 'TMUS', 'DISH', 'LUMN', 'FOX',
  'FOXA', 'NWSA', 'NWS', 'VIAC', 'VIACA', 'PARA', 'PARAA', 'LYFT', 'UBER', 'DASH',
  'SQ', 'SHOP', 'SIRI', 'PINS', 'SNAP', 'TWTR', 'SPOT',
  'WMT', 'PG', 'KO', 'PEP', 'CL', 'KMB', 'GIS', 'K', 'HSY', 'CPB',
  'CAG', 'CHD', 'CLX', 'EL', 'FLO', 'HRL',
  'KHC', 'MDLZ', 'MNST', 'MKC', 'SJM', 'STZ', 'TSN',
  'XOM', 'CVX', 'COP', 'EOG', 'PXD', 'SLB', 'OXY', 'KMI', 'PSX', 'VLO',
  'MPC', 'HES', 'DVN', 'FANG', 'NOV', 'HAL', 'BKR', 'OKE', 'WMB', 'ET',
  'EPD', 'SRE', 'AEP', 'SO', 'DUK', 'EXC', 'XEL', 'PEG', 'ES',
  'NEE', 'WEC',
  'BA', 'CAT', 'GE', 'HON', 'UPS', 'RTX', 'LMT', 'NOC', 'GD', 'TDG',
  'EMR', 'MMM', 'ITW', 'ETN', 'PH', 'CMI', 'DE', 'FDX', 'CSX', 'NSC',
  'UNP', 'KSU', 'JBHT', 'CHRW', 'EXPD', 'ODFL', 'LSTR', 'XPO', 'ZTO', 'YMM',
  'ARNC', 'BLL', 'CC', 'CFG', 'CTAS', 'DOV', 'JCI',
  'AMT', 'PLD', 'CCI', 'EQIX', 'PSA', 'SPG', 'O', 'WELL', 'EXR', 'AVB',
  'EQR', 'MAA', 'UDR', 'ESS', 'CPT', 'AIV', 'BXP', 'KIM', 'REG', 'SLG',
  'VTR', 'WY',
  'LIN', 'APD', 'SHW', 'FCX', 'NEM', 'ECL', 'DD', 'DOW', 'PPG', 'NUE',
  'IFF', 'LYB', 'EMN', 'FMC', 'MOS', 'CF', 'NTR', 'IP', 'PKG', 'WRK',
  'X', 'CLF', 'AA', 'SCCO', 'VALE', 'RIO', 'BHP', 'GOLD', 'ABX', 'AEM',

  // NASDAQ 100 Additional Stocks
  'ADP', 'ADSK', 'ALGN', 'AMAT', 'AMD', 'AMGN', 'AMZN', 'ANSS', 'ASML', 'ATVI',
  'AVGO', 'BIDU', 'BIIB', 'BKNG', 'CDNS', 'CHTR', 'CMCSA', 'COST', 'CPRT', 'CSCO',
  'CSGP', 'CSX', 'CTAS', 'CTSH', 'DLTR', 'DXCM', 'EA', 'EBAY', 'EXC', 'FAST',
  'FISV', 'FTNT', 'GILD', 'GOOG', 'GOOGL', 'HON', 'IDXX', 'ILMN', 'INCY', 'INTC',
  'INTU', 'ISRG', 'JD', 'KDP', 'KHC', 'KLAC', 'LRCX', 'LULU', 'MAR', 'MCHP',
  'MDLZ', 'MELI', 'MNST', 'MRNA', 'MRVL', 'MSFT', 'MTCH', 'MU', 'NFLX', 'NTES',
  'NVDA', 'NXPI', 'ODFL', 'ORLY', 'PAYX', 'PCAR', 'PDD', 'PEP', 'PTON', 'PYPL',
  'QCOM', 'REGN', 'ROST', 'SBUX', 'SIRI', 'SNPS', 'SPLK', 'SWKS', 'TCOM', 'TEAM',
  'TMUS', 'TSLA', 'TXN', 'VRSK', 'VRTX', 'WBA', 'WDAY', 'XEL', 'ZM', 'ZS',

  // Dow Jones Industrial Average
  'AXP', 'AMGN', 'AAPL', 'BA', 'CAT', 'CVX', 'CSCO', 'KO', 'DOW', 'GS',
  'HD', 'HON', 'IBM', 'INTC', 'JNJ', 'JPM', 'MCD', 'MMM', 'MRK', 'MSFT',
  'NKE', 'PG', 'TRV', 'UNH', 'VZ', 'V', 'WBA', 'WMT', 'DIS',

  // Popular Tech Stocks
  'PLTR', 'SNOW', 'CRWD', 'ZS', 'OKTA', 'DDOG', 'NET', 'MDB', 'WDAY', 'NOW',
  'ADBE', 'CRM', 'ORCL', 'INTU', 'ADSK', 'ANSS', 'CDNS', 'SNPS', 'CTXS', 'VMW',
  'WDC', 'STX', 'NTAP', 'HPE', 'DELL', 'HPQ', 'ACN', 'CTSH', 'FIS', 'FISV',
  'GPN', 'JKHY', 'PAYX', 'WU', 'IT', 'GLW', 'APH', 'TEL', 'JNPR', 'CIEN',
  'ANET', 'ARW', 'TDY', 'KEYS', 'SWKS', 'QRVO', 'MCHP', 'SLAB', 'ALGN', 'ISRG',
  'ILMN', 'VRSK',

  // Popular Growth Stocks
  'ARKK', 'ARKQ', 'ARKW', 'ARKG', 'ARKF', 'TSLA', 'NVDA', 'AMD', 'NFLX', 'ROKU',
  'ZM', 'PTON', 'DOCU', 'SQ', 'SHOP', 'PINS', 'SNAP', 'TWTR', 'SPOT', 'LYFT',
  'UBER', 'DASH', 'ABNB', 'EBAY', 'ETSY', 'BKNG', 'SBUX', 'MCD', 'NKE', 'HD',
  'LOW', 'COST', 'TJX', 'MAR', 'HLT', 'CHTR', 'CMCSA', 'DIS', 'VZ', 'T',
  'TMUS', 'DISH', 'LUMN', 'FOX', 'FOXA', 'NWSA', 'NWS', 'VIAC', 'VIACA',
  'PARA', 'PARAA', 'SIRI',

  // Popular Financial Stocks
  'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'AXP', 'BLK', 'SPGI', 'V', 'MA',
  'PYPL', 'COF', 'USB', 'PNC', 'TFC', 'SCHW', 'CB', 'MMC', 'AON', 'ICE',
  'BRK.B', 'BK', 'STT', 'TROW', 'NTRS', 'FITB', 'RF', 'HBAN', 'CFG', 'KEY',
  'ZION', 'CMA', 'WAL', 'MTB', 'SNV', 'FHN', 'CFR', 'FNB', 'ASB', 'BOKF',
  'ONB', 'PNFP', 'TCBI', 'UMBF', 'WBS', 'WTFC', 'PBCT', 'SIVB', 'SBNY', 'FRC',
  'EWBC', 'CBSH', 'HOMB', 'UBSI', 'FFIN', 'IBOC', 'BKU', 'CATY', 'COLB', 'CVBF',
  'FULT', 'GBCI', 'HWC', 'INDB', 'LKFN', 'MBIN', 'NBTB', 'NWBI', 'OZK', 'PPBI',
  'SFNC', 'STBA', 'TBBK', 'UMPQ', 'VBTX', 'WAFD', 'WASH', 'WSBC',

  // Popular Healthcare Stocks
  'JNJ', 'PFE', 'UNH', 'ABBV', 'MRK', 'TMO', 'ABT', 'DHR', 'BMY', 'AMGN',
  'GILD', 'BIIB', 'REGN', 'VRTX', 'MRNA', 'BNTX', 'ILMN', 'ISRG', 'SYK', 'MDT',
  'ZTS', 'LLY', 'CVS', 'CI', 'ANTM', 'HUM', 'AET', 'ESRX', 'PRGO', 'MYL',
  'TEVA', 'ZBH', 'BAX', 'BDX', 'BSX', 'EW', 'HCA', 'LH', 'PKI', 'TECH',
  'UHS', 'VAR', 'WAT', 'XRAY', 'DGX', 'HOLX', 'IDXX',
  'IQV', 'MOH', 'PENN', 'RMD', 'STE', 'TFX', 'WST',

  // Popular Consumer Stocks
  'WMT', 'PG', 'KO', 'PEP', 'CL', 'KMB', 'GIS', 'K', 'HSY', 'CPB',
  'CAG', 'CHD', 'CLX', 'EL', 'FLO', 'HRL',
  'KHC', 'MDLZ', 'MNST', 'MKC', 'SJM', 'STZ', 'TSN',
  'HD', 'MCD', 'NKE', 'SBUX', 'BKNG', 'ABNB', 'EBAY', 'ETSY',
  'ROKU', 'ZM', 'PTON', 'DOCU', 'TGT', 'LOW', 'COST', 'TJX', 'MAR', 'HLT',

  // Popular Energy Stocks
  'XOM', 'CVX', 'COP', 'EOG', 'PXD', 'SLB', 'OXY', 'KMI', 'PSX', 'VLO',
  'MPC', 'HES', 'DVN', 'FANG', 'NOV', 'HAL', 'BKR', 'OKE', 'WMB', 'ET',
  'EPD', 'SRE', 'AEP', 'SO', 'DUK', 'EXC', 'XEL', 'PEG', 'ES',
  'NEE', 'WEC',

  // Cryptocurrency Stocks & ETFs
  'BTC-USD', 'ETH-USD', 'BNB-USD', 'ADA-USD', 'SOL-USD', 'XRP-USD', 'DOT-USD', 'DOGE-USD', 'AVAX-USD', 'MATIC-USD',
  'LTC-USD', 'UNI-USD', 'LINK-USD', 'ATOM-USD', 'FTM-USD', 'ALGO-USD', 'VET-USD', 'FIL-USD', 'TRX-USD', 'ICP-USD',
  'COIN', 'MSTR', 'RIOT', 'MARA', 'HUT', 'BITF', 'CAN', 'ARBKF', 'BTBT', 'EBON', 'SOS', 'BTCM', 
  'BLOK', 'BITQ', 'LEGR', 'XBTF', 'BITO', 'BTF', 'GBTC', 'ETHE', 'GDLC', 'OBTC', 'BITW', 'ETCG', 'BLCN', 'KOIN',

  // Additional Popular Tech Stocks
  'SNOW', 'PLTR', 'CRWD', 'ZS', 'OKTA', 'DDOG', 'NET', 'MDB', 'WDAY', 'NOW',
  'ADBE', 'CRM', 'ORCL', 'INTU', 'ADSK', 'ANSS', 'CDNS', 'SNPS', 'CTXS', 'VMW',
  'WDC', 'STX', 'NTAP', 'HPE', 'DELL', 'HPQ', 'ACN', 'CTSH', 'FIS', 'FISV',
  'GPN', 'JKHY', 'PAYX', 'WU', 'IT', 'GLW', 'APH', 'TEL', 'JNPR', 'CIEN',
  'ANET', 'ARW', 'TDY', 'KEYS', 'SWKS', 'QRVO', 'MCHP', 'SLAB', 'ALGN', 'ISRG',
  'ILMN', 'VRSK', 'SPLK', 'FTNT', 'PANW', 'CHKP', 'VRSN', 'AKAM', 'FFIV', 'CTXS',

  // Additional Growth & Innovation Stocks
  'ARKK', 'ARKQ', 'ARKW', 'ARKG', 'ARKF', 'TSLA', 'NVDA', 'AMD', 'NFLX', 'ROKU',
  'ZM', 'PTON', 'DOCU', 'SQ', 'SHOP', 'PINS', 'SNAP', 'TWTR', 'SPOT', 'LYFT',
  'UBER', 'DASH', 'ABNB', 'EBAY', 'ETSY', 'BKNG', 'SBUX', 'MCD', 'NKE', 'HD',
  'LOW', 'COST', 'TJX', 'MAR', 'HLT', 'CHTR', 'CMCSA', 'DIS', 'VZ', 'T',
  'TMUS', 'DISH', 'LUMN', 'FOX', 'FOXA', 'NWSA', 'NWS', 'VIAC', 'VIACA',
  'PARA', 'PARAA', 'SIRI', 'RBLX', 'U', 'COUP', 'ESTC', 'FROG', 'SMAR', 'TWLO',

  // Additional Financial & Fintech Stocks
  'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'AXP', 'BLK', 'SPGI', 'V', 'MA',
  'PYPL', 'COF', 'USB', 'PNC', 'TFC', 'SCHW', 'CB', 'MMC', 'AON', 'ICE',
  'BRK.B', 'BK', 'STT', 'TROW', 'NTRS', 'FITB', 'RF', 'HBAN', 'CFG', 'KEY',
  'ZION', 'CMA', 'WAL', 'MTB', 'SNV', 'FHN', 'CFR', 'FNB', 'ASB', 'BOKF',
  'ONB', 'PNFP', 'TCBI', 'UMBF', 'WBS', 'WTFC', 'PBCT', 'SIVB', 'SBNY', 'FRC',
  'EWBC', 'CBSH', 'HOMB', 'UBSI', 'FFIN', 'IBOC', 'BKU', 'CATY', 'COLB', 'CVBF',
  'FULT', 'GBCI', 'HWC', 'INDB', 'LKFN', 'MBIN', 'NBTB', 'NWBI', 'OZK', 'PPBI',
  'SFNC', 'STBA', 'TBBK', 'UMPQ', 'VBTX', 'WAFD', 'WASH', 'WSBC', 'SOFI', 'UPST',
  'LC', 'LENDING', 'AFRM', 'OPEN', 'COMP', 'Z', 'RKT', 'RDFN', 'EXPI', 'REAL',

  // Additional Healthcare & Biotech Stocks
  'JNJ', 'PFE', 'UNH', 'ABBV', 'MRK', 'TMO', 'ABT', 'DHR', 'BMY', 'AMGN',
  'GILD', 'BIIB', 'REGN', 'VRTX', 'MRNA', 'BNTX', 'ILMN', 'ISRG', 'SYK', 'MDT',
  'ZTS', 'LLY', 'CVS', 'CI', 'ANTM', 'HUM', 'AET', 'ESRX', 'PRGO', 'MYL',
  'TEVA', 'ZBH', 'BAX', 'BDX', 'BSX', 'EW', 'HCA', 'LH', 'PKI', 'TECH',
  'UHS', 'VAR', 'WAT', 'XRAY', 'DGX', 'HOLX', 'IDXX', 'IQV', 'MOH', 'PENN',
  'RMD', 'STE', 'TFX', 'WST', 'CRL', 'ICLR', 'TMO', 'DHR', 'BDX', 'BSX',

  // Additional Consumer & Retail Stocks
  'WMT', 'PG', 'KO', 'PEP', 'CL', 'KMB', 'GIS', 'K', 'HSY', 'CPB',
  'CAG', 'CHD', 'CLX', 'EL', 'FLO', 'HRL', 'KHC', 'MDLZ', 'MNST', 'MKC',
  'SJM', 'STZ', 'TSN', 'HD', 'MCD', 'NKE', 'SBUX', 'BKNG', 'ABNB', 'EBAY',
  'ETSY', 'ROKU', 'ZM', 'PTON', 'DOCU', 'TGT', 'LOW', 'COST', 'TJX', 'MAR',
  'HLT', 'CHTR', 'CMCSA', 'DIS', 'VZ', 'T', 'TMUS', 'DISH', 'LUMN', 'FOX',
  'FOXA', 'NWSA', 'NWS', 'VIAC', 'VIACA', 'PARA', 'PARAA', 'SIRI', 'LULU', 'NKE',

  // Additional Energy & Utilities Stocks
  'XOM', 'CVX', 'COP', 'EOG', 'PXD', 'SLB', 'OXY', 'KMI', 'PSX', 'VLO',
  'MPC', 'HES', 'DVN', 'FANG', 'NOV', 'HAL', 'BKR', 'OKE', 'WMB', 'ET',
  'EPD', 'SRE', 'AEP', 'SO', 'DUK', 'EXC', 'XEL', 'PEG', 'ES', 'NEE',
  'WEC', 'ED', 'D', 'FE', 'AEE', 'LNT', 'EIX', 'PCG', 'SRE', 'WEC',

  // Additional Industrial & Materials Stocks
  'BA', 'CAT', 'GE', 'HON', 'UPS', 'RTX', 'LMT', 'NOC', 'GD', 'TDG',
  'EMR', 'MMM', 'ITW', 'ETN', 'PH', 'CMI', 'DE', 'FDX', 'CSX', 'NSC',
  'UNP', 'KSU', 'JBHT', 'CHRW', 'EXPD', 'ODFL', 'LSTR', 'XPO', 'ZTO', 'YMM',
  'ARNC', 'BLL', 'CC', 'CFG', 'CTAS', 'DOV', 'JCI', 'AMT', 'PLD', 'CCI',
  'EQIX', 'PSA', 'SPG', 'O', 'WELL', 'EXR', 'AVB', 'EQR', 'MAA', 'UDR',
  'ESS', 'CPT', 'AIV', 'BXP', 'KIM', 'REG', 'SLG', 'VTR', 'WY', 'LIN',
  'APD', 'SHW', 'FCX', 'NEM', 'ECL', 'DD', 'DOW', 'PPG', 'NUE', 'IFF',
  'LYB', 'EMN', 'FMC', 'MOS', 'CF', 'NTR', 'IP', 'PKG', 'WRK', 'X',
  'CLF', 'AA', 'SCCO', 'VALE', 'RIO', 'BHP', 'GOLD', 'ABX', 'AEM', 'NEM',

  // Additional International Stocks (ADRs)
  'ASML', 'TSM', 'BABA', 'JD', 'PDD', 'NIO', 'XPEV', 'LI', 'BIDU', 'NTES',
  'TME', 'VIPS', 'WB', 'YMM', 'ZTO', 'TAL', 'EDU', 'GSX', 'COE', 'WIT',
  'INFY', 'HDB', 'IBN', 'TTM', 'SIFY', 'REDF', 'MIND', 'RDY', 'DRREDDY', 'WIPRO',

  // Additional REITs & Real Estate
  'AMT', 'PLD', 'CCI', 'EQIX', 'PSA', 'SPG', 'O', 'WELL', 'EXR', 'AVB',
  'EQR', 'MAA', 'UDR', 'ESS', 'CPT', 'AIV', 'BXP', 'KIM', 'REG', 'SLG',
  'VTR', 'WY', 'PLD', 'AMT', 'CCI', 'EQIX', 'PSA', 'SPG', 'O', 'WELL',

  // Additional ETFs & Index Funds
  'SPY', 'QQQ', 'IWM', 'VTI', 'VOO', 'VEA', 'VWO', 'AGG', 'BND', 'TLT',
  'GLD', 'SLV', 'USO', 'UNG', 'TAN', 'ICLN', 'PBW', 'QCLN', 'FAN', 'SMOG',
  'ARKK', 'ARKQ', 'ARKW', 'ARKG', 'ARKF', 'BLOK', 'BITQ', 'LEGR', 'XBTF', 'BITO',

  // Additional Small Cap & Mid Cap Stocks
  'SMCI', 'PLTR', 'SNOW', 'CRWD', 'ZS', 'OKTA', 'DDOG', 'NET', 'MDB', 'WDAY',
  'NOW', 'ADBE', 'CRM', 'ORCL', 'INTU', 'ADSK', 'ANSS', 'CDNS', 'SNPS', 'CTXS',
  'VMW', 'WDC', 'STX', 'NTAP', 'HPE', 'DELL', 'HPQ', 'ACN', 'CTSH', 'FIS',
  'FISV', 'GPN', 'JKHY', 'PAYX', 'WU', 'IT', 'GLW', 'APH', 'TEL', 'JNPR',
  'CIEN', 'ANET', 'ARW', 'TDY', 'KEYS', 'SWKS', 'QRVO', 'MCHP', 'SLAB', 'ALGN',

  // Popular Industrial Stocks
  'BA', 'CAT', 'GE', 'HON', 'UPS', 'RTX', 'LMT', 'NOC', 'GD', 'TDG',
  'EMR', 'MMM', 'ITW', 'ETN', 'PH', 'CMI', 'DE', 'FDX', 'CSX', 'NSC',
  'UNP', 'KSU', 'JBHT', 'CHRW', 'EXPD', 'ODFL', 'LSTR', 'XPO', 'ZTO', 'YMM',
  'ARNC', 'BLL', 'CC', 'CFG', 'CTAS', 'DOV', 'JCI',

  // Popular Real Estate Stocks
  'AMT', 'PLD', 'CCI', 'EQIX', 'PSA', 'SPG', 'O', 'WELL', 'EXR', 'AVB',
  'EQR', 'MAA', 'UDR', 'ESS', 'CPT', 'AIV', 'BXP', 'KIM', 'REG', 'SLG',
  'VTR', 'WY',

  // Popular Materials Stocks
  'LIN', 'APD', 'SHW', 'FCX', 'NEM', 'ECL', 'DD', 'DOW', 'PPG', 'NUE',
  'IFF', 'LYB', 'EMN', 'FMC', 'MOS', 'CF', 'NTR', 'IP', 'PKG', 'WRK',
  'X', 'CLF', 'AA', 'SCCO', 'VALE', 'RIO', 'BHP', 'GOLD', 'ABX', 'AEM',

  // Popular International Stocks (ADRs)
  'ASML', 'TSM', 'BABA', 'JD', 'PDD', 'NIO', 'XPEV', 'LI', 'BIDU', 'NTES',
  'TME', 'WB', 'VIPS', 'YMM', 'ZTO', 'TAL', 'EDU', 'COE', 'IQ', 'HUYA',
  'DOYU', 'WB', 'VIPS', 'YMM', 'ZTO', 'TAL', 'EDU', 'COE', 'IQ', 'HUYA',
  'DOYU', 'WB', 'VIPS', 'YMM', 'ZTO', 'TAL', 'EDU', 'COE', 'IQ', 'HUYA',

  // Popular Crypto-Related Stocks
  'COIN', 'MSTR', 'RIOT', 'MARA', 'HUT', 'BITF', 'CAN', 'EBON', 'SOS', 'BTBT',
  'MOGO', 'OSTK', 'PYPL', 'SQ', 'V', 'MA', 'AXP', 'DFS', 'FISV', 'GPN',

  // Popular EV Stocks
  'TSLA', 'NIO', 'XPEV', 'LI', 'RIVN', 'LCID', 'F', 'GM', 'FORD', 'TM',
  'HMC', 'NSU', 'VWAGY', 'BMWYY', 'DDAIF', 'RACE', 'FCAU', 'STLA',

  // Popular Biotech Stocks
  'GILD', 'BIIB', 'REGN', 'VRTX', 'MRNA', 'BNTX', 'ILMN', 'ISRG', 'SYK', 'MDT',
  'ZTS', 'LLY', 'ABBV', 'MRK', 'PFE', 'JNJ', 'TMO', 'ABT', 'DHR', 'BMY',
  'AMGN', 'GILD', 'BIIB', 'REGN', 'VRTX', 'MRNA', 'BNTX', 'ILMN', 'ISRG', 'SYK',
  'MDT', 'ZTS', 'LLY', 'CVS', 'CI', 'ANTM', 'HUM', 'AET', 'ESRX', 'PRGO',
  'MYL', 'TEVA', 'ZBH', 'BAX', 'BDX', 'BSX', 'EW', 'HCA', 'LH', 'PKI',
  'TECH', 'UHS', 'VAR', 'WAT', 'XRAY', 'DGX', 'HOLX', 'IDXX',
  'IQV', 'MOH', 'PENN', 'RMD', 'STE', 'TFX', 'WST',

  // Popular REITs
  'AMT', 'PLD', 'CCI', 'EQIX', 'PSA', 'SPG', 'O', 'WELL', 'EXR', 'AVB',
  'EQR', 'MAA', 'UDR', 'ESS', 'CPT', 'AIV', 'BXP', 'KIM', 'REG', 'SLG',
  'VTR', 'WY', 'STOR', 'STAG', 'LTC', 'OHI', 'MPW', 'PEAK', 'DOC', 'GMRE',
  'AGNC', 'NLY', 'CIM', 'TWO', 'MFA', 'NYMT', 'RC', 'BXMT', 'TRTX', 'KREF',

  // Popular Dividend Stocks
  'JNJ', 'PFE', 'KO', 'PEP', 'PG', 'WMT', 'HD', 'MCD', 'SBUX', 'NKE',
  'VZ', 'T', 'XOM', 'CVX', 'COP', 'EOG', 'SLB', 'OXY', 'KMI', 'PSX',
  'VLO', 'MPC', 'HES', 'DVN', 'FANG', 'NOV', 'HAL', 'BKR', 'OKE', 'WMB',
  'ET', 'EPD', 'SRE', 'AEP', 'SO', 'DUK', 'EXC', 'XEL', 'PEG', 'ES',
  'NEE', 'WEC', 'AMT', 'PLD', 'CCI', 'EQIX', 'PSA', 'SPG', 'O', 'WELL',
  'EXR', 'AVB', 'EQR', 'MAA', 'UDR', 'ESS', 'CPT', 'AIV', 'BXP', 'KIM',
  'REG', 'SLG', 'VTR', 'WY',

  // Popular Small Cap Stocks
  'PLTR', 'SNOW', 'CRWD', 'ZS', 'OKTA', 'DDOG', 'NET', 'MDB', 'WDAY', 'NOW',
  'ADBE', 'CRM', 'ORCL', 'INTU', 'ADSK', 'ANSS', 'CDNS', 'SNPS', 'CTXS', 'VMW',
  'WDC', 'STX', 'NTAP', 'HPE', 'DELL', 'HPQ', 'ACN', 'CTSH', 'FIS', 'FISV',
  'GPN', 'JKHY', 'PAYX', 'WU', 'IT', 'GLW', 'APH', 'TEL', 'JNPR', 'CIEN',
  'ANET', 'ARW', 'TDY', 'KEYS', 'SWKS', 'QRVO', 'MCHP', 'SLAB', 'ALGN', 'ISRG',
  'ILMN', 'VRSK',

  // Popular Meme Stocks
  'GME', 'AMC', 'BB', 'NOK', 'SNDL', 'CLOV', 'WISH', 'SPCE', 'PLTR', 'SNOW',
  'CRWD', 'ZS', 'OKTA', 'DDOG', 'NET', 'MDB', 'WDAY', 'NOW', 'ADBE', 'CRM',
  'ORCL', 'INTU', 'ADSK', 'ANSS', 'CDNS', 'SNPS', 'CTXS', 'VMW', 'WDC', 'STX',
  'NTAP', 'HPE', 'DELL', 'HPQ', 'ACN', 'CTSH', 'FIS', 'FISV', 'GPN', 'JKHY',
  'PAYX', 'WU', 'IT', 'GLW', 'APH', 'TEL', 'JNPR', 'CIEN', 'ANET', 'ARW',
  'TDY', 'KEYS', 'SWKS', 'QRVO', 'MCHP', 'SLAB', 'ALGN', 'ISRG', 'ILMN', 'VRSK'
]

// Remove duplicates and create clean array
const STOCK_SYMBOLS = [...new Set(COMPREHENSIVE_STOCK_SYMBOLS)]

// Define stock categories - FIXED WITH PROPER S&P 500
const STOCK_CATEGORIES = {
  'sp500': [
    // Technology - S&P 500
    'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'META', 'NVDA', 'NFLX', 'AMD', 'INTC',
    'ORCL', 'CRM', 'ADBE', 'CSCO', 'IBM', 'QCOM', 'TXN', 'AVGO', 'MU', 'AMAT',
    'LRCX', 'KLAC', 'SNPS', 'CDNS', 'ANSS', 'INTU', 'ADSK', 'NOW', 'WDAY', 'TEAM',
    'MDB', 'DDOG', 'NET', 'ZS', 'OKTA', 'CRWD', 'FTNT', 'PANW', 'CHKP', 'VRSN',
    'AKAM', 'FFIV', 'CTXS', 'VMW', 'WDC', 'STX', 'NTAP', 'HPE', 'DELL', 'HPQ',
    'ACN', 'CTSH', 'FIS', 'FISV', 'GPN', 'JKHY', 'PAYX', 'WU', 'IT', 'GLW',
    'APH', 'TEL', 'JNPR', 'CIEN', 'ANET', 'ARW', 'TDY', 'KEYS', 'SWKS', 'QRVO',
    'MCHP', 'SLAB', 'ALGN', 'ISRG', 'ILMN', 'VRSK',
    
    // Financial - S&P 500
    'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'AXP', 'BLK', 'SPGI', 'V', 'MA',
    'PYPL', 'COF', 'USB', 'PNC', 'TFC', 'SCHW', 'CB', 'MMC', 'AON', 'ICE',
    'BRK.B', 'BK', 'STT', 'TROW', 'NTRS', 'FITB', 'RF', 'HBAN', 'CFG', 'KEY',
    'ZION', 'CMA', 'WAL', 'MTB', 'SNV', 'FHN', 'CFR', 'FNB', 'ASB', 'BOKF',
    'ONB', 'PNFP', 'TCBI', 'UMBF', 'WBS', 'WTFC', 'PBCT', 'SIVB', 'SBNY', 'FRC',
    'EWBC', 'CBSH', 'HOMB', 'UBSI', 'FFIN', 'IBOC', 'BKU', 'CATY', 'COLB', 'CVBF',
    'FULT', 'GBCI', 'HWC', 'INDB', 'LKFN', 'MBIN', 'NBTB', 'NWBI', 'OZK', 'PPBI',
    'SFNC', 'STBA', 'TBBK', 'UMPQ', 'VBTX', 'WAFD', 'WASH', 'WSBC',
    
    // Healthcare - S&P 500
    'JNJ', 'PFE', 'UNH', 'ABBV', 'MRK', 'TMO', 'ABT', 'DHR', 'BMY', 'AMGN',
    'GILD', 'BIIB', 'REGN', 'VRTX', 'MRNA', 'BNTX', 'ILMN', 'ISRG', 'SYK', 'MDT',
    'ZTS', 'LLY', 'CVS', 'CI', 'ANTM', 'HUM', 'AET', 'ESRX', 'PRGO', 'MYL',
    'TEVA', 'ZBH', 'BAX', 'BDX', 'BSX', 'EW', 'HCA', 'LH', 'PKI', 'TECH',
    'UHS', 'VAR', 'WAT', 'XRAY', 'DGX', 'HOLX', 'IDXX', 'IQV', 'MOH', 'PENN',
    'RMD', 'STE', 'TFX', 'WST',
    
    // Consumer - S&P 500
    'HD', 'MCD', 'NKE', 'SBUX', 'BKNG', 'ABNB', 'EBAY', 'ETSY', 'ROKU', 'ZM',
    'PTON', 'DOCU', 'TGT', 'LOW', 'COST', 'TJX', 'MAR', 'HLT', 'CHTR', 'CMCSA',
    'DIS', 'VZ', 'T', 'TMUS', 'DISH', 'LUMN', 'FOX', 'FOXA', 'NWSA', 'NWS',
    'VIAC', 'VIACA', 'PARA', 'PARAA', 'LYFT', 'UBER', 'DASH', 'SQ', 'SHOP',
    'SIRI', 'PINS', 'SNAP', 'TWTR', 'SPOT', 'WMT', 'PG', 'KO', 'PEP', 'CL',
    'KMB', 'GIS', 'K', 'HSY', 'CPB', 'CAG', 'CHD', 'CLX', 'EL', 'FLO', 'HRL',
    'KHC', 'MDLZ', 'MNST', 'MKC', 'SJM', 'STZ', 'TSN',
    
    // Energy - S&P 500
    'XOM', 'CVX', 'COP', 'EOG', 'PXD', 'SLB', 'OXY', 'KMI', 'PSX', 'VLO',
    'MPC', 'HES', 'DVN', 'FANG', 'NOV', 'HAL', 'BKR', 'OKE', 'WMB', 'ET',
    'EPD', 'SRE', 'AEP', 'SO', 'DUK', 'EXC', 'XEL', 'PEG', 'ES', 'NEE', 'WEC',
    
    // Industrial - S&P 500
    'BA', 'CAT', 'GE', 'HON', 'UPS', 'RTX', 'LMT', 'NOC', 'GD', 'TDG',
    'EMR', 'MMM', 'ITW', 'ETN', 'PH', 'CMI', 'DE', 'FDX', 'CSX', 'NSC',
    'UNP', 'KSU', 'JBHT', 'CHRW', 'EXPD', 'ODFL', 'LSTR', 'XPO', 'ZTO', 'YMM',
    'ARNC', 'BLL', 'CC', 'CFG', 'CTAS', 'DOV', 'JCI',
    
    // Real Estate - S&P 500
    'AMT', 'PLD', 'CCI', 'EQIX', 'PSA', 'SPG', 'O', 'WELL', 'EXR', 'AVB',
    'EQR', 'MAA', 'UDR', 'ESS', 'CPT', 'AIV', 'BXP', 'KIM', 'REG', 'SLG',
    'VTR', 'WY',
    
    // Materials - S&P 500
    'LIN', 'APD', 'SHW', 'FCX', 'NEM', 'ECL', 'DD', 'DOW', 'PPG', 'NUE',
    'IFF', 'LYB', 'EMN', 'FMC', 'MOS', 'CF', 'NTR', 'IP', 'PKG', 'WRK',
    'X', 'CLF', 'AA', 'SCCO', 'VALE', 'RIO', 'BHP', 'GOLD', 'ABX', 'AEM'
  ],
  'nasdaq': [
    // Pure NASDAQ Tech Stocks (NOT in S&P 500)
    'ADP', 'ASML', 'ATVI', 'BIDU', 'BKNG', 'CPRT', 'CSGP', 'DLTR', 'DXCM', 'EA',
    'EXC', 'FAST', 'GILD', 'HON', 'IDXX', 'INCY', 'JD', 'KDP', 'KHC', 'KLAC',
    'LULU', 'MAR', 'MDLZ', 'MELI', 'MNST', 'MRNA', 'MRVL', 'MTCH', 'NTES',
    'NXPI', 'ODFL', 'ORLY', 'PCAR', 'PDD', 'PEP', 'PTON', 'PYPL', 'QCOM', 'REGN',
    'ROST', 'SBUX', 'SIRI', 'SPLK', 'TCOM', 'TMUS', 'VRTX', 'WBA', 'WDAY', 'XEL', 'ZM', 'ZS',
    
    // Crypto/Fintech - NASDAQ
    'COIN', 'MSTR', 'RIOT', 'MARA', 'HUT', 'BITF', 'CAN', 'EBON', 'SOS', 'BTBT',
    'MOGO', 'OSTK', 'PYPL', 'SQ', 'V', 'MA', 'AXP', 'DFS', 'FISV', 'GPN',
    
    // EV/Tech - NASDAQ
    'TSLA', 'NIO', 'XPEV', 'LI', 'RIVN', 'LCID', 'F', 'GM', 'FORD', 'TM',
    'HMC', 'NSU', 'VWAGY', 'BMWYY', 'DDAIF', 'RACE', 'FCAU', 'STLA',
    
    // Biotech/Tech - NASDAQ
    'GILD', 'BIIB', 'REGN', 'VRTX', 'MRNA', 'BNTX', 'ILMN', 'ISRG', 'SYK', 'MDT',
    'ZTS', 'LLY', 'ABBV', 'MRK', 'PFE', 'JNJ', 'TMO', 'ABT', 'DHR', 'BMY',
    'AMGN', 'CVS', 'CI', 'ANTM', 'HUM', 'AET', 'ESRX', 'PRGO', 'MYL', 'TEVA',
    'ZBH', 'BAX', 'BDX', 'BSX', 'EW', 'HCA', 'LH', 'PKI', 'TECH', 'UHS',
    'VAR', 'WAT', 'XRAY', 'DGX', 'HOLX', 'IDXX', 'IQV', 'MOH', 'PENN', 'RMD',
    'STE', 'TFX', 'WST',
    
    // Growth Stocks - NASDAQ
    'PLTR', 'SNOW', 'CRWD', 'ZS', 'OKTA', 'DDOG', 'NET', 'MDB', 'WDAY', 'NOW',
    'ADBE', 'CRM', 'ORCL', 'INTU', 'ADSK', 'ANSS', 'CDNS', 'SNPS', 'CTXS', 'VMW',
    'WDC', 'STX', 'NTAP', 'HPE', 'DELL', 'HPQ', 'ACN', 'CTSH', 'FIS', 'FISV',
    'GPN', 'JKHY', 'PAYX', 'WU', 'IT', 'GLW', 'APH', 'TEL', 'JNPR', 'CIEN',
    'ANET', 'ARW', 'TDY', 'KEYS', 'SWKS', 'QRVO', 'MCHP', 'SLAB', 'ALGN', 'ISRG',
    'ILMN', 'VRSK'
  ],
  'dow': [
    'AXP', 'AMGN', 'AAPL', 'BA', 'CAT', 'CVX', 'CSCO', 'KO', 'DOW', 'GS',
    'HD', 'HON', 'IBM', 'INTC', 'JNJ', 'JPM', 'MCD', 'MMM', 'MRK', 'MSFT',
    'NKE', 'PG', 'TRV', 'UNH', 'VZ', 'V', 'WBA', 'WMT', 'DIS'
  ],
  'crypto': [
    'BTC-USD', 'ETH-USD', 'BNB-USD', 'ADA-USD', 'SOL-USD', 'XRP-USD', 'DOT-USD', 'DOGE-USD', 'AVAX-USD', 'MATIC-USD',
    'LTC-USD', 'UNI-USD', 'LINK-USD', 'ATOM-USD', 'FTM-USD', 'ALGO-USD', 'VET-USD', 'FIL-USD', 'TRX-USD', 'ICP-USD',
    'COIN', 'MSTR', 'RIOT', 'MARA', 'HUT', 'BITF', 'CAN', 'EBON', 'SOS', 'BTBT',
    'MOGO', 'OSTK', 'PYPL', 'SQ', 'V', 'MA', 'AXP', 'DFS', 'FISV', 'GPN'
  ],
  'ev': [
    'TSLA', 'NIO', 'XPEV', 'LI', 'RIVN', 'LCID', 'F', 'GM', 'FORD', 'TM',
    'HMC', 'NSU', 'VWAGY', 'BMWYY', 'DDAIF', 'RACE', 'FCAU', 'STLA'
  ],
  'meme': [
    'GME', 'AMC', 'BB', 'NOK', 'SNDL', 'CLOV', 'WISH', 'SPCE', 'PLTR', 'SNOW',
    'CRWD', 'ZS', 'OKTA', 'DDOG', 'NET', 'MDB', 'WDAY', 'NOW', 'ADBE', 'CRM',
    'ORCL', 'INTU', 'ADSK', 'ANSS', 'CDNS', 'SNPS', 'CTXS', 'VMW', 'WDC', 'STX',
    'NTAP', 'HPE', 'DELL', 'HPQ', 'ACN', 'CTSH', 'FIS', 'FISV', 'GPN', 'JKHY',
    'PAYX', 'WU', 'IT', 'GLW', 'APH', 'TEL', 'JNPR', 'CIEN', 'ANET', 'ARW',
    'TDY', 'KEYS', 'SWKS', 'QRVO', 'MCHP', 'SLAB', 'ALGN', 'ISRG', 'ILMN', 'VRSK'
  ],
  'growth': [
    'PLTR', 'SNOW', 'CRWD', 'ZS', 'OKTA', 'DDOG', 'NET', 'MDB', 'WDAY', 'NOW',
    'ADBE', 'CRM', 'ORCL', 'INTU', 'ADSK', 'ANSS', 'CDNS', 'SNPS', 'CTXS', 'VMW',
    'WDC', 'STX', 'NTAP', 'HPE', 'DELL', 'HPQ', 'ACN', 'CTSH', 'FIS', 'FISV',
    'GPN', 'JKHY', 'PAYX', 'WU', 'IT', 'GLW', 'APH', 'TEL', 'JNPR', 'CIEN',
    'ANET', 'ARW', 'TDY', 'KEYS', 'SWKS', 'QRVO', 'MCHP', 'SLAB', 'ALGN', 'ISRG',
    'ILMN', 'VRSK'
  ],
  'international': [
    'ASML', 'TSM', 'BABA', 'JD', 'PDD', 'NIO', 'XPEV', 'LI', 'BIDU', 'NTES',
    'TME', 'WB', 'VIPS', 'YMM', 'ZTO', 'TAL', 'EDU', 'COE', 'IQ', 'HUYA',
    'DOYU', 'WB', 'VIPS', 'YMM', 'ZTO', 'TAL', 'EDU', 'COE', 'IQ', 'HUYA',
    'DOYU', 'WB', 'VIPS', 'YMM', 'ZTO', 'TAL', 'EDU', 'COE', 'IQ', 'HUYA'
  ]
}

// Cache file path
const CACHE_FILE = path.join(__dirname, 'stock-cache.json')
const CACHE_EXPIRY = 6 * 60 * 60 * 1000 // 6 hours

// Global stock cache
let stockCache: StockCache | null = null

/**
 * Load stock data from Yahoo Finance - NO MOCK DATA, ONLY REAL VALUES
 * Uses chart endpoint for ALL stocks since quote endpoint is blocked with 401 errors
 */
async function fetchStockData(symbol: string): Promise<Stock | null> {
  try {
    // First try the quote endpoint for detailed financial data
    const quoteUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`
    
    let detailedData = null
    try {
      const quoteResponse = await fetch(quoteUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })

      if (quoteResponse.ok) {
        const quoteData = await quoteResponse.json()
        if (quoteData.quoteResponse && quoteData.quoteResponse.result && quoteData.quoteResponse.result[0]) {
          detailedData = quoteData.quoteResponse.result[0]
        }
      }
    } catch (error) {
      console.log(`⚠️ Quote endpoint failed for ${symbol}, using chart endpoint`)
    }

    // Use chart endpoint for basic price data
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`
    
    const yahooResponse = await fetch(yahooUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    if (!yahooResponse.ok) {
      console.log(`⚠️ Yahoo Finance HTTP error for ${symbol}: ${yahooResponse.status}`)
      return null
    }

    const yahooData = await yahooResponse.json()
    
    if (yahooData.chart && yahooData.chart.result && yahooData.chart.result[0]) {
      const result = yahooData.chart.result[0]
      const meta = result.meta
      
      if (!meta || !meta.symbol) {
        return null
      }

      const regularMarketPrice = meta.regularMarketPrice || 0
      const previousClose = meta.previousClose || meta.chartPreviousClose || 0
      const change = regularMarketPrice - previousClose
      const changePercent = previousClose ? (change / previousClose) * 100 : 0

      // Check if this is a crypto symbol
      const isCrypto = symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('-USD') || 
                      symbol.includes('BNB') || symbol.includes('ADA') || symbol.includes('SOL') ||
                      symbol.includes('XRP') || symbol.includes('DOT') || symbol.includes('DOGE') ||
                      symbol.includes('AVAX') || symbol.includes('MATIC') || symbol.includes('LTC') ||
                      symbol.includes('UNI') || symbol.includes('LINK') || symbol.includes('ATOM') ||
                      symbol.includes('FTM') || symbol.includes('ALGO') || symbol.includes('VET') ||
                      symbol.includes('FIL') || symbol.includes('TRX') || symbol.includes('ICP')

      // Determine sector based on symbol patterns
      let sector = meta.sector || 'Unknown'
      if (sector === 'Unknown') {
        if (isCrypto) {
          sector = 'Cryptocurrency'
        } else if (symbol.includes('AAPL') || symbol.includes('MSFT') || symbol.includes('GOOGL') || symbol.includes('AMZN') || symbol.includes('META')) {
          sector = 'Technology'
        } else if (symbol.includes('JPM') || symbol.includes('BAC') || symbol.includes('WFC') || symbol.includes('GS')) {
          sector = 'Financial'
        } else if (symbol.includes('JNJ') || symbol.includes('PFE') || symbol.includes('UNH') || symbol.includes('ABBV')) {
          sector = 'Healthcare'
        } else if (symbol.includes('WMT') || symbol.includes('PG') || symbol.includes('KO') || symbol.includes('PEP')) {
          sector = 'Consumer'
        } else if (symbol.includes('XOM') || symbol.includes('CVX') || symbol.includes('COP')) {
          sector = 'Energy'
        } else if (symbol.includes('SO') || symbol.includes('DUK') || symbol.includes('NEE')) {
          sector = 'Utilities'
        } else {
          sector = 'Diversified'
        }
      }

      // Extract financial metrics from detailed data if available
      let pe = null
      let dividendYield = null
      let marketCap = null

      if (detailedData && !isCrypto) {
        pe = detailedData.trailingPE || detailedData.forwardPE || null
        dividendYield = detailedData.dividendYield || detailedData.trailingAnnualDividendYield || null
        marketCap = detailedData.marketCap || detailedData.regularMarketPrice * detailedData.sharesOutstanding || null
      }

      // If we still don't have market cap, try to estimate it
      if (!marketCap && !isCrypto && regularMarketPrice > 0) {
        // Try to get shares outstanding from the chart data
        const sharesOutstanding = meta.sharesOutstanding || null
        if (sharesOutstanding) {
          marketCap = regularMarketPrice * sharesOutstanding
        }
      }

      return {
        ticker: meta.symbol,
        name: meta.longName || meta.shortName || meta.symbol,
        sector: sector,
        price: regularMarketPrice,
        pe: pe,
        dividendYield: dividendYield,
        marketCap: marketCap,
        volume: meta.regularMarketVolume || 0,
        change: change,
        changePercent: changePercent,
        lastUpdated: new Date().toISOString()
      }
    }
    
    return null
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error)
    return null
  }
}

/**
 * Load multiple stocks in batches
 */
async function loadStocksInBatches(symbols: string[], batchSize: number = 5): Promise<Stock[]> {
  const stocks: Stock[] = []
  const batches: string[][] = []
  
  // Create batches
  for (let i = 0; i < symbols.length; i += batchSize) {
    batches.push(symbols.slice(i, i + batchSize))
  }

  console.log(`🔄 Loading ${symbols.length} stocks in ${batches.length} batches`)

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]
    console.log(`📦 Processing batch ${i + 1}/${batches.length}: ${batch.join(', ')}`)

    try {
      // Process batch in parallel
      const batchPromises = batch.map(symbol => fetchStockData(symbol))
      const batchResults = await Promise.allSettled(batchPromises)
      
      // Filter successful results
      const successfulStocks = batchResults
        .filter((result): result is PromiseFulfilledResult<Stock> => 
          result.status === 'fulfilled' && result.value !== null
        )
        .map(result => result.value)

      stocks.push(...successfulStocks)
      console.log(`✅ Batch ${i + 1} completed: ${successfulStocks.length}/${batch.length} stocks loaded`)

      // Delay between batches to respect rate limits
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000)) // 2 second delay
      }

    } catch (error) {
      console.error(`❌ Batch ${i + 1} failed:`, error)
      // Continue with next batch
    }
  }

  return stocks
}

/**
 * Load stock cache from file
 */
async function loadCache(): Promise<StockCache | null> {
  try {
    const data = await fs.readFile(CACHE_FILE, 'utf-8')
    const cache: StockCache = JSON.parse(data)
    
    // Check if cache is expired
    const cacheAge = Date.now() - new Date(cache.lastUpdated).getTime()
    if (cacheAge > CACHE_EXPIRY) {
      console.log('🗑️ Cache expired, will refresh')
      return null
    }
    
    console.log(`💾 Cache loaded: ${cache.stocks.length} stocks (age: ${Math.floor(cacheAge / (1000 * 60))} minutes)`)
    return cache
  } catch (error) {
    console.log('📁 No cache file found or error reading cache')
    return null
  }
}

/**
 * Save stock cache to file
 */
async function saveCache(stocks: Stock[]): Promise<void> {
  try {
    const cache: StockCache = {
      stocks,
      lastUpdated: new Date().toISOString(),
      totalStocks: stocks.length,
      version: '1.0'
    }
    
    await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2))
    console.log(`💾 Cache saved: ${stocks.length} stocks`)
  } catch (error) {
    console.error('❌ Failed to save cache:', error)
  }
}

/**
 * Initialize stock data (load from cache or fetch fresh)
 */
async function initializeStockData(): Promise<void> {
  console.log('🚀 Initializing comprehensive stock data...')
  console.log(`📊 Total symbols to load: ${STOCK_SYMBOLS.length}`)
  
  // Try to load from cache first
  stockCache = await loadCache()
  
  if (stockCache && stockCache.stocks.length > 0) {
    console.log(`✅ Using cached data: ${stockCache.stocks.length} stocks`)
    return
  }
  
  // Load fresh data
  console.log('🔄 Loading fresh comprehensive stock data...')
  const stocks = await loadStocksInBatches(STOCK_SYMBOLS, 5)
  
  if (stocks.length > 0) {
    stockCache = {
      stocks,
      lastUpdated: new Date().toISOString(),
      totalStocks: stocks.length,
      version: '1.0'
    }
    
    await saveCache(stocks)
    console.log(`🎉 Fresh data loaded: ${stocks.length} stocks`)
  } else {
    console.error('❌ Failed to load any stock data')
  }
}

// API Routes

/**
 * Get all stocks
 */
app.get('/api/stocks', async (req, res) => {
  try {
    if (!stockCache || stockCache.stocks.length === 0) {
      return res.status(503).json({ 
        error: 'Stock data not available', 
        message: 'Server is still loading stock data' 
      })
    }
    
    res.json({
      success: true,
      data: stockCache.stocks,
      meta: {
        total: stockCache.stocks.length,
        lastUpdated: stockCache.lastUpdated,
        version: stockCache.version
      }
    })
  } catch (error) {
    console.error('Error in /api/stocks:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * Get stock by ticker
 */
app.get('/api/stocks/:ticker', async (req, res) => {
  try {
    const ticker = req.params.ticker.toUpperCase()
    
    if (!stockCache || stockCache.stocks.length === 0) {
      return res.status(503).json({ 
        error: 'Stock data not available', 
        message: 'Server is still loading stock data' 
      })
    }
    
    const stock = stockCache.stocks.find(s => s.ticker === ticker)
    
    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' })
    }
    
    res.json({
      success: true,
      data: stock
    })
  } catch (error) {
    console.error('Error in /api/stocks/:ticker:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * Search stocks
 */
app.get('/api/stocks/search/:query', async (req, res) => {
  try {
    const query = req.params.query.toLowerCase()
    
    if (!stockCache || stockCache.stocks.length === 0) {
      return res.status(503).json({ 
        error: 'Stock data not available', 
        message: 'Server is still loading stock data' 
      })
    }
    
    const filteredStocks = stockCache.stocks.filter(stock => 
      stock.ticker.toLowerCase().includes(query) ||
      stock.name.toLowerCase().includes(query) ||
      stock.sector.toLowerCase().includes(query)
    )
    
    res.json({
      success: true,
      data: filteredStocks,
      meta: {
        total: filteredStocks.length,
        query: req.params.query
      }
    })
  } catch (error) {
    console.error('Error in /api/stocks/search/:query:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * Get stocks by category
 */
app.get('/api/stocks/category/:category', async (req, res) => {
  try {
    const category = req.params.category.toLowerCase()
    
    if (!stockCache || stockCache.stocks.length === 0) {
      return res.status(503).json({ 
        error: 'Stock data not available', 
        message: 'Server is still loading stock data' 
      })
    }
    
    if (!STOCK_CATEGORIES[category]) {
      return res.status(400).json({ 
        error: 'Invalid category',
        availableCategories: Object.keys(STOCK_CATEGORIES)
      })
    }
    
    const categorySymbols = STOCK_CATEGORIES[category]
    const categoryStocks = stockCache.stocks.filter(stock => 
      categorySymbols.includes(stock.ticker)
    )
    
    res.json({
      success: true,
      data: categoryStocks,
      meta: {
        total: categoryStocks.length,
        category: category,
        symbolsInCategory: categorySymbols.length
      }
    })
  } catch (error) {
    console.error('Error in /api/stocks/category/:category:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * Get available categories
 */
app.get('/api/categories', async (req, res) => {
  try {
    const categories = Object.keys(STOCK_CATEGORIES).map(key => ({
      id: key,
      name: key.toUpperCase(),
      symbolCount: STOCK_CATEGORIES[key].length,
      displayName: key === 'sp500' ? 'S&P 500' : 
                   key === 'nasdaq' ? 'NASDAQ 100' :
                   key === 'dow' ? 'Dow Jones' :
                   key === 'crypto' ? 'Crypto Stocks' :
                   key === 'ev' ? 'EV Stocks' :
                   key === 'meme' ? 'Meme Stocks' :
                   key === 'growth' ? 'Growth Stocks' :
                   key === 'international' ? 'International' :
                   key.charAt(0).toUpperCase() + key.slice(1)
    }))
    
    res.json({
      success: true,
      data: categories
    })
  } catch (error) {
    console.error('Error in /api/categories:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * Get server status
 */
app.get('/api/status', async (req, res) => {
  try {
    const isReady = stockCache && stockCache.stocks.length > 0
    
    res.json({
      success: true,
      data: {
        ready: isReady,
        stocksLoaded: stockCache?.stocks.length || 0,
        lastUpdated: stockCache?.lastUpdated || null,
        version: stockCache?.version || 'unknown',
        totalSymbols: STOCK_SYMBOLS.length
      }
    })
  } catch (error) {
    console.error('Error in /api/status:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * Refresh stock data
 */
app.post('/api/refresh', async (req, res) => {
  try {
    console.log('🔄 Manual refresh requested')
    
    // Load fresh data
    const stocks = await loadStocksInBatches(STOCK_SYMBOLS, 5)
    
    if (stocks.length > 0) {
      stockCache = {
        stocks,
        lastUpdated: new Date().toISOString(),
        totalStocks: stocks.length,
        version: '1.0'
      }
      
      await saveCache(stocks)
      
      res.json({
        success: true,
        message: `Refreshed ${stocks.length} stocks`,
        data: {
          stocksLoaded: stocks.length,
          lastUpdated: stockCache.lastUpdated
        }
      })
    } else {
      res.status(500).json({ error: 'Failed to refresh stock data' })
    }
  } catch (error) {
    console.error('Error in /api/refresh:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// Start server
async function startServer() {
  try {
    // Initialize stock data
    await initializeStockData()
    
    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`🚀 Comprehensive Stock API Server running on port ${PORT}`)
      console.log(`📊 Total symbols available: ${STOCK_SYMBOLS.length}`)
      console.log(`📊 Available endpoints:`)
      console.log(`   GET /api/stocks - Get all stocks`)
      console.log(`   GET /api/stocks/:ticker - Get specific stock`)
      console.log(`   GET /api/stocks/search/:query - Search stocks`)
      console.log(`   GET /api/stocks/category/:category - Get stocks by category`)
      console.log(`   GET /api/categories - Get available categories`)
      console.log(`   GET /api/status - Get server status`)
      console.log(`   POST /api/refresh - Refresh stock data`)
      console.log(`   GET /health - Health check`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...')
  process.exit(0)
})

// Start the server
startServer()
