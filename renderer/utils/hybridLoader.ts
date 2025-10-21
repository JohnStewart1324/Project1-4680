import { Stock } from './aiFilter'
import { getMultipleStocksData, convertToStock } from './stockDataService'

/**
 * Hybrid loader that uses multiple strategies and fallbacks
 */
export class HybridStockLoader {
  private batchSize: number = 2 // Very small batches
  private delayBetweenBatches: number = 10000 // 10 second delays
  private maxRetries: number = 1 // Only 1 retry to avoid long waits
  private retryDelay: number = 30000 // 30 second delay on retry
  private persistenceKey = 'hybrid_stock_loader_cache'
  private maxCacheAge = 24 * 60 * 60 * 1000 // 24 hours
  private failureCount: number = 0
  private maxFailures: number = 5 // Stop after 5 consecutive failures
  private useMockData: boolean = false // Fallback to mock data
  private mockDataRatio: number = 0.3 // 30% real data, 70% mock data

  constructor() {
    this.loadFromCache()
  }

  /**
   * Load all stocks with hybrid strategy
   */
  async loadAllStocks(
    allSymbols: string[],
    onProgress: (loaded: number, total: number, currentBatch: string[], isFromCache: boolean) => void,
    onComplete: (stocks: Stock[]) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    console.log(`🔄 HYBRID LOADER: Starting load of ${allSymbols.length} stocks`)
    
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

    // Use hybrid strategy: mix real and mock data
    const allStocks: Stock[] = [...cachedStocks]
    const remainingSymbols = this.getRemainingSymbols(allSymbols, allStocks)
    
    console.log(`🔄 HYBRID LOADING: ${remainingSymbols.length} remaining stocks`)
    console.log(`📊 Strategy: ${this.useMockData ? 'Mock data fallback' : 'Real data with mock fallback'}`)

    // Process symbols with hybrid approach
    await this.processSymbolsHybrid(
      remainingSymbols,
      allStocks,
      onProgress,
      onComplete,
      onError
    )
  }

  /**
   * Process symbols with hybrid real/mock data approach
   */
  private async processSymbolsHybrid(
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
        let batchStocks: Stock[] = []

        // Try to get real data first (if not in mock mode)
        if (!this.useMockData) {
          try {
            const realData = await this.loadBatchWithRetry(batch)
            if (realData && realData.length > 0) {
              batchStocks = realData
              this.failureCount = 0 // Reset failure count on success
              console.log(`✅ Real data: ${batchStocks.length} stocks`)
            } else {
              throw new Error('No real data returned')
            }
          } catch (error) {
            console.warn(`⚠️ Real data failed for batch ${i + 1}:`, error)
            this.failureCount++
            
            // Switch to mock data if too many failures
            if (this.failureCount >= this.maxFailures) {
              console.log(`🔄 Switching to mock data mode after ${this.failureCount} failures`)
              this.useMockData = true
            }
          }
        }

        // Use mock data if real data failed or in mock mode
        if (batchStocks.length === 0) {
          batchStocks = this.generateMockStocks(batch)
          console.log(`🎭 Mock data: ${batchStocks.length} stocks`)
        }

        if (batchStocks.length > 0) {
          allStocks.push(...batchStocks)
          processedCount += batchStocks.length
          
          // Save progress to cache after each successful batch
          this.saveToCache(allStocks)
          console.log(`✅ Batch ${i + 1} complete: ${allStocks.length} total stocks`)
        }
        
        onProgress(allStocks.length, allSymbols.length, batch, false)
        
        // Add delay between batches
        if (i < batches.length - 1) {
          const delay = this.useMockData ? 1000 : this.delayBetweenBatches // Shorter delay for mock data
          console.log(`⏳ Waiting ${delay}ms before next batch...`)
          await this.delay(delay)
        }
      } catch (error) {
        console.error(`❌ Failed to process batch ${i + 1}:`, error)
        this.failureCount++
        
        // If we have some stocks, continue with mock data
        if (allStocks.length > 0) {
          console.log(`⚠️ Continuing with ${allStocks.length} stocks loaded so far...`)
          this.useMockData = true
          onProgress(allStocks.length, allSymbols.length, batch, false)
        } else {
          console.error(`❌ No stocks loaded, stopping`)
          onError(error as Error)
          return
        }
      }
    }

    console.log(`✅ HYBRID LOADING complete: ${allStocks.length} stocks loaded`)
    this.saveToCache(allStocks)
    onComplete(allStocks)
  }

  /**
   * Load a single batch with retry
   */
  private async loadBatchWithRetry(symbols: string[]): Promise<Stock[]> {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${this.maxRetries} for batch: ${symbols.join(', ')}`)
        
        // Add random delay to avoid rate limits
        if (attempt > 1) {
          const randomDelay = Math.random() * 10000 + 10000 // 10-20 seconds
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
          console.log(`⏳ Retrying in ${this.retryDelay}ms...`)
          await this.delay(this.retryDelay)
        } else {
          throw error
        }
      }
    }
    
    throw new Error('Max retries exceeded')
  }

  /**
   * Generate mock stocks for fallback
   */
  private generateMockStocks(symbols: string[]): Stock[] {
    return symbols.map(symbol => ({
      ticker: symbol,
      name: `${symbol} Corporation`,
      sector: this.getRandomSector(),
      price: Math.random() * 500 + 10,
      pe: Math.random() * 50 + 5,
      dividendYield: Math.random() * 5,
      marketCap: Math.random() * 1000000000000 + 1000000000,
      volume: Math.floor(Math.random() * 10000000) + 1000000,
      change: (Math.random() - 0.5) * 20,
      changePercent: (Math.random() - 0.5) * 10,
      aiInsight: `Mock data for ${symbol} - Real data unavailable due to API limits`
    }))
  }

  /**
   * Get random sector for mock data
   */
  private getRandomSector(): string {
    const sectors = [
      'Technology', 'Financial', 'Healthcare', 'Consumer Discretionary',
      'Consumer Staples', 'Energy', 'Industrial', 'Communication Services',
      'Real Estate', 'Materials', 'Utilities'
    ]
    return sectors[Math.floor(Math.random() * sectors.length)]
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
        version: '4.0',
        count: stocks.length,
        mockDataRatio: this.mockDataRatio
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
  public getCacheInfo(): { count: number, age: number, isExpired: boolean, mockDataRatio: number } {
    try {
      const cached = localStorage.getItem(this.persistenceKey)
      if (!cached) return { count: 0, age: 0, isExpired: true, mockDataRatio: 0 }

      const cacheData = JSON.parse(cached)
      const age = Date.now() - cacheData.timestamp
      const isExpired = age > this.maxCacheAge

      return {
        count: cacheData.stocks?.length || 0,
        age: Math.floor(age / (1000 * 60)), // age in minutes
        isExpired,
        mockDataRatio: cacheData.mockDataRatio || 0
      }
    } catch (error) {
      return { count: 0, age: 0, isExpired: true, mockDataRatio: 0 }
    }
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Reset failure count
   */
  public resetFailures(): void {
    this.failureCount = 0
    this.useMockData = false
    console.log('🔄 Failure count reset, switching back to real data mode')
  }

  /**
   * Get current failure count
   */
  public getFailureCount(): number {
    return this.failureCount
  }

  /**
   * Check if using mock data
   */
  public isUsingMockData(): boolean {
    return this.useMockData
  }
}









