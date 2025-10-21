import { Stock } from './aiFilter'
import { getMultipleStocksData, convertToStock } from './stockDataService'

/**
 * Turbo-charged loader with multiple optimization strategies
 */
export class TurboStockLoader {
  private batchSize: number = 5 // Increased batch size
  private delayBetweenBatches: number = 2000 // Reduced delay
  private maxRetries: number = 2
  private retryDelay: number = 5000
  private persistenceKey = 'turbo_stock_loader_cache'
  private maxCacheAge = 24 * 60 * 60 * 1000 // 24 hours
  private maxConcurrentBatches: number = 3 // Run multiple batches in parallel
  private activeBatches: Set<Promise<Stock[]>> = new Set()

  constructor() {
    this.loadFromCache()
  }

  /**
   * Load all stocks with turbo optimizations
   */
  async loadAllStocks(
    allSymbols: string[],
    onProgress: (loaded: number, total: number, currentBatch: string[], isFromCache: boolean) => void,
    onComplete: (stocks: Stock[]) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    console.log(`🚀 TURBO LOADER: Starting load of ${allSymbols.length} stocks`)
    
    // First, try to load from cache
    const cachedStocks = this.loadFromCache()
    if (cachedStocks.length > 0) {
      console.log(`📦 Loaded ${cachedStocks.length} stocks from cache`)
      onProgress(cachedStocks.length, allSymbols.length, [], true)
      
      // If we have all stocks in cache, return immediately
      if (cachedStocks.length >= allSymbols.length * 0.8) { // 80% threshold
        console.log(`✅ Cache hit! Using ${cachedStocks.length} cached stocks`)
        onComplete(cachedStocks)
        return
      }
    }

    // Load remaining stocks with turbo optimizations
    const allStocks: Stock[] = [...cachedStocks]
    const remainingSymbols = this.getRemainingSymbols(allSymbols, allStocks)
    const batches = this.createBatches(remainingSymbols, this.batchSize)
    
    console.log(`🔄 TURBO LOADING: ${remainingSymbols.length} remaining stocks in ${batches.length} batches`)

    // Process batches with controlled concurrency
    await this.processBatchesWithConcurrency(
      batches,
      allStocks,
      onProgress,
      onComplete,
      onError
    )
  }

  /**
   * Process batches with controlled concurrency for faster loading
   */
  private async processBatchesWithConcurrency(
    batches: string[][],
    allStocks: Stock[],
    onProgress: (loaded: number, total: number, currentBatch: string[], isFromCache: boolean) => void,
    onComplete: (stocks: Stock[]) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    let completedBatches = 0
    const totalBatches = batches.length

    for (let i = 0; i < batches.length; i += this.maxConcurrentBatches) {
      const batchGroup = batches.slice(i, i + this.maxConcurrentBatches)
      
      console.log(`🚀 Processing batch group ${Math.floor(i / this.maxConcurrentBatches) + 1}: ${batchGroup.length} batches in parallel`)

      // Process batch group in parallel
      const batchPromises = batchGroup.map(async (batch, index) => {
        const batchIndex = i + index
        console.log(`📦 Batch ${batchIndex + 1}/${totalBatches}: ${batch.join(', ')}`)

        try {
          const batchStocks = await this.loadBatchWithRetry(batch)
          if (batchStocks && batchStocks.length > 0) {
            allStocks.push(...batchStocks)
            
            // Save progress to cache after each successful batch
            this.saveToCache(allStocks)
          }
          
          completedBatches++
          onProgress(allStocks.length, allSymbols.length, batch, false)
          
          return batchStocks
        } catch (error) {
          console.error(`❌ Failed to load batch ${batchIndex + 1}:`, error)
          console.log(`⚠️ Continuing with next batch...`)
          return []
        }
      })

      // Wait for all batches in this group to complete
      await Promise.allSettled(batchPromises)
      
      // Add delay between batch groups (not individual batches)
      if (i + this.maxConcurrentBatches < batches.length) {
        console.log(`⏳ Waiting ${this.delayBetweenBatches}ms before next batch group...`)
        await this.delay(this.delayBetweenBatches)
      }
    }

    console.log(`✅ TURBO LOADING complete: ${allStocks.length} stocks loaded`)
    this.saveToCache(allStocks)
    onComplete(allStocks)
  }

  /**
   * Load a single batch with optimized retry logic
   */
  private async loadBatchWithRetry(symbols: string[]): Promise<Stock[]> {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${this.maxRetries} for batch: ${symbols.join(', ')}`)
        const realData = await getMultipleStocksData(symbols)
        
        if (realData.length > 0) {
          return realData.map(convertToStock)
        } else {
          throw new Error('No data returned from API')
        }
      } catch (error) {
        console.warn(`⚠️ Attempt ${attempt} failed:`, error)
        
        if (attempt < this.maxRetries) {
          const backoffDelay = this.retryDelay * Math.pow(1.5, attempt - 1) // Gentler backoff
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
   * Create optimized batches
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
   * Save stocks to localStorage cache with compression
   */
  private saveToCache(stocks: Stock[]): void {
    try {
      const cacheData = {
        stocks,
        timestamp: Date.now(),
        version: '2.0',
        count: stocks.length
      }
      
      // Compress data for faster storage
      const compressed = JSON.stringify(cacheData)
      localStorage.setItem(this.persistenceKey, compressed)
      console.log(`💾 Saved ${stocks.length} stocks to cache (${Math.round(compressed.length / 1024)}KB)`)
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
  public getCacheInfo(): { count: number, age: number, isExpired: boolean, size: string } {
    try {
      const cached = localStorage.getItem(this.persistenceKey)
      if (!cached) return { count: 0, age: 0, isExpired: true, size: '0KB' }

      const cacheData = JSON.parse(cached)
      const age = Date.now() - cacheData.timestamp
      const isExpired = age > this.maxCacheAge
      const size = Math.round(cached.length / 1024) + 'KB'

      return {
        count: cacheData.stocks?.length || 0,
        age: Math.floor(age / (1000 * 60)), // age in minutes
        isExpired,
        size
      }
    } catch (error) {
      return { count: 0, age: 0, isExpired: true, size: '0KB' }
    }
  }

  /**
   * Optimized delay with jitter
   */
  private delay(ms: number): Promise<void> {
    // Reduced jitter for faster loading
    const jitter = Math.random() * 500 // 0-500ms jitter
    return new Promise(resolve => setTimeout(resolve, ms + jitter))
  }

  /**
   * Set turbo mode for maximum speed
   */
  public setTurboMode(): void {
    this.batchSize = 8 // Larger batches
    this.delayBetweenBatches = 1000 // Shorter delays
    this.maxConcurrentBatches = 5 // More parallel batches
    console.log('🚀 TURBO MODE ACTIVATED!')
  }

  /**
   * Set safe mode for stability
   */
  public setSafeMode(): void {
    this.batchSize = 3 // Smaller batches
    this.delayBetweenBatches = 3000 // Longer delays
    this.maxConcurrentBatches = 2 // Fewer parallel batches
    console.log('🛡️ SAFE MODE ACTIVATED!')
  }
}

/**
 * Performance monitoring for the loader
 */
export class LoaderPerformanceMonitor {
  private startTime: number = 0
  private batchTimes: number[] = []
  private totalStocks: number = 0
  private loadedStocks: number = 0

  start(totalStocks: number): void {
    this.startTime = Date.now()
    this.totalStocks = totalStocks
    this.loadedStocks = 0
    this.batchTimes = []
    console.log(`📊 Performance monitoring started for ${totalStocks} stocks`)
  }

  recordBatch(batchSize: number, batchTime: number): void {
    this.loadedStocks += batchSize
    this.batchTimes.push(batchTime)
    
    const avgBatchTime = this.batchTimes.reduce((a, b) => a + b, 0) / this.batchTimes.length
    const remainingBatches = Math.ceil((this.totalStocks - this.loadedStocks) / batchSize)
    const estimatedTimeRemaining = remainingBatches * avgBatchTime
    
    console.log(`📈 Performance: ${this.loadedStocks}/${this.totalStocks} stocks (${Math.round((this.loadedStocks/this.totalStocks)*100)}%)`)
    console.log(`⏱️ Avg batch time: ${Math.round(avgBatchTime)}ms, ETA: ${Math.round(estimatedTimeRemaining/1000)}s`)
  }

  getStats(): { totalTime: number, avgBatchTime: number, stocksPerSecond: number } {
    const totalTime = Date.now() - this.startTime
    const avgBatchTime = this.batchTimes.reduce((a, b) => a + b, 0) / this.batchTimes.length
    const stocksPerSecond = (this.loadedStocks / totalTime) * 1000
    
    return {
      totalTime: Math.round(totalTime / 1000), // seconds
      avgBatchTime: Math.round(avgBatchTime), // milliseconds
      stocksPerSecond: Math.round(stocksPerSecond * 100) / 100
    }
  }
}









