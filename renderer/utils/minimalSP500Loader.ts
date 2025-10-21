import { Stock } from './aiFilter'
import { getMultipleStocksData, convertToStock } from './stockDataService'

/**
 * Minimal S&P 500 Stock Loader - Ultra-safe version
 * This version prioritizes stability over features
 */

// Minimal S&P 500 symbols (top 50 most important stocks)
const MINIMAL_SP500_SYMBOLS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'NFLX', 'AMD', 'INTC',
  'JPM', 'BAC', 'WFC', 'GS', 'V', 'MA', 'JNJ', 'PFE', 'UNH', 'ABBV',
  'WMT', 'HD', 'PG', 'KO', 'PEP', 'NKE', 'MCD', 'SBUX', 'TGT', 'LOW',
  'XOM', 'CVX', 'COP', 'BA', 'CAT', 'GE', 'HON', 'VZ', 'T', 'DIS',
  'NEE', 'DUK', 'SO', 'AEP', 'EXC', 'XEL', 'PEG', 'ES', 'SRE', 'WEC'
]

export interface MinimalLoadingProgress {
  loaded: number
  total: number
  currentSymbol: string
  percentage: number
  isFromCache: boolean
}

export class MinimalSP500Loader {
  private cacheKey = 'minimal_sp500_cache'
  private maxCacheAge = 6 * 60 * 60 * 1000 // 6 hours
  private batchSize = 3 // Very small batches
  private delayBetweenBatches = 3000 // 3 seconds
  private maxRetries = 2
  private retryDelay = 5000 // 5 seconds
  private isRunning = false
  private loadedStocks: Stock[] = []
  private processedSymbols = new Set<string>()
  private startTime = 0

  constructor() {
    this.loadFromCache()
  }

  /**
   * Load minimal S&P 500 stocks with maximum safety
   */
  async loadAllStocks(
    onProgress?: (progress: MinimalLoadingProgress) => void,
    onComplete?: (stocks: Stock[]) => void,
    onError?: (error: string) => void
  ): Promise<Stock[]> {
    this.isRunning = true
    this.startTime = Date.now()

    try {
      console.log('🚀 Starting MINIMAL S&P 500 stock loading...')
      console.log(`📊 Total symbols: ${MINIMAL_SP500_SYMBOLS.length}`)
      console.log(`💾 Already loaded: ${this.loadedStocks.length}`)

      // Check if we have recent cache
      if (this.loadedStocks.length >= MINIMAL_SP500_SYMBOLS.length * 0.8) {
        console.log('✅ Using cached data (80%+ complete)')
        const progress: MinimalLoadingProgress = {
          loaded: this.loadedStocks.length,
          total: MINIMAL_SP500_SYMBOLS.length,
          currentSymbol: 'Cached',
          percentage: 100,
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

      // Load remaining stocks in very small batches
      await this.loadStocksSafely(remainingSymbols, onProgress)

      console.log(`🎉 MINIMAL S&P 500 loading completed! Loaded ${this.loadedStocks.length} stocks`)
      this.saveToCache()
      
      // Always call onComplete with whatever we have
      onComplete?.(this.loadedStocks)
      return this.loadedStocks

    } catch (error) {
      const errorMsg = `Minimal S&P 500 loading failed: ${error instanceof Error ? error.message : String(error)}`
      console.error('❌', errorMsg)
      onError?.(errorMsg)
      
      // Return whatever stocks we have loaded so far
      onComplete?.(this.loadedStocks)
      return this.loadedStocks
    } finally {
      this.isRunning = false
    }
  }

  /**
   * Load stocks with maximum safety
   */
  private async loadStocksSafely(
    symbols: string[],
    onProgress?: (progress: MinimalLoadingProgress) => void
  ): Promise<void> {
    const batches = this.createBatches(symbols, this.batchSize)
    let totalProcessed = 0

    for (let i = 0; i < batches.length && this.isRunning; i++) {
      const batch = batches[i]
      console.log(`📦 Safe Batch ${i + 1}/${batches.length}: ${batch.join(', ')}`)

      try {
        const batchStocks = await this.loadBatchSafely(batch)
        
        if (batchStocks && batchStocks.length > 0) {
          this.loadedStocks.push(...batchStocks)
          batch.forEach(symbol => this.processedSymbols.add(symbol))
          totalProcessed += batchStocks.length

          const progress: MinimalLoadingProgress = {
            loaded: this.loadedStocks.length,
            total: MINIMAL_SP500_SYMBOLS.length,
            currentSymbol: batch[batch.length - 1],
            percentage: Math.round((this.loadedStocks.length / MINIMAL_SP500_SYMBOLS.length) * 100),
            isFromCache: false
          }

          onProgress?.(progress)
          console.log(`✅ Safely loaded ${batchStocks.length} stocks (${progress.percentage}% complete)`)
        }

        // Longer delay between batches for safety
        if (i < batches.length - 1 && this.isRunning) {
          await this.delay(this.delayBetweenBatches)
        }

      } catch (error) {
        console.error(`❌ Safe batch ${i + 1} failed:`, error)
        // Mark symbols as processed even if failed
        batch.forEach(symbol => this.processedSymbols.add(symbol))
        
        // Continue with next batch
        if (i < batches.length - 1) {
          await this.delay(this.delayBetweenBatches)
        }
      }
    }
  }

  /**
   * Load a single batch with maximum safety
   */
  private async loadBatchSafely(symbols: string[]): Promise<Stock[]> {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔄 Safe attempt ${attempt}/${this.maxRetries} for batch: ${symbols.join(', ')}`)
        
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Batch timeout')), 15000) // 15 second timeout
        })
        
        const dataPromise = getMultipleStocksData(symbols)
        const realData = await Promise.race([dataPromise, timeoutPromise])
        
        if (realData && realData.length > 0) {
          const stocks = realData
            .map(convertToStock)
            .filter(stock => stock && stock.ticker && stock.ticker !== 'UNKNOWN')
          
          console.log(`✅ Safely converted ${stocks.length} stocks from ${realData.length} raw data items`)
          return stocks
        } else {
          throw new Error('No data returned from API')
        }
      } catch (error) {
        console.warn(`⚠️ Safe attempt ${attempt} failed:`, error)
        
        if (attempt < this.maxRetries) {
          const backoffDelay = this.retryDelay * attempt
          console.log(`⏳ Safe retry in ${backoffDelay}ms...`)
          await this.delay(backoffDelay)
        } else {
          console.error(`❌ Safe max retries exceeded for batch: ${symbols.join(', ')}`)
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
    return MINIMAL_SP500_SYMBOLS.filter(symbol => !this.processedSymbols.has(symbol))
  }

  /**
   * Save stocks to cache
   */
  private saveToCache(): void {
    try {
      const cacheData = {
        stocks: this.loadedStocks,
        timestamp: Date.now(),
        version: 'minimal-1.0',
        totalLoaded: this.loadedStocks.length,
        lastUpdate: new Date().toISOString()
      }
      localStorage.setItem(this.cacheKey, JSON.stringify(cacheData))
      console.log(`💾 Safe cache saved: ${this.loadedStocks.length} stocks`)
    } catch (error) {
      console.warn('⚠️ Failed to save safe cache:', error)
    }
  }

  /**
   * Load stocks from cache
   */
  private loadFromCache(): void {
    try {
      const cached = localStorage.getItem(this.cacheKey)
      if (!cached) return

      const cacheData = JSON.parse(cached)
      const isExpired = Date.now() - cacheData.timestamp > this.maxCacheAge
      
      if (isExpired) {
        console.log('🗑️ Safe cache expired, clearing...')
        localStorage.removeItem(this.cacheKey)
        return
      }

      this.loadedStocks = cacheData.stocks || []
      this.processedSymbols = new Set(this.loadedStocks.map(stock => stock.ticker))
      console.log(`💾 Safe cache loaded: ${this.loadedStocks.length} stocks`)
    } catch (error) {
      console.warn('⚠️ Failed to load safe cache:', error)
      this.loadedStocks = []
      this.processedSymbols = new Set()
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    localStorage.removeItem(this.cacheKey)
    this.loadedStocks = []
    this.processedSymbols = new Set()
    console.log('🗑️ Safe cache cleared')
  }

  /**
   * Stop loading
   */
  stop(): void {
    this.isRunning = false
    console.log('🛑 Safe loading stopped')
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
export const minimalSP500Loader = new MinimalSP500Loader()
