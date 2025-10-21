import { Stock } from './aiFilter'
import { getMultipleStocksData, convertToStock } from './stockDataService'

/**
 * Robust loader that handles API failures gracefully
 */
export class RobustStockLoader {
  private batchSize: number = 3 // Smaller batches for reliability
  private delayBetweenBatches: number = 5000 // Longer delays
  private maxRetries: number = 2
  private retryDelay: number = 10000 // 10 second delay on retry
  private persistenceKey = 'robust_stock_loader_cache'
  private maxCacheAge = 24 * 60 * 60 * 1000 // 24 hours
  private maxConcurrentBatches: number = 1 // Single batch for reliability
  private failureCount: number = 0
  private maxFailures: number = 10 // Stop after 10 consecutive failures

  constructor() {
    this.loadFromCache()
  }

  /**
   * Load all stocks with robust error handling
   */
  async loadAllStocks(
    allSymbols: string[],
    onProgress: (loaded: number, total: number, currentBatch: string[], isFromCache: boolean) => void,
    onComplete: (stocks: Stock[]) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    console.log(`🛡️ ROBUST LOADER: Starting load of ${allSymbols.length} stocks`)
    
    // First, try to load from cache
    const cachedStocks = this.loadFromCache()
    if (cachedStocks.length > 0) {
      console.log(`📦 Loaded ${cachedStocks.length} stocks from cache`)
      onProgress(cachedStocks.length, allSymbols.length, [], true)
      
      // If we have most stocks in cache, return immediately
      if (cachedStocks.length >= allSymbols.length * 0.5) { // 50% threshold
        console.log(`✅ Cache hit! Using ${cachedStocks.length} cached stocks`)
        onComplete(cachedStocks)
        return
      }
    }

    // Load remaining stocks with robust error handling
    const allStocks: Stock[] = [...cachedStocks]
    const remainingSymbols = this.getRemainingSymbols(allSymbols, allStocks)
    const batches = this.createBatches(remainingSymbols, this.batchSize)
    
    console.log(`🔄 ROBUST LOADING: ${remainingSymbols.length} remaining stocks in ${batches.length} batches`)

    // Process batches one at a time for maximum reliability
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      console.log(`📦 Processing batch ${i + 1}/${batches.length}: ${batch.join(', ')}`)

      try {
        const batchStocks = await this.loadBatchWithRetry(batch)
        if (batchStocks && batchStocks.length > 0) {
          allStocks.push(...batchStocks)
          this.failureCount = 0 // Reset failure count on success
          
          // Save progress to cache after each successful batch
          this.saveToCache(allStocks)
          console.log(`✅ Batch ${i + 1} successful: ${batchStocks.length} stocks loaded`)
        } else {
          console.warn(`⚠️ Batch ${i + 1} returned no data`)
          this.failureCount++
        }
        
        onProgress(allStocks.length, allSymbols.length, batch, false)
        
        // Check if we've hit too many failures
        if (this.failureCount >= this.maxFailures) {
          console.error(`❌ Too many consecutive failures (${this.failureCount}), stopping load`)
          onError(new Error(`Too many consecutive failures: ${this.failureCount}`))
          return
        }
        
        // Add delay between batches
        if (i < batches.length - 1) {
          console.log(`⏳ Waiting ${this.delayBetweenBatches}ms before next batch...`)
          await this.delay(this.delayBetweenBatches)
        }
      } catch (error) {
        console.error(`❌ Failed to load batch ${i + 1}:`, error)
        this.failureCount++
        
        // If we have some stocks, continue with a longer delay
        if (allStocks.length > 0) {
          console.log(`⚠️ Continuing with ${allStocks.length} stocks loaded so far...`)
          onProgress(allStocks.length, allSymbols.length, batch, false)
          
          // Longer delay on error
          await this.delay(this.delayBetweenBatches * 2)
        } else {
          console.error(`❌ No stocks loaded, stopping`)
          onError(error as Error)
          return
        }
      }
    }

    console.log(`✅ ROBUST LOADING complete: ${allStocks.length} stocks loaded`)
    this.saveToCache(allStocks)
    onComplete(allStocks)
  }

  /**
   * Load a single batch with exponential backoff retry
   */
  private async loadBatchWithRetry(symbols: string[]): Promise<Stock[]> {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${this.maxRetries} for batch: ${symbols.join(', ')}`)
        
        // Add random delay to avoid rate limits
        if (attempt > 1) {
          const randomDelay = Math.random() * 5000 + 5000 // 5-10 seconds
          console.log(`⏳ Random delay: ${Math.round(randomDelay)}ms`)
          await this.delay(randomDelay)
        }
        
        const realData = await getMultipleStocksData(symbols)
        
        if (realData.length > 0) {
          return realData.map(convertToStock)
        } else {
          throw new Error('No data returned from API')
        }
      } catch (error) {
        console.warn(`⚠️ Attempt ${attempt} failed:`, error)
        
        if (attempt < this.maxRetries) {
          const backoffDelay = this.retryDelay * Math.pow(2, attempt - 1) // Exponential backoff
          console.log(`⏳ Retrying in ${backoffDelay}ms...`)
          await this.delay(backoffDelay)
        } else {
          throw error
        }
      }
    }
    
    throw new Error('Max retries exceeded')
  }

  /**
   * Create small batches for reliability
   */
  private createBatches(symbols: string[], batchSize: number): string[][] {
    const batches: string[][] = []
    for (let i = 0; i < symbols.length; i += batchSize) {
      batches.push(symbols.slice(i, i + batchSize))
    }
    return batches
  }

  /**
   * Get symbols that aren't already loaded
   */
  private getRemainingSymbols(allSymbols: string[], loadedStocks: Stock[]): string[] {
    const loadedSymbols = new Set(loadedStocks.map(stock => stock.ticker))
    return allSymbols.filter(symbol => !loadedSymbols.has(symbol))
  }

  /**
   * Save stocks to localStorage cache
   */
  private saveToCache(stocks: Stock[]): void {
    try {
      const cacheData = {
        stocks,
        timestamp: Date.now(),
        version: '3.0',
        count: stocks.length
      }
      
      localStorage.setItem(this.persistenceKey, JSON.stringify(cacheData))
      console.log(`💾 Saved ${stocks.length} stocks to cache`)
    } catch (error) {
      console.warn('Failed to save to cache:', error)
    }
  }

  /**
   * Load stocks from localStorage cache
   */
  private loadFromCache(): Stock[] {
    try {
      const cached = localStorage.getItem(this.persistenceKey)
      if (!cached) return []

      const cacheData = JSON.parse(cached)
      const isExpired = Date.now() - cacheData.timestamp > this.maxCacheAge
      
      if (isExpired) {
        console.log('🗑️ Cache expired, clearing...')
        localStorage.removeItem(this.persistenceKey)
        return []
      }

      return cacheData.stocks || []
    } catch (error) {
      console.warn('Failed to load from cache:', error)
      return []
    }
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    localStorage.removeItem(this.persistenceKey)
    console.log('🗑️ Cache cleared')
  }

  /**
   * Get cache info
   */
  public getCacheInfo(): { count: number, age: number, isExpired: boolean } {
    try {
      const cached = localStorage.getItem(this.persistenceKey)
      if (!cached) return { count: 0, age: 0, isExpired: true }

      const cacheData = JSON.parse(cached)
      const age = Date.now() - cacheData.timestamp
      const isExpired = age > this.maxCacheAge

      return {
        count: cacheData.stocks?.length || 0,
        age: Math.floor(age / (1000 * 60)), // age in minutes
        isExpired
      }
    } catch (error) {
      return { count: 0, age: 0, isExpired: true }
    }
  }

  /**
   * Delay utility with jitter
   */
  private delay(ms: number): Promise<void> {
    const jitter = Math.random() * 1000 // 0-1000ms jitter
    return new Promise(resolve => setTimeout(resolve, ms + jitter))
  }

  /**
   * Reset failure count
   */
  public resetFailures(): void {
    this.failureCount = 0
    console.log('🔄 Failure count reset')
  }

  /**
   * Get current failure count
   */
  public getFailureCount(): number {
    return this.failureCount
  }
}









