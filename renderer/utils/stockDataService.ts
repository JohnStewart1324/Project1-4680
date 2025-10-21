import { Stock } from './aiFilter'

// Real stock data interface
export interface RealStockData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap?: number
  pe?: number
  dividendYield?: number
  sector?: string
  timestamp: number
}

// Historical data for charts
export interface HistoricalData {
  date: string
  price: number
  volume: number
  high: number
  low: number
  open: number
  close: number
}

/**
 * Get real-time stock data using Electron IPC (CORS-free)
 */
export async function getYahooStockData(symbol: string): Promise<RealStockData | null> {
  try {
    // Check if we're in Electron environment
    if (typeof window !== 'undefined' && window.electronAPI) {
      const data = await window.electronAPI.fetchYahooData(symbol)
      
      if (data.chart && data.chart.result && data.chart.result[0]) {
        const result = data.chart.result[0]
        const meta = result.meta
        const quote = result.indicators.quote[0]
        
        return {
          symbol: meta.symbol,
          name: meta.longName || symbol,
          price: meta.regularMarketPrice,
          change: meta.regularMarketPrice - meta.previousClose,
          changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
          volume: meta.regularMarketVolume,
          marketCap: meta.marketCap,
          pe: meta.trailingPE,
          dividendYield: meta.dividendYield,
          sector: meta.sector,
          timestamp: Date.now()
        }
      }
    }
    
    // Fallback to direct fetch (may fail due to CORS)
    console.warn('Electron API not available, falling back to direct fetch (may fail due to CORS)')
    return await getYahooStockDataDirect(symbol)
  } catch (error) {
    console.error('Error fetching Yahoo data:', error)
    return null
  }
}

/**
 * Direct fetch fallback (may fail due to CORS in browser)
 */
async function getYahooStockDataDirect(symbol: string): Promise<RealStockData | null> {
  try {
    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`)
    const data = await response.json()
    
    if (data.chart && data.chart.result && data.chart.result[0]) {
      const result = data.chart.result[0]
      const meta = result.meta
      const quote = result.indicators.quote[0]
      
      return {
        symbol: meta.symbol,
        name: meta.longName || symbol,
        price: meta.regularMarketPrice,
        change: meta.regularMarketPrice - meta.previousClose,
        changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
        volume: meta.regularMarketVolume,
        marketCap: meta.marketCap,
        pe: meta.trailingPE,
        dividendYield: meta.dividendYield,
        sector: meta.sector,
        timestamp: Date.now()
      }
    }
    return null
  } catch (error) {
    console.error('Error in direct fetch:', error)
    return null
  }
}

/**
 * Get historical data for charts using Electron IPC
 */
export async function getHistoricalData(symbol: string, period: string = '1mo'): Promise<HistoricalData[]> {
  try {
    // Check if we're in Electron environment
    if (typeof window !== 'undefined' && window.electronAPI) {
      const data = await window.electronAPI.fetchHistoricalData(symbol, period)
      
      if (data.chart && data.chart.result && data.chart.result[0]) {
        const result = data.chart.result[0]
        const timestamps = result.timestamp
        const quotes = result.indicators.quote[0]
        
        return timestamps.map((timestamp: number, index: number) => ({
          date: new Date(timestamp * 1000).toISOString().split('T')[0],
          price: quotes.close[index] || quotes.open[index] || 0,
          volume: quotes.volume[index] || 0,
          high: quotes.high[index] || 0,
          low: quotes.low[index] || 0,
          open: quotes.open[index] || 0,
          close: quotes.close[index] || 0
        })).filter((item: HistoricalData) => item.price > 0)
      }
    }
    
    // Fallback to direct fetch
    return await getHistoricalDataDirect(symbol, period)
  } catch (error) {
    console.error('Error fetching historical data:', error)
    return []
  }
}

/**
 * Direct fetch fallback for historical data
 */
async function getHistoricalDataDirect(symbol: string, period: string): Promise<HistoricalData[]> {
  try {
    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${period}&interval=1d`)
    const data = await response.json()
    
    if (data.chart && data.chart.result && data.chart.result[0]) {
      const result = data.chart.result[0]
      const timestamps = result.timestamp
      const quotes = result.indicators.quote[0]
      
      return timestamps.map((timestamp: number, index: number) => ({
        date: new Date(timestamp * 1000).toISOString().split('T')[0],
        price: quotes.close[index] || quotes.open[index] || 0,
        volume: quotes.volume[index] || 0,
        high: quotes.high[index] || 0,
        low: quotes.low[index] || 0,
        open: quotes.open[index] || 0,
        close: quotes.close[index] || 0
      })).filter((item: HistoricalData) => item.price > 0)
    }
    return []
  } catch (error) {
    console.error('Error in direct historical fetch:', error)
    return []
  }
}

/**
 * Get multiple stocks data in parallel using Electron IPC
 */
export async function getMultipleStocksData(symbols: string[]): Promise<RealStockData[]> {
  try {
    // Validate input
    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      console.warn('Invalid symbols array provided to getMultipleStocksData')
      return []
    }

    // Check if we're in Electron environment
    if (typeof window !== 'undefined' && window.electronAPI) {
      const results = await window.electronAPI.fetchMultipleStocks(symbols)
      
      if (!results || !Array.isArray(results)) {
        console.warn('Invalid results from Electron API')
        return []
      }
      
      return results
        .filter(result => result && result.success && result.data)
        .map(result => {
          try {
            const data = result.data
            if (data.chart && data.chart.result && data.chart.result[0]) {
              const chartResult = data.chart.result[0]
              const meta = chartResult.meta
              
              if (!meta || !meta.symbol) {
                console.warn('Invalid meta data for symbol:', result.symbol)
                return null
              }
              
              return {
                symbol: meta.symbol,
                name: meta.longName || result.symbol,
                price: meta.regularMarketPrice || 0,
                change: (meta.regularMarketPrice || 0) - (meta.previousClose || 0),
                changePercent: meta.previousClose ? 
                  (((meta.regularMarketPrice || 0) - meta.previousClose) / meta.previousClose) * 100 : 0,
                volume: meta.regularMarketVolume || 0,
                marketCap: meta.marketCap || 0,
                pe: meta.trailingPE || 0,
                dividendYield: meta.dividendYield || 0,
                sector: meta.sector || 'Unknown',
                timestamp: Date.now()
              }
            }
            return null
          } catch (error) {
            console.error('Error processing stock data for symbol:', result.symbol, error)
            return null
          }
        })
        .filter((item): item is RealStockData => item !== null)
    }
    
    // Fallback to individual requests
    console.warn('Electron API not available, falling back to individual requests')
    const promises = symbols.map(symbol => getYahooStockData(symbol))
    const results = await Promise.allSettled(promises)
    
    return results
      .filter((result): result is PromiseFulfilledResult<RealStockData> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value)
  } catch (error) {
    console.error('Error fetching multiple stocks:', error)
    return []
  }
}

/**
 * Convert real stock data to our Stock interface
 */
export function convertToStock(realData: RealStockData): Stock {
  try {
    // Validate required fields
    if (!realData || !realData.symbol) {
      throw new Error('Invalid stock data: missing symbol')
    }

    return {
      ticker: realData.symbol,
      name: realData.name || realData.symbol,
      sector: realData.sector || 'Unknown',
      price: typeof realData.price === 'number' ? realData.price : 0,
      pe: typeof realData.pe === 'number' ? realData.pe : 0,
      dividendYield: typeof realData.dividendYield === 'number' ? realData.dividendYield : 0,
      marketCap: typeof realData.marketCap === 'number' ? realData.marketCap : 0,
      volume: typeof realData.volume === 'number' ? realData.volume : 0,
      change: typeof realData.change === 'number' ? realData.change : 0,
      changePercent: typeof realData.changePercent === 'number' ? realData.changePercent : 0
    }
  } catch (error) {
    console.error('Error converting stock data:', error, realData)
    // Return a safe default stock object
    return {
      ticker: realData?.symbol || 'UNKNOWN',
      name: realData?.name || 'Unknown Company',
      sector: 'Unknown',
      price: 0,
      pe: 0,
      dividendYield: 0,
      marketCap: 0,
      volume: 0,
      change: 0,
      changePercent: 0
    }
  }
}

/**
 * Get real stock data with fallback to mock data
 */
export async function getStockDataWithFallback(symbols: string[]): Promise<Stock[]> {
  try {
    // Try to get real data first
    const realData = await getMultipleStocksData(symbols)
    
    if (realData.length > 0) {
      console.log(`✅ Fetched real data for ${realData.length} stocks`)
      return realData.map(convertToStock)
    }
    
    // Fallback to mock data
    console.log('⚠️ Using mock data as fallback')
    return getMockStockData()
  } catch (error) {
    console.error('Error fetching stock data:', error)
    console.log('⚠️ Using mock data as fallback')
    return getMockStockData()
  }
}

/**
 * Mock data fallback (comprehensive stock list)
 */
function getMockStockData(): Stock[] {
  return [
    // Technology Giants
    { ticker: "AAPL", name: "Apple Inc.", sector: "Technology", price: 178.2, pe: 28.5, dividendYield: 0.6, marketCap: 2800000000000, volume: 45000000, change: 2.1, changePercent: 1.19 },
    { ticker: "MSFT", name: "Microsoft Corporation", sector: "Technology", price: 378.9, pe: 32.1, dividendYield: 0.7, marketCap: 2800000000000, volume: 25000000, change: 4.2, changePercent: 1.12 },
    { ticker: "GOOGL", name: "Alphabet Inc.", sector: "Technology", price: 142.5, pe: 25.8, dividendYield: 0.0, marketCap: 1800000000000, volume: 20000000, change: -1.2, changePercent: -0.84 },
    { ticker: "AMZN", name: "Amazon.com Inc.", sector: "Consumer Discretionary", price: 145.8, pe: 45.2, dividendYield: 0.0, marketCap: 1500000000000, volume: 30000000, change: 2.3, changePercent: 1.60 },
    { ticker: "META", name: "Meta Platforms Inc.", sector: "Technology", price: 320.4, pe: 24.3, dividendYield: 0.0, marketCap: 850000000000, volume: 18000000, change: 5.2, changePercent: 1.65 },
    { ticker: "NVDA", name: "NVIDIA Corporation", sector: "Technology", price: 485.2, pe: 65.4, dividendYield: 0.1, marketCap: 1200000000000, volume: 35000000, change: 12.5, changePercent: 2.64 },
    { ticker: "TSLA", name: "Tesla Inc.", sector: "Consumer Discretionary", price: 245.6, pe: 65.4, dividendYield: 0.0, marketCap: 780000000000, volume: 50000000, change: -5.2, changePercent: -2.07 },
    { ticker: "NFLX", name: "Netflix Inc.", sector: "Communication Services", price: 485.2, pe: 35.2, dividendYield: 0.0, marketCap: 220000000000, volume: 15000000, change: 8.3, changePercent: 1.74 },
    { ticker: "AMD", name: "Advanced Micro Devices", sector: "Technology", price: 125.8, pe: 28.9, dividendYield: 0.0, marketCap: 200000000000, volume: 40000000, change: 3.2, changePercent: 2.61 },
    { ticker: "INTC", name: "Intel Corporation", sector: "Technology", price: 42.1, pe: 15.8, dividendYield: 2.1, marketCap: 175000000000, volume: 25000000, change: -0.8, changePercent: -1.87 },
    
    // Financial Sector
    { ticker: "JPM", name: "JPMorgan Chase & Co.", sector: "Financial", price: 142.5, pe: 9.8, dividendYield: 2.8, marketCap: 420000000000, volume: 18000000, change: 2.3, changePercent: 1.64 },
    { ticker: "BAC", name: "Bank of America Corp.", sector: "Financial", price: 32.8, pe: 11.2, dividendYield: 3.1, marketCap: 260000000000, volume: 35000000, change: 0.5, changePercent: 1.55 },
    { ticker: "WFC", name: "Wells Fargo & Company", sector: "Financial", price: 45.2, pe: 12.5, dividendYield: 2.9, marketCap: 160000000000, volume: 22000000, change: -0.3, changePercent: -0.66 },
    { ticker: "GS", name: "Goldman Sachs Group Inc.", sector: "Financial", price: 385.4, pe: 8.9, dividendYield: 2.2, marketCap: 130000000000, volume: 8000000, change: 4.1, changePercent: 1.08 },
    { ticker: "V", name: "Visa Inc.", sector: "Financial", price: 245.8, pe: 35.2, dividendYield: 0.8, marketCap: 520000000000, volume: 7000000, change: 3.1, changePercent: 1.28 },
    { ticker: "MA", name: "Mastercard Inc.", sector: "Financial", price: 425.6, pe: 38.9, dividendYield: 0.6, marketCap: 400000000000, volume: 5000000, change: 2.8, changePercent: 0.66 },
    
    // Healthcare & Biotech
    { ticker: "JNJ", name: "Johnson & Johnson", sector: "Healthcare", price: 158.3, pe: 15.8, dividendYield: 2.9, marketCap: 420000000000, volume: 8000000, change: -0.8, changePercent: -0.50 },
    { ticker: "PFE", name: "Pfizer Inc.", sector: "Healthcare", price: 28.9, pe: 12.3, dividendYield: 4.2, marketCap: 160000000000, volume: 45000000, change: 0.4, changePercent: 1.40 },
    { ticker: "UNH", name: "UnitedHealth Group Inc.", sector: "Healthcare", price: 485.2, pe: 24.6, dividendYield: 1.4, marketCap: 450000000000, volume: 3000000, change: 2.1, changePercent: 0.43 },
    { ticker: "ABBV", name: "AbbVie Inc.", sector: "Healthcare", price: 145.8, pe: 18.9, dividendYield: 4.1, marketCap: 260000000000, volume: 12000000, change: 1.2, changePercent: 0.83 },
    { ticker: "MRK", name: "Merck & Co. Inc.", sector: "Healthcare", price: 112.4, pe: 14.2, dividendYield: 2.8, marketCap: 285000000000, volume: 15000000, change: -0.6, changePercent: -0.53 },
    
    // Consumer & Retail
    { ticker: "WMT", name: "Walmart Inc.", sector: "Consumer Staples", price: 165.4, pe: 26.8, dividendYield: 1.4, marketCap: 530000000000, volume: 9000000, change: -0.9, changePercent: -0.54 },
    { ticker: "HD", name: "Home Depot Inc.", sector: "Consumer Discretionary", price: 312.5, pe: 19.2, dividendYield: 2.1, marketCap: 320000000000, volume: 4000000, change: 1.8, changePercent: 0.58 },
    { ticker: "PG", name: "Procter & Gamble Co.", sector: "Consumer Staples", price: 152.7, pe: 24.6, dividendYield: 2.4, marketCap: 360000000000, volume: 6000000, change: 1.1, changePercent: 0.73 },
    { ticker: "KO", name: "Coca-Cola Company", sector: "Consumer Staples", price: 59.8, pe: 22.3, dividendYield: 3.2, marketCap: 260000000000, volume: 15000000, change: 0.5, changePercent: 0.84 },
    { ticker: "PEP", name: "PepsiCo Inc.", sector: "Consumer Staples", price: 168.9, pe: 25.4, dividendYield: 2.8, marketCap: 230000000000, volume: 8000000, change: 0.8, changePercent: 0.48 },
    { ticker: "NKE", name: "Nike Inc.", sector: "Consumer Discretionary", price: 95.2, pe: 28.9, dividendYield: 1.2, marketCap: 150000000000, volume: 12000000, change: 2.1, changePercent: 2.26 },
    { ticker: "MCD", name: "McDonald's Corporation", sector: "Consumer Discretionary", price: 285.6, pe: 24.8, dividendYield: 2.1, marketCap: 210000000000, volume: 3000000, change: 1.4, changePercent: 0.49 },
    { ticker: "SBUX", name: "Starbucks Corporation", sector: "Consumer Discretionary", price: 98.7, pe: 26.3, dividendYield: 2.3, marketCap: 115000000000, volume: 7000000, change: -0.5, changePercent: -0.50 },
    
    // Energy & Utilities
    { ticker: "XOM", name: "ExxonMobil Corporation", sector: "Energy", price: 115.4, pe: 11.2, dividendYield: 4.1, marketCap: 480000000000, volume: 12000000, change: -1.2, changePercent: -1.03 },
    { ticker: "CVX", name: "Chevron Corporation", sector: "Energy", price: 148.7, pe: 12.5, dividendYield: 3.8, marketCap: 280000000000, volume: 11000000, change: -2.1, changePercent: -1.39 },
    { ticker: "COP", name: "ConocoPhillips", sector: "Energy", price: 125.8, pe: 10.8, dividendYield: 2.9, marketCap: 150000000000, volume: 8000000, change: 1.2, changePercent: 0.96 },
    { ticker: "NEE", name: "NextEra Energy Inc.", sector: "Utilities", price: 78.9, pe: 18.2, dividendYield: 2.8, marketCap: 160000000000, volume: 5000000, change: 0.3, changePercent: 0.38 },
    
    // Industrial & Aerospace
    { ticker: "BA", name: "Boeing Company", sector: "Industrial", price: 245.8, pe: 0, dividendYield: 0.0, marketCap: 150000000000, volume: 18000000, change: 3.2, changePercent: 1.32 },
    { ticker: "CAT", name: "Caterpillar Inc.", sector: "Industrial", price: 285.6, pe: 15.8, dividendYield: 2.1, marketCap: 160000000000, volume: 4000000, change: 2.1, changePercent: 0.74 },
    { ticker: "GE", name: "General Electric Company", sector: "Industrial", price: 125.4, pe: 18.9, dividendYield: 0.4, marketCap: 140000000000, volume: 15000000, change: 1.8, changePercent: 1.46 },
    { ticker: "HON", name: "Honeywell International Inc.", sector: "Industrial", price: 198.7, pe: 22.4, dividendYield: 2.0, marketCap: 130000000000, volume: 3000000, change: 0.9, changePercent: 0.45 },
    
    // Communication & Media
    { ticker: "VZ", name: "Verizon Communications Inc.", sector: "Communication Services", price: 38.9, pe: 8.2, dividendYield: 6.8, marketCap: 165000000000, volume: 20000000, change: -0.2, changePercent: -0.51 },
    { ticker: "T", name: "AT&T Inc.", sector: "Communication Services", price: 16.8, pe: 9.1, dividendYield: 7.1, marketCap: 120000000000, volume: 35000000, change: 0.1, changePercent: 0.60 },
    { ticker: "DIS", name: "Walt Disney Company", sector: "Communication Services", price: 95.2, pe: 18.9, dividendYield: 0.0, marketCap: 175000000000, volume: 12000000, change: 1.8, changePercent: 1.93 },
    { ticker: "CMCSA", name: "Comcast Corporation", sector: "Communication Services", price: 42.8, pe: 12.6, dividendYield: 2.8, marketCap: 180000000000, volume: 15000000, change: 0.3, changePercent: 0.71 }
  ]
}