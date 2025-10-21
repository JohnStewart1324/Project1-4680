import { Stock } from './aiFilter'

const API_BASE_URL = 'http://localhost:3001/api'

export interface ServerStatus {
  ready: boolean
  stocksLoaded: number
  lastUpdated: string
}

export interface StockCategory {
  id: string
  name: string
  count: number
}

class StockAPIService {
  /**
   * Get all stocks from server
   */
  async getAllStocks(): Promise<Stock[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/stocks`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data = await response.json()
      return data.success ? (data.data || []) : []
    } catch (error) {
      console.error('Error fetching all stocks:', error)
      throw error
    }
  }

  /**
   * Get specific stock by ticker
   */
  async getStock(ticker: string): Promise<Stock | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/stocks/${ticker}`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data = await response.json()
      return data.success ? data.data : null
    } catch (error) {
      console.error(`Error fetching stock ${ticker}:`, error)
      throw error
    }
  }

  /**
   * Search stocks
   */
  async searchStocks(query: string): Promise<Stock[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/stocks/search/${encodeURIComponent(query)}`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data = await response.json()
      return data.success ? (data.data || []) : []
    } catch (error) {
      console.error('Error searching stocks:', error)
      throw error
    }
  }

  /**
   * Get stocks by category
   */
  async getStocksByCategory(category: string): Promise<Stock[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/stocks/category/${category}`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data = await response.json()
      return data.success ? (data.data || []) : []
    } catch (error) {
      console.error(`Error fetching stocks for category ${category}:`, error)
      throw error
    }
  }

  /**
   * Get available categories
   */
  async getCategories(): Promise<StockCategory[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data = await response.json()
      return data.success ? (data.data || []) : []
    } catch (error) {
      console.error('Error fetching categories:', error)
      throw error
    }
  }

  /**
   * Get server status
   */
  async getServerStatus(): Promise<ServerStatus | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/status`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data = await response.json()
      return data.success ? data.data : null
    } catch (error) {
      console.error('Error fetching server status:', error)
      return null
    }
  }

  /**
   * Check if server is available
   */
  async checkServerStatus(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:3001/health')
      return response.ok
    } catch (error) {
      return false
    }
  }

  /**
   * Refresh stock data on server
   */
  async refreshStocks(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/refresh`, {
        method: 'POST'
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data = await response.json()
      return data.success
    } catch (error) {
      console.error('Error refreshing stocks:', error)
      return false
    }
  }
}

export const stockAPIService = new StockAPIService()

