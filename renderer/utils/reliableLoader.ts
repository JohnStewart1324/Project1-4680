import { Stock } from './aiFilter'
import { getMultipleStocksData, convertToStock } from './stockDataService'
import { STOCK_SYMBOLS } from './stockSymbols'

export class ReliableLoader {
  private loadedStocks: Stock[] = []
  private processedSymbols: Set<string> = new Set()
  private isRunning: boolean = false
  private onProgress?: (progress: { loaded: number; total: number }) => void
  private onUpdate?: (stocks: Stock[]) => void
  private onComplete?: (stocks: Stock[]) => void
  private onError?: (error: string) => void
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
    this.totalSymbols = STOCK_SYMBOLS.length

    try {
      console.log('🚀 Starting RELIABLE loading...')
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

      // Process symbols in small batches
      await this.processSymbolsReliable(remainingSymbols)

      console.log(`🎉 RELIABLE loading completed! Loaded ${this.loadedStocks.length} stocks`)
      this.onComplete?.(this.loadedStocks)
      return this.loadedStocks

    } catch (error) {
      const errorMsg = `Reliable loading failed: ${error}`
      console.error('❌', errorMsg)
      this.onError?.(errorMsg)
      throw error
    } finally {
      this.isRunning = false
    }
  }

  private async processSymbolsReliable(symbols: string[]): Promise<void> {
    const batchSize = 3 // Small batches for reliability
    let totalProcessed = 0
    let successfulLoads = 0

    console.log(`🔄 Processing ${symbols.length} symbols with reliable strategy`)

    for (let i = 0; i < symbols.length && this.isRunning; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize)
      console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1}: ${batch.join(', ')}`)

      try {
        // Load batch with timeout
        const batchStocks = await this.loadBatchWithTimeout(batch)
        
        if (batchStocks.length > 0) {
          this.loadedStocks.push(...batchStocks)
          batch.forEach(symbol => this.processedSymbols.add(symbol))
          totalProcessed += batchStocks.length
          successfulLoads += batchStocks.length
          
          // Save progress after each successful batch
          this.saveToCache()
          
          // Update UI
          this.onProgress?.({ loaded: this.loadedStocks.length, total: this.totalSymbols })
          this.onUpdate?.(this.loadedStocks)
          
          console.log(`✅ Batch successful: ${batchStocks.length} stocks loaded (${this.loadedStocks.length}/${this.totalSymbols})`)
        } else {
          console.warn(`⚠️ Batch returned no stocks: ${batch.join(', ')}`)
          // Mark as processed to avoid retry
          batch.forEach(symbol => this.processedSymbols.add(symbol))
        }

      } catch (error) {
        console.error(`❌ Batch failed:`, error)
        // Mark as processed to avoid retry
        batch.forEach(symbol => this.processedSymbols.add(symbol))
      }

      // Small delay between batches
      if (i + batchSize < symbols.length && this.isRunning) {
        await this.delay(500)
      }
    }

    console.log(`🏁 Reliable processing completed. Total processed: ${totalProcessed}, Successful loads: ${successfulLoads}`)
  }

  private async loadBatchWithTimeout(batch: string[]): Promise<Stock[]> {
    try {
      console.log(`🔄 Loading batch: ${batch.join(', ')}`)
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Batch timeout')), 10000) // 10 second timeout
      })
      
      const dataPromise = getMultipleStocksData(batch)
      const realData = await Promise.race([dataPromise, timeoutPromise])
      
      if (realData && realData.length > 0) {
        const stocks = realData.map(convertToStock)
        console.log(`✅ Batch loaded successfully: ${stocks.length} stocks`)
        return stocks
      } else {
        console.warn(`⚠️ Batch returned no data: ${batch.join(', ')}`)
        return []
      }

    } catch (error) {
      console.error(`❌ Batch load failed:`, error)
      return []
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
      localStorage.setItem('reliableStockCache', JSON.stringify(cacheData))
      console.log(`💾 Cache saved: ${this.loadedStocks.length} stocks, ${this.processedSymbols.size} processed symbols`)
    } catch (error) {
      console.warn('⚠️ Failed to save cache:', error)
    }
  }

  private loadFromCache(): void {
    try {
      const cached = localStorage.getItem('reliableStockCache')
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
    localStorage.removeItem('reliableStockCache')
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
    console.log('🛑 Reliable loading stopped')
  }

  resetFailures(): void {
    console.log('🔄 Failure count reset')
  }
}







