import { Stock } from './aiFilter'
import { stockAPIService, ServerStatus, StockCategory } from './stockAPIService'

/**
 * Server-based Stock Loader - Uses the backend API for stock data
 * This replaces the client-side loading with server-based data fetching
 */

export interface ServerLoadingProgress {
  loaded: number
  total: number
  currentSymbol: string
  percentage: number
  isFromServer: boolean
  isLoading: boolean
  serverStatus?: ServerStatus
}

export class ServerStockLoader {
  private isRunning = false
  private loadedStocks: Stock[] = []
  private serverStatus: ServerStatus | null = null
  private retryCount = 0
  private maxRetries = 3
  private retryDelay = 5000 // 5 seconds

  constructor() {
    // Initialize by checking server status
    this.checkServerStatus()
  }

  /**
   * Load all stocks from server
   */
  async loadAllStocks(
    onProgress?: (progress: ServerLoadingProgress) => void,
    onComplete?: (stocks: Stock[]) => void,
    onError?: (error: string) => void
  ): Promise<Stock[]> {
    this.isRunning = true

    try {
      console.log('🚀 Starting SERVER-BASED stock loading...')

      // Check server status first
      const isServerReady = await this.checkServerStatus()
      
      if (!isServerReady) {
        throw new Error('Server is not available or not ready')
      }

      // Update progress with server status
      const progress: ServerLoadingProgress = {
        loaded: this.serverStatus?.stocksLoaded || 0,
        total: this.serverStatus?.stocksLoaded || 0,
        currentSymbol: 'Server',
        percentage: 100,
        isFromServer: true,
        isLoading: true,
        serverStatus: this.serverStatus
      }

      onProgress?.(progress)

      // Fetch all stocks from server
      console.log('📡 Fetching stocks from server...')
      const stocks = await stockAPIService.getAllStocks()

      if (stocks && stocks.length > 0) {
        this.loadedStocks = stocks
        console.log(`🎉 SERVER LOADING completed! Loaded ${stocks.length} stocks`)
        
        // Update progress to show completion
        const completedProgress: ServerLoadingProgress = {
          loaded: stocks.length,
          total: stocks.length,
          currentSymbol: 'Complete',
          percentage: 100,
          isFromServer: true,
          isLoading: false,
          serverStatus: this.serverStatus
        }
        
        onProgress?.(completedProgress)
        onComplete?.(stocks)
        return stocks
      } else {
        throw new Error('No stocks received from server')
      }

    } catch (error) {
      const errorMsg = `Server loading failed: ${error instanceof Error ? error.message : String(error)}`
      console.error('❌', errorMsg)
      
      // Try to retry if we haven't exceeded max retries
      if (this.retryCount < this.maxRetries) {
        this.retryCount++
        console.log(`🔄 Retrying server connection (attempt ${this.retryCount}/${this.maxRetries})...`)
        
        await this.delay(this.retryDelay)
        return this.loadAllStocks(onProgress, onComplete, onError)
      }
      
      onError?.(errorMsg)
      return []
    } finally {
      this.isRunning = false
    }
  }

  /**
   * Check server status
   */
  private async checkServerStatus(): Promise<boolean> {
    try {
      const status = await stockAPIService.getServerStatus()
      
      if (status) {
        this.serverStatus = status
        console.log(`🖥️ Server status: Ready=${status.ready}, Stocks=${status.stocksLoaded}, LastUpdated=${status.lastUpdated}`)
        return status.ready
      }
      
      return false
    } catch (error) {
      console.warn('⚠️ Failed to check server status:', error)
      return false
    }
  }

  /**
   * Search stocks using server API
   */
  async searchStocks(query: string): Promise<Stock[]> {
    try {
      console.log(`🔍 Searching stocks for: "${query}"`)
      const stocks = await stockAPIService.searchStocks(query)
      console.log(`✅ Found ${stocks.length} stocks matching "${query}"`)
      return stocks
    } catch (error) {
      console.error(`❌ Error searching stocks:`, error)
      return []
    }
  }

  /**
   * Get specific stock by ticker
   */
  async getStock(ticker: string): Promise<Stock | null> {
    try {
      console.log(`📊 Fetching stock: ${ticker}`)
      const stock = await stockAPIService.getStock(ticker)
      return stock
    } catch (error) {
      console.error(`❌ Error fetching stock ${ticker}:`, error)
      return null
    }
  }

  /**
   * Refresh stock data on server
   */
  async refreshStocks(): Promise<boolean> {
    try {
      console.log('🔄 Refreshing stock data on server...')
      const success = await stockAPIService.refreshStocks()
      
      if (success) {
        // Update our local status
        await this.checkServerStatus()
        console.log('✅ Stock data refreshed successfully')
      }
      
      return success
    } catch (error) {
      console.error('❌ Error refreshing stocks:', error)
      return false
    }
  }

  /**
   * Get stocks by category
   */
  async getStocksByCategory(category: string): Promise<Stock[]> {
    try {
      console.log(`📂 Fetching stocks for category: ${category}`)
      const stocks = await stockAPIService.getStocksByCategory(category)
      console.log(`✅ Found ${stocks.length} stocks in category "${category}"`)
      return stocks
    } catch (error) {
      console.error(`❌ Error fetching stocks for category "${category}":`, error)
      return []
    }
  }

  /**
   * Get available categories
   */
  async getCategories(): Promise<StockCategory[]> {
    try {
      console.log('📂 Fetching available categories...')
      const categories = await stockAPIService.getCategories()
      console.log(`✅ Found ${categories.length} categories`)
      return categories
    } catch (error) {
      console.error('❌ Error fetching categories:', error)
      return []
    }
  }

  /**
   * Get server status
   */
  async getServerStatus(): Promise<ServerStatus | null> {
    return await stockAPIService.getServerStatus()
  }

  /**
   * Check if server is available
   */
  async isServerAvailable(): Promise<boolean> {
    return await stockAPIService.checkServerStatus()
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
   * Stop loading
   */
  stop(): void {
    this.isRunning = false
    console.log('🛑 Server loading stopped')
  }

  /**
   * Reset retry count
   */
  resetRetries(): void {
    this.retryCount = 0
    console.log('🔄 Retry count reset')
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Export singleton instance
export const serverStockLoader = new ServerStockLoader()
