import React, { useState, useEffect } from 'react'
import { Stock } from '../utils/aiFilter'
import { StockCategory } from '../utils/stockAPIService'

interface CategoryTabsProps {
  onCategoryChange: (stocks: Stock[], category: string) => void
  onLoadingChange: (isLoading: boolean) => void
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({ onCategoryChange, onLoadingChange }) => {
  const [categories, setCategories] = useState<StockCategory[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(false)

  // Load categories on mount
  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      console.log('🔄 Loading categories...')
      const response = await fetch('http://localhost:3001/api/categories')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success && data.data) {
        console.log('✅ Categories loaded:', data.data)
        setCategories(data.data)
      } else {
        throw new Error('Failed to load categories')
      }
    } catch (error) {
      console.error('❌ Failed to load categories:', error)
      // Set default categories if server fails
      setCategories([
        { id: 'sp500', name: 'SP500', symbolCount: 365, displayName: 'S&P 500' },
        { id: 'nasdaq', name: 'NASDAQ', symbolCount: 117, displayName: 'NASDAQ 100' },
        { id: 'dow', name: 'DOW', symbolCount: 29, displayName: 'Dow Jones' },
        { id: 'crypto', name: 'CRYPTO', symbolCount: 20, displayName: 'Crypto Stocks' },
        { id: 'ev', name: 'EV', symbolCount: 18, displayName: 'EV Stocks' },
        { id: 'meme', name: 'MEME', symbolCount: 60, displayName: 'Meme Stocks' },
        { id: 'growth', name: 'GROWTH', symbolCount: 52, displayName: 'Growth Stocks' },
        { id: 'international', name: 'INTERNATIONAL', symbolCount: 40, displayName: 'International' }
      ])
    }
  }

  const handleCategoryClick = async (categoryId: string) => {
    if (categoryId === activeCategory || isLoading) {
      console.log(`⚠️ Category ${categoryId} already active or loading`)
      return
    }

    console.log(`🔄 Category clicked: ${categoryId}`)
    setIsLoading(true)
    onLoadingChange(true)
    setActiveCategory(categoryId)

    try {
      let stocks: Stock[] = []

      if (categoryId === 'all') {
        // Load all stocks from the main endpoint
        console.log('📊 Loading all stocks...')
        const response = await fetch('http://localhost:3001/api/stocks')
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        
        if (data.success && data.data) {
          stocks = data.data
          console.log(`✅ Loaded ${stocks.length} total stocks`)
        } else {
          throw new Error('Failed to load all stocks')
        }
      } else {
        // Load stocks for specific category
        console.log(`📂 Loading stocks for category: ${categoryId}`)
        const response = await fetch(`http://localhost:3001/api/stocks/category/${encodeURIComponent(categoryId)}`)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        
        if (data.success && data.data) {
          stocks = data.data
          console.log(`✅ Loaded ${stocks.length} stocks for category "${categoryId}"`)
        } else {
          throw new Error(`Failed to load stocks for category ${categoryId}`)
        }
      }

      console.log(`🎯 Calling onCategoryChange with ${stocks.length} stocks for category ${categoryId}`)
      console.log(`📊 First few stocks:`, stocks.slice(0, 3))
      
      // Call the parent component's handler
      onCategoryChange(stocks, categoryId)
      
    } catch (error) {
      console.error(`❌ Failed to load category ${categoryId}:`, error)
      
      // On error, try to load all stocks as fallback
      try {
        console.log('🔄 Falling back to all stocks...')
        const response = await fetch('http://localhost:3001/api/stocks')
        const data = await response.json()
        
        if (data.success && data.data) {
          onCategoryChange(data.data, 'all')
          setActiveCategory('all')
        }
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError)
        onCategoryChange([], categoryId)
      }
    } finally {
      setIsLoading(false)
      onLoadingChange(false)
    }
  }

  const getCategoryDisplayName = (category: StockCategory) => {
    return category.displayName || category.name
  }

  return (
    <div className="bg-dark-200 border-b border-dark-300 p-4">
      <div className="flex flex-wrap gap-2">
        {/* Major Index Buttons */}
        <div className="flex gap-2 mr-4">
          {/* All Stocks Tab */}
          <button
            onClick={() => handleCategoryClick('all')}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-dark-300 text-gray-300 hover:bg-dark-400'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            📊 All Stocks
          </button>

          {/* S&P 500 Button */}
          <button
            onClick={() => handleCategoryClick('sp500')}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeCategory === 'sp500'
                ? 'bg-green-600 text-white'
                : 'bg-green-700 text-green-100 hover:bg-green-600'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            📈 S&P 500
          </button>

          {/* NASDAQ Button */}
          <button
            onClick={() => handleCategoryClick('nasdaq')}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeCategory === 'nasdaq'
                ? 'bg-purple-600 text-white'
                : 'bg-purple-700 text-purple-100 hover:bg-purple-600'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            💻 NASDAQ
          </button>
        </div>

        {/* Other Category Tabs */}
        <div className="flex flex-wrap gap-2">
          {categories.filter(cat => cat.id !== 'sp500' && cat.id !== 'nasdaq').map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              disabled={isLoading}
              className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                activeCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-dark-300 text-gray-300 hover:bg-dark-400'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {getCategoryDisplayName(category)} ({category.symbolCount})
            </button>
          ))}
        </div>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="mt-2 flex items-center text-blue-400">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-2"></div>
          Loading {activeCategory === 'all' ? 'all stocks' : `${activeCategory} stocks`}...
        </div>
      )}

      {/* Debug info */}
      <div className="mt-2 text-xs text-gray-500">
        Active: {activeCategory} | Categories: {categories.length} | Loading: {isLoading ? 'Yes' : 'No'}
      </div>
    </div>
  )
}

export default CategoryTabs