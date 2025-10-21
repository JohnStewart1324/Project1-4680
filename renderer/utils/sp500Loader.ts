import { Stock } from './aiFilter'
import { getMultipleStocksData, convertToStock } from './stockDataService'

/**
 * S&P 500 Stock Loader - Focused on loading and storing the top 500 stocks
 * This replaces the previous complex loading systems with a streamlined approach
 */

// Complete S&P 500 stock symbols (as of 2024) - Deduplicated
const SP500_SYMBOLS_RAW = [
  // Technology (70+ stocks)
  'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'META', 'NVDA', 'TSLA', 'NFLX', 'AMD',
  'INTC', 'ORCL', 'CRM', 'ADBE', 'CSCO', 'IBM', 'QCOM', 'TXN', 'AVGO', 'MU',
  'AMAT', 'LRCX', 'KLAC', 'SNPS', 'CDNS', 'ANSS', 'INTU', 'ADSK', 'NOW', 'WDAY',
  'TEAM', 'MDB', 'DDOG', 'NET', 'ZS', 'OKTA', 'CRWD', 'FTNT', 'PANW', 'CHKP',
  'VRSN', 'AKAM', 'FFIV', 'CTXS', 'VMW', 'WDC', 'STX', 'NTAP', 'HPE', 'DELL',
  'HPQ', 'ACN', 'CTSH', 'FIS', 'FISV', 'GPN', 'JKHY', 'PAYX', 'WU',
  'IT', 'GLW', 'APH', 'TEL', 'JNPR', 'CIEN', 'ANET', 'ARW', 'TDY', 'KEYS',
  'SWKS', 'QRVO', 'MCHP', 'SLAB', 'ALGN', 'ISRG', 'ILMN', 'VRSK',

  // Financial Services (70+ stocks)
  'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'AXP', 'BLK', 'SPGI', 'V', 'MA',
  'PYPL', 'COF', 'USB', 'PNC', 'TFC', 'SCHW', 'CB', 'MMC', 'AON', 'ICE',
  'BRK.B', 'BK', 'STT', 'TROW', 'NTRS', 'FITB', 'RF', 'HBAN', 'CFG', 'KEY',
  'ZION', 'CMA', 'WAL', 'MTB', 'SNV', 'FHN', 'CFR', 'FNB', 'ASB', 'BOKF',
  'ONB', 'PNFP', 'TCBI', 'UMBF', 'WBS', 'WTFC', 'PBCT', 'SIVB', 'SBNY', 'FRC',
  'EWBC', 'CBSH', 'HOMB', 'UBSI', 'FFIN', 'IBOC', 'BKU', 'CATY', 'COLB', 'CVBF',
  'FULT', 'GBCI', 'HWC', 'INDB', 'LKFN', 'MBIN', 'NBTB', 'NWBI', 'OZK', 'PPBI',
  'SFNC', 'STBA', 'TBBK', 'UMPQ', 'VBTX', 'WAFD', 'WASH', 'WSBC',

  // Healthcare (60+ stocks)
  'JNJ', 'PFE', 'UNH', 'ABBV', 'MRK', 'TMO', 'ABT', 'DHR', 'BMY', 'AMGN',
  'GILD', 'BIIB', 'REGN', 'VRTX', 'MRNA', 'BNTX', 'ILMN', 'ISRG', 'SYK', 'MDT',
  'ZTS', 'LLY', 'CVS', 'CI', 'ANTM', 'HUM', 'AET', 'ESRX', 'PRGO', 'MYL',
  'TEVA', 'ZBH', 'BAX', 'BDX', 'BSX', 'EW', 'HCA', 'LH', 'PKI', 'TECH',
  'UHS', 'VAR', 'WAT', 'XRAY', 'DGX', 'HOLX', 'IDXX',
  'IQV', 'MOH', 'PENN', 'RMD', 'STE', 'TFX', 'WST',

  // Consumer Discretionary (60+ stocks)
  'HD', 'MCD', 'NKE', 'SBUX', 'BKNG', 'ABNB', 'EBAY', 'ETSY',
  'ROKU', 'ZM', 'PTON', 'DOCU', 'TGT', 'LOW', 'COST', 'TJX', 'MAR', 'HLT',
  'CHTR', 'CMCSA', 'DIS', 'VZ', 'T', 'TMUS', 'DISH', 'LUMN', 'FOX',
  'FOXA', 'NWSA', 'NWS', 'VIAC', 'VIACA', 'PARA', 'PARAA', 'LYFT', 'UBER', 'DASH',
  'SQ', 'SHOP', 'SIRI', 'PINS', 'SNAP', 'TWTR',
  'SPOT',

  // Consumer Staples (30+ stocks)
  'WMT', 'PG', 'KO', 'PEP', 'CL', 'KMB', 'GIS', 'K', 'HSY', 'CPB',
  'CAG', 'CHD', 'CLX', 'EL', 'FLO', 'HRL',
  'KHC', 'MDLZ', 'MNST', 'MKC', 'SJM', 'STZ', 'TSN',

  // Energy (30+ stocks)
  'XOM', 'CVX', 'COP', 'EOG', 'PXD', 'SLB', 'OXY', 'KMI', 'PSX', 'VLO',
  'MPC', 'HES', 'DVN', 'FANG', 'NOV', 'HAL', 'BKR', 'OKE', 'WMB', 'ET',
  'EPD', 'SRE', 'AEP', 'SO', 'DUK', 'EXC', 'XEL', 'PEG', 'ES',
  'NEE', 'WEC',

  // Industrial (50+ stocks)
  'BA', 'CAT', 'GE', 'HON', 'UPS', 'RTX', 'LMT', 'NOC', 'GD', 'TDG',
  'EMR', 'MMM', 'ITW', 'ETN', 'PH', 'CMI', 'DE', 'FDX', 'CSX', 'NSC',
  'UNP', 'KSU', 'JBHT', 'CHRW', 'EXPD', 'ODFL', 'LSTR', 'XPO', 'ZTO', 'YMM',
  'ARNC', 'BLL', 'CC', 'CFG', 'CTAS', 'DOV',
  'JCI',

  // Communication Services (20+ stocks)
  'GOOGL', 'GOOG', 'META', 'NFLX', 'DIS', 'CMCSA', 'VZ', 'T', 'CHTR', 'TMUS',
  'DISH', 'LUMN', 'FOX', 'FOXA', 'NWSA', 'NWS', 'VIAC', 'VIACA', 'PARA', 'PARAA',
  'SIRI', 'PINS', 'SNAP', 'TWTR', 'SPOT', 'LYFT', 'UBER', 'DASH', 'SQ', 'SHOP',

  // Utilities (30+ stocks)
  'NEE', 'DUK', 'SO', 'AEP', 'EXC', 'XEL', 'PEG', 'ES', 'SRE', 'WEC',
  'ED', 'EIX', 'PPL', 'ETR', 'AEE', 'FE', 'CNP', 'LNT', 'PNW',
  'AWK', 'CMS', 'DTE',

  // Real Estate (30+ stocks)
  'AMT', 'PLD', 'CCI', 'EQIX', 'PSA', 'SPG', 'O', 'WELL', 'EXR', 'AVB',
  'EQR', 'MAA', 'UDR', 'ESS', 'CPT', 'AIV', 'BXP', 'KIM', 'REG', 'SLG',
  'VTR', 'WY',

  // Materials (30+ stocks)
  'LIN', 'APD', 'SHW', 'FCX', 'NEM', 'ECL', 'DD', 'DOW', 'PPG', 'NUE',
  'IFF', 'LYB', 'EMN', 'FMC', 'MOS', 'CF', 'NTR', 'IP', 'PKG', 'WRK',
  'X', 'CLF', 'AA', 'SCCO', 'VALE', 'RIO', 'BHP', 'GOLD', 'ABX', 'AEM'
]

// Remove duplicates and export clean array
export const SP500_SYMBOLS = [...new Set(SP500_SYMBOLS_RAW)]

export interface StockCacheData {
  stocks: Stock[]
  timestamp: number
  version: string
  totalLoaded: number
  lastUpdate: string
}

export interface LoadingProgress {
  loaded: number
  total: number
  currentSymbol: string
  percentage: number
  estimatedTimeRemaining: number
  isFromCache: boolean
}

export class SP500Loader {
  private cacheKey = 'sp500_stock_cache'
  private maxCacheAge = 6 * 60 * 60 * 1000 // 6 hours
  private batchSize = 5 // Load 5 stocks at a time
  private delayBetweenBatches = 2000 // 2 seconds between batches
  private maxRetries = 3
  private retryDelay = 3000 // 3 seconds
  private isRunning = false
  private loadedStocks: Stock[] = []
  private processedSymbols = new Set<string>()
  private startTime = 0

  constructor() {
    this.loadFromCache()
  }

  /**
   * Load all S&P 500 stocks with progress tracking
   */
  async loadAllStocks(
    onProgress?: (progress: LoadingProgress) => void,
    onComplete?: (stocks: Stock[]) => void,
    onError?: (error: string) => void
  ): Promise<Stock[]> {
    this.isRunning = true
    this.startTime = Date.now()

    try {
      console.log('🚀 Starting S&P 500 stock loading...')
      console.log(`📊 Total symbols: ${SP500_SYMBOLS.length}`)
      console.log(`💾 Already loaded: ${this.loadedStocks.length}`)

      // Validate symbols array
      if (!SP500_SYMBOLS || SP500_SYMBOLS.length === 0) {
        throw new Error('No S&P 500 symbols available')
      }

      // Check if we have recent cache
      if (this.loadedStocks.length >= SP500_SYMBOLS.length * 0.9) {
        console.log('✅ Using cached data (90%+ complete)')
        const progress: LoadingProgress = {
          loaded: this.loadedStocks.length,
          total: SP500_SYMBOLS.length,
          currentSymbol: 'Cached',
          percentage: 100,
          estimatedTimeRemaining: 0,
          isFromCache: true
        }
        onProgress?.(progress)
        onComplete?.(this.loadedStocks)
        return this.loadedStocks
      }

      // Get remaining symbols to load
      const remainingSymbols = this.getRemainingSymbols()
      console.log(`🔄 Remaining symbols: ${remainingSymbols.length}`)

      if (remainingSymbols.length === 0) {
        console.log('✅ All stocks already loaded!')
        onComplete?.(this.loadedStocks)
        return this.loadedStocks
      }

      // Load remaining stocks in batches
      await this.loadStocksInBatches(remainingSymbols, onProgress)

      console.log(`🎉 S&P 500 loading completed! Loaded ${this.loadedStocks.length} stocks`)
      this.saveToCache()
      
      // Ensure we have valid stocks before calling onComplete
      if (this.loadedStocks && this.loadedStocks.length > 0) {
        onComplete?.(this.loadedStocks)
      } else {
        console.warn('⚠️ No stocks loaded, calling onComplete with empty array')
        onComplete?.([])
      }
      
      return this.loadedStocks

    } catch (error) {
      const errorMsg = `S&P 500 loading failed: ${error instanceof Error ? error.message : String(error)}`
      console.error('❌', errorMsg)
      onError?.(errorMsg)
      
      // Return whatever stocks we have loaded so far
      return this.loadedStocks
    } finally {
      this.isRunning = false
    }
  }

  /**
   * Load stocks in batches with progress tracking
   */
  private async loadStocksInBatches(
    symbols: string[],
    onProgress?: (progress: LoadingProgress) => void
  ): Promise<void> {
    const batches = this.createBatches(symbols, this.batchSize)
    let totalProcessed = 0

    for (let i = 0; i < batches.length && this.isRunning; i++) {
      const batch = batches[i]
      console.log(`📦 Batch ${i + 1}/${batches.length}: ${batch.join(', ')}`)

      try {
        const batchStocks = await this.loadBatchWithRetry(batch)
        
        if (batchStocks && batchStocks.length > 0) {
          this.loadedStocks.push(...batchStocks)
          batch.forEach(symbol => this.processedSymbols.add(symbol))
          totalProcessed += batchStocks.length

          // Update progress
          const elapsed = Date.now() - this.startTime
          const rate = totalProcessed / (elapsed / 1000) // stocks per second
          const remaining = SP500_SYMBOLS.length - this.loadedStocks.length
          const estimatedTimeRemaining = remaining / rate

          const progress: LoadingProgress = {
            loaded: this.loadedStocks.length,
            total: SP500_SYMBOLS.length,
            currentSymbol: batch[batch.length - 1],
            percentage: Math.round((this.loadedStocks.length / SP500_SYMBOLS.length) * 100),
            estimatedTimeRemaining: Math.round(estimatedTimeRemaining),
            isFromCache: false
          }

          onProgress?.(progress)
          console.log(`✅ Loaded ${batchStocks.length} stocks (${progress.percentage}% complete)`)
        }

        // Delay between batches
        if (i < batches.length - 1 && this.isRunning) {
          await this.delay(this.delayBetweenBatches)
        }

      } catch (error) {
        console.error(`❌ Batch ${i + 1} failed:`, error)
        // Mark symbols as processed even if failed to avoid infinite retry
        batch.forEach(symbol => this.processedSymbols.add(symbol))
        
        // Continue with next batch
        if (i < batches.length - 1) {
          await this.delay(this.delayBetweenBatches)
        }
      }
    }
  }

  /**
   * Load a single batch with retry logic
   */
  private async loadBatchWithRetry(symbols: string[]): Promise<Stock[]> {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${this.maxRetries} for batch: ${symbols.join(', ')}`)
        const realData = await getMultipleStocksData(symbols)
        
        if (realData && realData.length > 0) {
          const stocks = realData.map(convertToStock).filter(stock => stock && stock.ticker)
          console.log(`✅ Successfully converted ${stocks.length} stocks from ${realData.length} raw data items`)
          return stocks
        } else {
          throw new Error('No data returned from API')
        }
      } catch (error) {
        console.warn(`⚠️ Attempt ${attempt} failed:`, error)
        
        if (attempt < this.maxRetries) {
          const backoffDelay = this.retryDelay * attempt
          console.log(`⏳ Retrying in ${backoffDelay}ms...`)
          await this.delay(backoffDelay)
        } else {
          console.error(`❌ Max retries exceeded for batch: ${symbols.join(', ')}`)
          // Return empty array instead of throwing to continue processing
          return []
        }
      }
    }
    
    return []
  }

  /**
   * Create batches from symbols
   */
  private createBatches(symbols: string[], batchSize: number): string[][] {
    const batches: string[][] = []
    for (let i = 0; i < symbols.length; i += batchSize) {
      batches.push(symbols.slice(i, i + batchSize))
    }
    return batches
  }

  /**
   * Get symbols that haven't been processed yet
   */
  private getRemainingSymbols(): string[] {
    return SP500_SYMBOLS.filter(symbol => !this.processedSymbols.has(symbol))
  }

  /**
   * Save stocks to cache
   */
  private saveToCache(): void {
    try {
      const cacheData: StockCacheData = {
        stocks: this.loadedStocks,
        timestamp: Date.now(),
        version: '2.0',
        totalLoaded: this.loadedStocks.length,
        lastUpdate: new Date().toISOString()
      }
      localStorage.setItem(this.cacheKey, JSON.stringify(cacheData))
      console.log(`💾 Cache saved: ${this.loadedStocks.length} stocks`)
    } catch (error) {
      console.warn('⚠️ Failed to save cache:', error)
    }
  }

  /**
   * Load stocks from cache
   */
  private loadFromCache(): void {
    try {
      const cached = localStorage.getItem(this.cacheKey)
      if (!cached) return

      const cacheData: StockCacheData = JSON.parse(cached)
      const isExpired = Date.now() - cacheData.timestamp > this.maxCacheAge
      
      if (isExpired) {
        console.log('🗑️ Cache expired, clearing...')
        localStorage.removeItem(this.cacheKey)
        return
      }

      this.loadedStocks = cacheData.stocks || []
      this.processedSymbols = new Set(this.loadedStocks.map(stock => stock.ticker))
      console.log(`💾 Cache loaded: ${this.loadedStocks.length} stocks`)
    } catch (error) {
      console.warn('⚠️ Failed to load cache:', error)
      this.loadedStocks = []
      this.processedSymbols = new Set()
    }
  }

  /**
   * Get cache information
   */
  getCacheInfo(): { count: number; age: number; isExpired: boolean; lastUpdate: string } {
    try {
      const cached = localStorage.getItem(this.cacheKey)
      if (!cached) return { count: 0, age: 0, isExpired: true, lastUpdate: '' }

      const cacheData: StockCacheData = JSON.parse(cached)
      const age = Date.now() - cacheData.timestamp
      const isExpired = age > this.maxCacheAge

      return {
        count: cacheData.stocks?.length || 0,
        age: Math.floor(age / (1000 * 60)), // age in minutes
        isExpired,
        lastUpdate: cacheData.lastUpdate || ''
      }
    } catch (error) {
      return { count: 0, age: 0, isExpired: true, lastUpdate: '' }
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    localStorage.removeItem(this.cacheKey)
    this.loadedStocks = []
    this.processedSymbols = new Set()
    console.log('🗑️ S&P 500 cache cleared')
  }

  /**
   * Stop loading
   */
  stop(): void {
    this.isRunning = false
    console.log('🛑 S&P 500 loading stopped')
  }

  /**
   * Get currently loaded stocks
   */
  getLoadedStocks(): Stock[] {
    return [...this.loadedStocks]
  }

  /**
   * Check if loading is in progress
   */
  isLoading(): boolean {
    return this.isRunning
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Export singleton instance
export const sp500Loader = new SP500Loader()
