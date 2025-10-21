import { Stock } from './aiFilter'
import { getMultipleStocksData, convertToStock } from './stockDataService'
import { STOCK_SYMBOLS, QUICK_STOCK_SYMBOLS } from './stockSymbols'

export class ComprehensiveLoader {
  private batchSize: number = 1 // Load 1 stock at a time for maximum reliability
  private delayBetweenBatches: number = 200 // 200ms delay between requests
  private maxRetries: number = 3
  private retryDelay: number = 1000
  private maxConsecutiveFailures: number = 10
  private batchTimeout: number = 8000 // 8 second timeout per stock
  private consecutiveFailures: number = 0
  private loadedStocks: Stock[] = []
  private processedSymbols: Set<string> = new Set()
  private isRunning: boolean = false
  private onProgress?: (progress: { loaded: number; total: number }) => void
  private onUpdate?: (stocks: Stock[]) => void
  private onComplete?: (stocks: Stock[]) => void
  private onError?: (error: string) => void
  private startTime: number = 0
  private totalSymbols: number = 0

  constructor() {
    this.loadFromCache()
  }

  async loadAllStocks(
    onProgress?: (progress: { loaded: number; total: number }) => void,
    onUpdate?: (stocks: Stock[]) => void,
    onComplete?: (stocks: Stock[]) => void,
    onError?: (error: string) => void
  ): Promise<Stock[]> {
    this.onProgress = onProgress
    this.onUpdate = onUpdate
    this.onComplete = onComplete
    this.onError = onError
    this.isRunning = true
    this.startTime = Date.now()

    try {
      // Use the full symbol list
      this.totalSymbols = STOCK_SYMBOLS.length
      console.log('🚀 Starting COMPREHENSIVE loading...')
      console.log(`📊 Total symbols to process: ${this.totalSymbols}`)
      console.log(`💾 Already loaded: ${this.loadedStocks.length}`)

      // Get remaining symbols to process
      const remainingSymbols = this.getRemainingSymbols()
      console.log(`🔄 Remaining symbols: ${remainingSymbols.length}`)

      if (remainingSymbols.length === 0) {
        console.log('✅ All stocks already loaded from cache!')
        this.onComplete?.(this.loadedStocks)
        return this.loadedStocks
      }

      // Process remaining symbols with comprehensive strategy
      await this.processSymbolsComprehensive(remainingSymbols)

      console.log(`🎉 COMPREHENSIVE loading completed! Loaded ${this.loadedStocks.length} stocks`)
      this.onComplete?.(this.loadedStocks)
      return this.loadedStocks

    } catch (error) {
      const errorMsg = `Comprehensive loading failed: ${error}`
      console.error('❌', errorMsg)
      this.onError?.(errorMsg)
      throw error
    } finally {
      this.isRunning = false
    }
  }

  private async processSymbolsComprehensive(symbols: string[]): Promise<void> {
    let totalProcessed = 0
    let successfulLoads = 0

    console.log(`🔄 Processing ${symbols.length} symbols with comprehensive strategy`)

    for (let i = 0; i < symbols.length && this.isRunning; i++) {
      const symbol = symbols[i]
      console.log(`📦 Processing symbol ${i + 1}/${symbols.length}: ${symbol}`)

      let symbolSuccess = false
      let symbolRetries = 0

      // Retry logic for each symbol
      while (!symbolSuccess && symbolRetries < this.maxRetries && this.isRunning) {
        try {
          const stock = await this.loadSingleStockWithTimeout(symbol)
          
          if (stock) {
            this.loadedStocks.push(stock)
            this.processedSymbols.add(symbol)
            totalProcessed++
            successfulLoads++
            this.consecutiveFailures = 0 // Reset on success
            
            // Save progress after each successful load
            this.saveToCache()
            
            // Update UI
            this.onProgress?.({ loaded: this.loadedStocks.length, total: this.totalSymbols })
            this.onUpdate?.(this.loadedStocks)
            
            console.log(`✅ ${symbol} loaded successfully (${this.loadedStocks.length}/${this.totalSymbols})`)
            symbolSuccess = true
          } else {
            throw new Error('No stock data returned')
          }

        } catch (error) {
          symbolRetries++
          this.consecutiveFailures++
          
          console.warn(`⚠️ ${symbol} failed (attempt ${symbolRetries}/${this.maxRetries}):`, error)
          
          if (symbolRetries < this.maxRetries) {
            const delay = this.retryDelay * symbolRetries // Progressive delay
            console.log(`⏳ Retrying ${symbol} in ${delay}ms...`)
            await this.delay(delay)
          } else {
            console.error(`❌ ${symbol} failed after ${this.maxRetries} attempts, skipping`)
            // Mark symbol as processed even if failed to avoid infinite retry
            this.processedSymbols.add(symbol)
          }
        }
      }

      // Check if we've hit too many consecutive failures
      if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
        console.error(`❌ Too many consecutive failures (${this.consecutiveFailures}), stopping comprehensive loading`)
        this.onError?.(`Stopped after ${this.consecutiveFailures} consecutive failures`)
        break
      }

      // Delay between symbols
      if (i < symbols.length - 1 && this.isRunning) {
        await this.delay(this.delayBetweenBatches)
      }
    }

    console.log(`🏁 Comprehensive processing completed. Total processed: ${totalProcessed}, Successful loads: ${successfulLoads}`)
  }

  private async loadSingleStockWithTimeout(symbol: string): Promise<Stock | null> {
    try {
      console.log(`🔄 Loading single stock: ${symbol}`)
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Stock timeout')), this.batchTimeout)
      })
      
      const dataPromise = getMultipleStocksData([symbol])
      const realData = await Promise.race([dataPromise, timeoutPromise])
      
      if (realData && realData.length > 0) {
        const stock = convertToStock(realData[0])
        console.log(`✅ ${symbol} loaded successfully: $${stock.price}`)
        return stock
      } else {
        console.warn(`⚠️ ${symbol}: No data returned from API`)
        return null
      }

    } catch (error) {
      console.error(`❌ ${symbol} load failed:`, error)
      return null // Return null instead of throwing
    }
  }

  private getRemainingSymbols(): string[] {
    return STOCK_SYMBOLS.filter(symbol => !this.processedSymbols.has(symbol))
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private saveToCache(): void {
    try {
      const cacheData = {
        stocks: this.loadedStocks,
        processedSymbols: Array.from(this.processedSymbols),
        timestamp: Date.now(),
        totalSymbols: this.totalSymbols
      }
      localStorage.setItem('comprehensiveStockCache', JSON.stringify(cacheData))
      console.log(`💾 Cache saved: ${this.loadedStocks.length} stocks, ${this.processedSymbols.size} processed symbols`)
    } catch (error) {
      console.warn('⚠️ Failed to save cache:', error)
    }
  }

  private loadFromCache(): void {
    try {
      const cached = localStorage.getItem('comprehensiveStockCache')
      if (cached) {
        const cacheData = JSON.parse(cached)
        this.loadedStocks = cacheData.stocks || []
        this.processedSymbols = new Set(cacheData.processedSymbols || [])
        this.totalSymbols = cacheData.totalSymbols || STOCK_SYMBOLS.length
        console.log(`💾 Cache loaded: ${this.loadedStocks.length} stocks, ${this.processedSymbols.size} processed symbols`)
      } else {
        this.totalSymbols = STOCK_SYMBOLS.length
      }
    } catch (error) {
      console.warn('⚠️ Failed to load cache:', error)
      this.loadedStocks = []
      this.processedSymbols = new Set()
      this.totalSymbols = STOCK_SYMBOLS.length
    }
  }

  clearCache(): void {
    localStorage.removeItem('comprehensiveStockCache')
    this.loadedStocks = []
    this.processedSymbols = new Set()
    console.log('🗑️ Cache cleared')
  }

  getCacheInfo(): { loaded: number; processed: number; total: number } {
    return {
      loaded: this.loadedStocks.length,
      processed: this.processedSymbols.size,
      total: this.totalSymbols
    }
  }

  stop(): void {
    this.isRunning = false
    console.log('🛑 Comprehensive loading stopped')
  }

  resetFailures(): void {
    this.consecutiveFailures = 0
    console.log('🔄 Failure count reset')
  }
}
