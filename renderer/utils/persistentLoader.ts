import { Stock } from './aiFilter'
import { getMultipleStocksData, convertToStock } from './stockDataService'

/**
 * Persistent loader that only uses real data and handles API limits aggressively
 */
export class PersistentStockLoader {
  private batchSize: number = 5 // Multiple stocks per batch for speed
  private delayBetweenBatches: number = 0 // No delays for maximum speed
  private maxRetries: number = 3 // Fewer retries for speed
  private retryDelay: number = 1000 // 1 second delay on retry
  private persistenceKey = 'persistent_stock_loader_cache'
  private maxCacheAge = 24 * 60 * 60 * 1000 // 24 hours
  private failureCount: number = 0
  private maxFailures: number = 20 // Allow more failures before giving up
  private consecutiveFailures: number = 0
  private maxConsecutiveFailures: number = 10 // Stop after 10 consecutive failures

  constructor() {
    this.loadFromCache()
  }

  /**
   * Load all stocks with persistent real-data-only approach
   */
  async loadAllStocks(
    allSymbols: string[],
    onProgress: (loaded: number, total: number, currentBatch: string[], isFromCache: boolean) => void,
    onComplete: (stocks: Stock[]) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    console.log(`🔥 PERSISTENT LOADER: Starting load of ${allSymbols.length} stocks (REAL DATA ONLY)`)
    
    // First, try to load from cache
    const cachedStocks = this.loadFromCache()
    if (cachedStocks.length > 0) {
      console.log(`📦 Loaded ${cachedStocks.length} stocks from cache`)
      onProgress(cachedStocks.length, allSymbols.length, [], true)
      
      // If we have some stocks in cache, use them
      if (cachedStocks.length >= allSymbols.length * 0.1) { // 10% threshold
        console.log(`✅ Using ${cachedStocks.length} cached stocks`)
        onComplete(cachedStocks)
        return
      }
    }

    // Load remaining stocks with persistent real-data approach
    const allStocks: Stock[] = [...cachedStocks]
    const remainingSymbols = this.getRemainingSymbols(allSymbols, allStocks)
    
    console.log(`🔥 PERSISTENT LOADING: ${remainingSymbols.length} remaining stocks (REAL DATA ONLY)`)
    console.log(`📊 Strategy: 5 stocks per batch, NO delays, 3 retries per batch`)

    // Process symbols in batches for maximum speed
    await this.processSymbolsPersistent(
      remainingSymbols,
      allStocks,
      onProgress,
      onComplete,
      onError
    )
  }

  /**
   * Process symbols with persistent real-data approach
   */
  private async processSymbolsPersistent(
    symbols: string[],
    allStocks: Stock[],
    onProgress: (loaded: number, total: number, currentBatch: string[], isFromCache: boolean) => void,
    onComplete: (stocks: Stock[]) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    const batches = this.createBatches(symbols, this.batchSize)
    let processedCount = 0

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      console.log(`📦 Processing batch ${i + 1}/${batches.length}: ${batch.join(', ')}`)

      try {
        const batchStocks = await this.loadBatchPersistent(batch)
        if (batchStocks && batchStocks.length > 0) {
          allStocks.push(...batchStocks)
          processedCount += batchStocks.length
          this.consecutiveFailures = 0 // Reset consecutive failures on success
          
          // Save progress to cache after each successful batch
          this.saveToCache(allStocks)
          console.log(`✅ Batch ${i + 1} successful: ${batchStocks.length} stocks loaded (${allStocks.length} total)`)
        } else {
          console.warn(`⚠️ No data for batch ${i + 1}`)
          this.consecutiveFailures++
        }
        
        onProgress(allStocks.length, allSymbols.length, batch, false)
        
        // Check if we've hit too many consecutive failures
        if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
          console.error(`❌ Too many consecutive failures (${this.consecutiveFailures}), stopping`)
          onError(new Error(`Too many consecutive failures: ${this.consecutiveFailures}`))
          return
        }
        
        // No delays between batches for maximum speed
        if (this.delayBetweenBatches > 0 && i < batches.length - 1) {
          console.log(`⏳ Waiting ${this.delayBetweenBatches}ms before next batch...`)
          await this.delay(this.delayBetweenBatches)
        }
      } catch (error) {
        console.error(`❌ Failed to load batch ${i + 1}:`, error)
        this.consecutiveFailures++
        this.failureCount++
        
        // If we have some stocks, continue
        if (allStocks.length > 0) {
          console.log(`⚠️ Continuing with ${allStocks.length} stocks loaded so far...`)
          onProgress(allStocks.length, allSymbols.length, batch, false)
        } else {
          console.error(`❌ No stocks loaded, stopping`)
          onError(error as Error)
          return
        }
      }
    }

    console.log(`✅ PERSISTENT LOADING complete: ${allStocks.length} stocks loaded (REAL DATA ONLY)`)
    this.saveToCache(allStocks)
    onComplete(allStocks)
  }

  /**
   * Load a batch of stocks with maximum speed
   */
  private async loadBatchPersistent(symbols: string[]): Promise<Stock[]> {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${this.maxRetries} for batch: ${symbols.join(', ')}`)
        
        // Minimal delay only on retry
        if (attempt > 1) {
          console.log(`⏳ Retry delay: ${this.retryDelay}ms`)
          await this.delay(this.retryDelay)
        }
        
        const realData = await getMultipleStocksData(symbols)
        
        if (realData.length > 0) {
          return realData.map(convertToStock)
        } else {
          throw new Error('No data returned from API')
        }
      } catch (error) {
        console.warn(`⚠️ Attempt ${attempt} failed for batch:`, error)
        
        if (attempt < this.maxRetries) {
          console.log(`⏳ Retrying batch in ${this.retryDelay}ms...`)
          await this.delay(this.retryDelay)
        } else {
          console.error(`❌ All attempts failed for batch`)
          return []
        }
      }
    }
    
    return []
  }

  /**
   * Create batches from symbols array
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
        version: '5.0',
        count: stocks.length,
        realDataOnly: true
      }
      
      localStorage.setItem(this.persistenceKey, JSON.stringify(cacheData))
      console.log(`💾 Saved ${stocks.length} stocks to cache (REAL DATA ONLY)`)
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
  public getCacheInfo(): { count: number, age: number, isExpired: boolean, realDataOnly: boolean } {
    try {
      const cached = localStorage.getItem(this.persistenceKey)
      if (!cached) return { count: 0, age: 0, isExpired: true, realDataOnly: true }

      const cacheData = JSON.parse(cached)
      const age = Date.now() - cacheData.timestamp
      const isExpired = age > this.maxCacheAge

      return {
        count: cacheData.stocks?.length || 0,
        age: Math.floor(age / (1000 * 60)), // age in minutes
        isExpired,
        realDataOnly: cacheData.realDataOnly || true
      }
    } catch (error) {
      return { count: 0, age: 0, isExpired: true, realDataOnly: true }
    }
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Reset failure counts
   */
  public resetFailures(): void {
    this.failureCount = 0
    this.consecutiveFailures = 0
    console.log('🔄 Failure counts reset')
  }

  /**
   * Get current failure counts
   */
  public getFailureCounts(): { total: number, consecutive: number } {
    return {
      total: this.failureCount,
      consecutive: this.consecutiveFailures
    }
  }

  /**
   * Set more aggressive retry settings
   */
  public setAggressiveMode(): void {
    this.batchSize = 1
    this.delayBetweenBatches = 20000 // 20 seconds
    this.maxRetries = 10 // 10 retries
    this.retryDelay = 60000 // 60 seconds
    this.maxConsecutiveFailures = 20 // Allow more consecutive failures
    console.log('🔥 AGGRESSIVE MODE: Maximum persistence for real data')
  }

  /**
   * Set conservative retry settings
   */
  public setConservativeMode(): void {
    this.batchSize = 1
    this.delayBetweenBatches = 30000 // 30 seconds
    this.maxRetries = 3 // 3 retries
    this.retryDelay = 120000 // 2 minutes
    this.maxConsecutiveFailures = 5 // Fewer consecutive failures allowed
    console.log('🛡️ CONSERVATIVE MODE: Respectful API usage')
  }
}
