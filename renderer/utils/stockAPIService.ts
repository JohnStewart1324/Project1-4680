import { Stock } from './aiFilter'

// Server API configuration
const API_BASE_URL = 'http://localhost:3001/api'

// Server response interfaces
interface ServerResponse<T> {
  success: boolean
  data: T
  meta?: {
    total?: number
    lastUpdated?: string
    version?: string
    query?: string
  }
  error?: string
  message?: string
}

interface ServerStatus {
  ready: boolean
  stocksLoaded: number
  lastUpdated: string | null
  version: string
  totalSymbols: number
}

interface StockCategory {
  id: string
  name: string
  symbolCount: number
  displayName: string
}

/**
 * Stock API Service - Client-side service to communicate with the server
 */
export class StockAPIService {
  private baseUrl: string
  private isServerAvailable: boolean = false
  private lastStatusCheck: number = 0
  private statusCheckInterval: number = 30000 // 30 seconds

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  /**
   * Check if server is available and ready
   */
  async checkServerStatus(): Promise<boolean> {
    const now = Date.now()
    
    // Skip if we checked recently
    if (now - this.lastStatusCheck < this.statusCheckInterval) {
      console.log(`📡 Using cached server status: ${this.isServerAvailable}`)
      return this.isServerAvailable
    }

    try {
      console.log(`📡 Checking server status at: ${this.baseUrl}/status`)
      const response = await fetch(`${this.baseUrl}/status`)
      
      console.log(`📡 Status response: ${response.status} ${response.statusText}`)
      
      if (!response.ok) {
        console.warn(`⚠️ Server status check failed: ${response.status}`)
        this.isServerAvailable = false
        this.lastStatusCheck = now
        return false
      }

      const data: ServerResponse<ServerStatus> = await response.json()
      
      console.log(`📡 Status data:`, data)
      
      this.isServerAvailable = data.success && data.data.ready
      this.lastStatusCheck = now
      
      console.log(`🖥️ Server status: ${this.isServerAvailable ? 'Ready' : 'Not ready'} (${data.data.stocksLoaded} stocks)`)
      return this.isServerAvailable
    } catch (error) {
      console.warn('⚠️ Server not available:', error)
      this.isServerAvailable = false
      this.lastStatusCheck = now
      return false
    }
  }

  /**
   * Get all stocks from server
   */
  async getAllStocks(): Promise<Stock[]> {
    try {
      console.log(`📡 Fetching stocks from: ${this.baseUrl}/stocks`)
      const response = await fetch(`${this.baseUrl}/stocks`)
      
      console.log(`📡 Response status: ${response.status} ${response.statusText}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: ServerResponse<Stock[]> = await response.json()
      
      console.log(`📡 Response data:`, data)
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch stocks')
      }

      console.log(`📊 Fetched ${data.data.length} stocks from server`)
      return data.data
    } catch (error) {
      console.error('❌ Error fetching stocks from server:', error)
      throw error
    }
  }

  /**
   * Get specific stock by ticker
   */
  async getStock(ticker: string): Promise<Stock | null> {
    try {
      const response = await fetch(`${this.baseUrl}/stocks/${ticker}`)
      
      if (response.status === 404) {
        return null
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: ServerResponse<Stock> = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch stock')
      }

      return data.data
    } catch (error) {
      console.error(`❌ Error fetching stock ${ticker}:`, error)
      throw error
    }
  }

  /**
   * Search stocks
   */
  async searchStocks(query: string): Promise<Stock[]> {
    try {
      const response = await fetch(`${this.baseUrl}/stocks/search/${encodeURIComponent(query)}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: ServerResponse<Stock[]> = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to search stocks')
      }

      console.log(`🔍 Found ${data.data.length} stocks matching "${query}"`)
      return data.data
    } catch (error) {
      console.error(`❌ Error searching stocks for "${query}":`, error)
      throw error
    }
  }

  /**
   * Get stocks by category
   */
  async getStocksByCategory(category: string): Promise<Stock[]> {
    try {
      const response = await fetch(`${this.baseUrl}/stocks/category/${encodeURIComponent(category)}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: ServerResponse<Stock[]> = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch stocks by category')
      }

      console.log(`📊 Fetched ${data.data.length} stocks from category "${category}"`)
      return data.data
    } catch (error) {
      console.error(`❌ Error fetching stocks for category "${category}":`, error)
      throw error
    }
  }

  /**
   * Get available categories
   */
  async getCategories(): Promise<StockCategory[]> {
    try {
      const response = await fetch(`${this.baseUrl}/categories`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: ServerResponse<StockCategory[]> = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch categories')
      }

      console.log(`📂 Fetched ${data.data.length} categories`)
      return data.data
    } catch (error) {
      console.error('❌ Error fetching categories:', error)
      throw error
    }
  }

  /**
   * Get server status information
   */
  async getServerStatus(): Promise<ServerStatus | null> {
    try {
      const response = await fetch(`${this.baseUrl}/status`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: ServerResponse<ServerStatus> = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get server status')
      }

      return data.data
    } catch (error) {
      console.error('❌ Error getting server status:', error)
      return null
    }
  }

  /**
   * Check if server is available (cached)
   */
  isAvailable(): boolean {
    return this.isServerAvailable
  }

  /**
   * Get API base URL
   */
  getBaseUrl(): string {
    return this.baseUrl
  }
}

// Export singleton instance
export const stockAPIService = new StockAPIService()

// Export types for use in components
export type { ServerResponse, ServerStatus, StockCategory }
