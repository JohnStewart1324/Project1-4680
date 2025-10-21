import { Stock } from './aiFilter'
import { getMultipleStocksData, convertToStock } from './stockDataService'
import { STOCK_SYMBOLS } from './stockSymbols'

export class SmartLoader {
  private batchSize: number = 2 // Very small batches
  private delayBetweenBatches: number = 500 // Short delay
  private maxRetries: number = 1 // Only 1 retry
  private retryDelay: number = 1000
  private maxConsecutiveFailures: number = 3
  private batchTimeout: number = 5000 // 5 second timeout
  private consecutiveFailures: number = 0
  private loadedStocks: Stock[] = []
  private processedSymbols: Set<string> = new Set()
  private isRunning: boolean = false
  private onProgress?: (progress: { loaded: number; total: number }) => void
  private onUpdate?: (stocks: Stock[]) => void
  private onComplete?: (stocks: Stock[]) => void
  private onError?: (error: string) => void
  private startTime: number = 0

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
      console.log('🚀 Starting SMART loading...')
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

      // Process remaining symbols with smart strategy
      await this.processSymbolsSmart(remainingSymbols)

      console.log(`🎉 SMART loading completed! Loaded ${this.loadedStocks.length} stocks`)
      this.onComplete?.(this.loadedStocks)
      return this.loadedStocks

    } catch (error) {
      const errorMsg = `Smart loading failed: ${error}`
      console.error('❌', errorMsg)
      this.onError?.(errorMsg)
      throw error
    } finally {
      this.isRunning = false
    }
  }

  private async processSymbolsSmart(symbols: string[]): Promise<void> {
    const batches = this.createBatches(symbols)
    let totalProcessed = 0
    let successfulBatches = 0

    console.log(`🔄 Processing ${batches.length} batches with smart strategy`)

    for (let i = 0; i < batches.length && this.isRunning; i++) {
      const batch = batches[i]
      console.log(`📦 Processing batch ${i + 1}/${batches.length} (${batch.length} symbols)`)

      // Check if we've been running too long (30 seconds max)
      const elapsed = Date.now() - this.startTime
      if (elapsed > 30000) {
        console.log('⏰ Time limit reached (30s), stopping smart loading')
        break
      }

      let batchSuccess = false
      let batchRetries = 0

      // Retry logic for each batch
      while (!batchSuccess && batchRetries < this.maxRetries && this.isRunning) {
        try {
          const batchStocks = await this.loadBatchWithTimeout(batch)
          
          if (batchStocks.length > 0) {
            this.loadedStocks.push(...batchStocks)
            batch.forEach(symbol => this.processedSymbols.add(symbol))
            totalProcessed += batchStocks.length
            successfulBatches++
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
            const delay = this.retryDelay
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
        console.error(`❌ Too many consecutive failures (${this.consecutiveFailures}), stopping smart loading`)
        this.onError?.(`Stopped after ${this.consecutiveFailures} consecutive failures`)
        break
      }

      // If we have some stocks loaded and it's been running for a while, consider it successful
      if (this.loadedStocks.length > 50 && elapsed > 10000) {
        console.log(`✅ Smart loading: ${this.loadedStocks.length} stocks loaded in ${elapsed/1000}s, considering successful`)
        break
      }

      // Delay between batches
      if (i < batches.length - 1 && this.isRunning) {
        await this.delay(this.delayBetweenBatches)
      }
    }

    console.log(`🏁 Smart processing completed. Total processed: ${totalProcessed}, Successful batches: ${successfulBatches}`)
  }

  private async loadBatchWithTimeout(symbols: string[]): Promise<Stock[]> {
    try {
      console.log(`🔄 Loading batch: ${symbols.join(', ')}`)
      
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
      console.error(`❌ Batch load failed:`, error)
      return [] // Return empty array instead of throwing
    }
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
      localStorage.setItem('smartStockCache', JSON.stringify(cacheData))
      console.log(`💾 Cache saved: ${this.loadedStocks.length} stocks, ${this.processedSymbols.size} processed symbols`)
    } catch (error) {
      console.warn('⚠️ Failed to save cache:', error)
    }
  }

  private loadFromCache(): void {
    try {
      const cached = localStorage.getItem('smartStockCache')
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
    localStorage.removeItem('smartStockCache')
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
    console.log('🛑 Smart loading stopped')
  }

  resetFailures(): void {
    this.consecutiveFailures = 0
    console.log('🔄 Failure count reset')
  }
}







