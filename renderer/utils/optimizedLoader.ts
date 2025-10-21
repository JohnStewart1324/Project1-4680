import { Stock } from './aiFilter'
import { getMultipleStocksData, convertToStock } from './stockDataService'
import { STOCK_SYMBOLS } from './stockSymbols'

export class OptimizedLoader {
  private batchSize: number = 3 // Smaller batches for better reliability
  private delayBetweenBatches: number = 1000 // 1 second delay between batches
  private maxRetries: number = 2
  private retryDelay: number = 2000
  private maxConsecutiveFailures: number = 5
  private batchTimeout: number = 10000 // 10 second timeout per batch
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
      console.log('🚀 Starting OPTIMIZED loading...')
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

      // Process remaining symbols with optimized strategy
      await this.processSymbolsOptimized(remainingSymbols)

      console.log(`🎉 OPTIMIZED loading completed! Loaded ${this.loadedStocks.length} stocks`)
      this.onComplete?.(this.loadedStocks)
      return this.loadedStocks

    } catch (error) {
      const errorMsg = `Optimized loading failed: ${error}`
      console.error('❌', errorMsg)
      this.onError?.(errorMsg)
      throw error
    } finally {
      this.isRunning = false
    }
  }

  private async processSymbolsOptimized(symbols: string[]): Promise<void> {
    const batches = this.createBatches(symbols)
    let totalProcessed = 0

    console.log(`🔄 Processing ${batches.length} batches with optimized strategy`)

    for (let i = 0; i < batches.length && this.isRunning; i++) {
      const batch = batches[i]
      console.log(`📦 Processing batch ${i + 1}/${batches.length} (${batch.length} symbols)`)

      let batchSuccess = false
      let batchRetries = 0

      // Retry logic for each batch
      while (!batchSuccess && batchRetries < this.maxRetries && this.isRunning) {
        try {
          const batchStocks = await this.loadBatchWithRetry(batch)
          
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
            const delay = this.retryDelay * Math.pow(1.5, batchRetries - 1) // Gradual backoff
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
        console.error(`❌ Too many consecutive failures (${this.consecutiveFailures}), stopping optimized loading`)
        this.onError?.(`Stopped after ${this.consecutiveFailures} consecutive failures`)
        break
      }

      // Delay between batches
      if (i < batches.length - 1 && this.isRunning) {
        await this.delay(this.delayBetweenBatches)
      }
    }

    console.log(`🏁 Optimized processing completed. Total processed: ${totalProcessed}`)
  }

  private async loadBatchWithRetry(symbols: string[]): Promise<Stock[]> {
    let retries = 0
    const maxBatchRetries = 2

    while (retries < maxBatchRetries) {
      try {
        console.log(`🔄 Loading batch: ${symbols.join(', ')} (attempt ${retries + 1})`)
        
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Batch timeout')), this.batchTimeout)
        })
        
        const dataPromise = getMultipleStocksData(symbols)
        const realData = await Promise.race([dataPromise, timeoutPromise])
        
        if (realData && realData.length > 0) {
          const stocks = realData.map(convertToStock)
          console.log(`✅ Batch loaded successfully: ${stocks.length} stocks`)
          return stocks
        } else {
          throw new Error('No stocks returned from API')
        }

      } catch (error) {
        retries++
        console.warn(`⚠️ Batch load failed (attempt ${retries}/${maxBatchRetries}):`, error)
        
        if (retries < maxBatchRetries) {
          const delay = 1000 * retries // Shorter delay
          console.log(`⏳ Retrying batch in ${delay}ms...`)
          await this.delay(delay)
        } else {
          console.error(`❌ Batch failed after ${maxBatchRetries} attempts, skipping`)
          return [] // Return empty array instead of throwing
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
      localStorage.setItem('optimizedStockCache', JSON.stringify(cacheData))
      console.log(`💾 Cache saved: ${this.loadedStocks.length} stocks, ${this.processedSymbols.size} processed symbols`)
    } catch (error) {
      console.warn('⚠️ Failed to save cache:', error)
    }
  }

  private loadFromCache(): void {
    try {
      const cached = localStorage.getItem('optimizedStockCache')
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
    localStorage.removeItem('optimizedStockCache')
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
    console.log('🛑 Optimized loading stopped')
  }

  resetFailures(): void {
    this.consecutiveFailures = 0
    console.log('🔄 Failure count reset')
  }
}
