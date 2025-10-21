import { Stock } from './aiFilter'
import { getMultipleStocksData } from './stockDataService'
import { STOCK_SYMBOLS } from './stockSymbols'

export class UltraPersistentLoader {
  private batchSize: number = 3
  private delayBetweenBatches: number = 1000
  private maxRetries: number = 5
  private retryDelay: number = 2000
  private maxConsecutiveFailures: number = 50
  private consecutiveFailures: number = 0
  private loadedStocks: Stock[] = []
  private processedSymbols: Set<string> = new Set()
  private isRunning: boolean = false
  private onProgress?: (progress: { loaded: number; total: number }) => void
  private onUpdate?: (stocks: Stock[]) => void
  private onComplete?: (stocks: Stock[]) => void
  private onError?: (error: string) => void

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

    try {
      console.log('🚀 Starting ULTRA PERSISTENT loading...')
      console.log(`📊 Total symbols to process: ${STOCK_SYMBOLS.length}`)
      console.log(`💾 Already loaded: ${this.loadedStocks.length}`)

      // Get remaining symbols to process
      const remainingSymbols = this.getRemainingSymbols()
      console.log(`🔄 Remaining symbols: ${remainingSymbols.length}`)

      if (remainingSymbols.length === 0) {
        console.log('✅ All stocks already loaded from cache!')
        this.onComplete?.(this.loadedStocks)
        return this.loadedStocks
      }

      // Process remaining symbols with ultra-persistent retry logic
      await this.processSymbolsUltraPersistent(remainingSymbols)

      console.log(`🎉 ULTRA PERSISTENT loading completed! Loaded ${this.loadedStocks.length} stocks`)
      this.onComplete?.(this.loadedStocks)
      return this.loadedStocks

    } catch (error) {
      const errorMsg = `Ultra persistent loading failed: ${error}`
      console.error('❌', errorMsg)
      this.onError?.(errorMsg)
      throw error
    } finally {
      this.isRunning = false
    }
  }

  private async processSymbolsUltraPersistent(symbols: string[]): Promise<void> {
    const batches = this.createBatches(symbols)
    let totalProcessed = 0

    console.log(`🔄 Processing ${batches.length} batches with ultra-persistent retry logic`)

    for (let i = 0; i < batches.length && this.isRunning; i++) {
      const batch = batches[i]
      console.log(`📦 Processing batch ${i + 1}/${batches.length} (${batch.length} symbols)`)

      let batchSuccess = false
      let batchRetries = 0

      // Ultra-persistent retry for each batch
      while (!batchSuccess && batchRetries < this.maxRetries && this.isRunning) {
        try {
          const batchStocks = await this.loadBatchWithUltraRetry(batch)
          
          if (batchStocks.length > 0) {
            this.loadedStocks.push(...batchStocks)
            batch.forEach(symbol => this.processedSymbols.add(symbol))
            totalProcessed += batchStocks.length
            this.consecutiveFailures = 0 // Reset on success
            
            // Save progress after each successful batch
            this.saveToCache()
            
            // Update UI
            this.onProgress?.({ loaded: this.loadedStocks.length, total: STOCK_SYMBOLS.length })
            this.onUpdate?.(this.loadedStocks)
            
            console.log(`✅ Batch ${i + 1} successful: ${batchStocks.length} stocks loaded`)
            batchSuccess = true
          } else {
            throw new Error('No stocks returned from batch')
          }

        } catch (error) {
          batchRetries++
          this.consecutiveFailures++
          
          console.warn(`⚠️ Batch ${i + 1} failed (attempt ${batchRetries}/${this.maxRetries}):`, error)
          
          if (batchRetries < this.maxRetries) {
            const delay = this.retryDelay * Math.pow(2, batchRetries - 1) // Exponential backoff
            console.log(`⏳ Retrying batch ${i + 1} in ${delay}ms...`)
            await this.delay(delay)
          } else {
            console.error(`❌ Batch ${i + 1} failed after ${this.maxRetries} attempts, skipping`)
            // Mark symbols as processed even if failed to avoid infinite retry
            batch.forEach(symbol => this.processedSymbols.add(symbol))
          }
        }
      }

      // Check if we've hit too many consecutive failures
      if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
        console.error(`❌ Too many consecutive failures (${this.consecutiveFailures}), stopping ultra-persistent loading`)
        this.onError?.(`Stopped after ${this.consecutiveFailures} consecutive failures`)
        break
      }

      // Delay between batches (reduced for faster loading)
      if (i < batches.length - 1 && this.isRunning) {
        await this.delay(this.delayBetweenBatches)
      }
    }

    console.log(`🏁 Ultra-persistent processing completed. Total processed: ${totalProcessed}`)
  }

  private async loadBatchWithUltraRetry(symbols: string[]): Promise<Stock[]> {
    let retries = 0
    const maxBatchRetries = 3

    while (retries < maxBatchRetries) {
      try {
        console.log(`🔄 Loading batch: ${symbols.join(', ')} (attempt ${retries + 1})`)
        
        const stocks = await getMultipleStocksData(symbols)
        
        if (stocks && stocks.length > 0) {
          console.log(`✅ Batch loaded successfully: ${stocks.length} stocks`)
          return stocks
        } else {
          throw new Error('No stocks returned from API')
        }

      } catch (error) {
        retries++
        console.warn(`⚠️ Batch load failed (attempt ${retries}/${maxBatchRetries}):`, error)
        
        if (retries < maxBatchRetries) {
          const delay = 1000 * retries // Progressive delay
          console.log(`⏳ Retrying batch in ${delay}ms...`)
          await this.delay(delay)
        } else {
          throw error
        }
      }
    }

    return []
  }

  private createBatches(symbols: string[]): string[][] {
    const batches: string[][] = []
    for (let i = 0; i < symbols.length; i += this.batchSize) {
      batches.push(symbols.slice(i, i + this.batchSize))
    }
    return batches
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
        timestamp: Date.now()
      }
      localStorage.setItem('ultraPersistentStockCache', JSON.stringify(cacheData))
      console.log(`💾 Cache saved: ${this.loadedStocks.length} stocks, ${this.processedSymbols.size} processed symbols`)
    } catch (error) {
      console.warn('⚠️ Failed to save cache:', error)
    }
  }

  private loadFromCache(): void {
    try {
      const cached = localStorage.getItem('ultraPersistentStockCache')
      if (cached) {
        const cacheData = JSON.parse(cached)
        this.loadedStocks = cacheData.stocks || []
        this.processedSymbols = new Set(cacheData.processedSymbols || [])
        console.log(`💾 Cache loaded: ${this.loadedStocks.length} stocks, ${this.processedSymbols.size} processed symbols`)
      }
    } catch (error) {
      console.warn('⚠️ Failed to load cache:', error)
      this.loadedStocks = []
      this.processedSymbols = new Set()
    }
  }

  clearCache(): void {
    localStorage.removeItem('ultraPersistentStockCache')
    this.loadedStocks = []
    this.processedSymbols = new Set()
    console.log('🗑️ Cache cleared')
  }

  getCacheInfo(): { loaded: number; processed: number; total: number } {
    return {
      loaded: this.loadedStocks.length,
      processed: this.processedSymbols.size,
      total: STOCK_SYMBOLS.length
    }
  }

  stop(): void {
    this.isRunning = false
    console.log('🛑 Ultra-persistent loading stopped')
  }
}








