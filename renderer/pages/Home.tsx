import React from 'react'
import { Stock } from '../utils/aiFilter'
import { ServerLoadingProgress } from '../utils/serverStockLoader'
import SearchBar from '../components/SearchBar'
import Sidebar from '../components/Sidebar'
import LiveStockDisplay from '../components/LiveStockDisplay'
import LiveDebugPanel from '../components/LiveDebugPanel'

interface HomeProps {
  stocks: Stock[]
  searchQuery: string
  isLoading: boolean
  isLoadingStocks?: boolean
  loadingProgress?: ServerLoadingProgress
  activeFilter: string
  onSearch: (query: string) => void
  onFilterSelect: (filterId: string) => void
  onStockSelect: (stock: Stock) => void
  onResetFilters: () => void
  onRetryLoading?: () => void
  onStopLoading?: () => void
  onCategoryChange?: (stocks: Stock[], category: string) => void
}

const Home: React.FC<HomeProps> = ({
  stocks,
  searchQuery,
  isLoading,
  isLoadingStocks = false,
  loadingProgress = { 
    loaded: 0, 
    total: 0, 
    currentSymbol: '', 
    percentage: 0, 
    isFromServer: false,
    isLoading: false
  },
  activeFilter,
  onSearch,
  onFilterSelect,
  onStockSelect,
  onResetFilters,
  onRetryLoading,
  onStopLoading,
  onCategoryChange
}) => {
  return (
    <div className="h-screen flex bg-dark-100 text-white">
      {/* Live Debug Panel */}
      <LiveDebugPanel 
        loadingProgress={loadingProgress} 
        isLoading={isLoadingStocks}
        onRetryLoading={onRetryLoading}
        onStopLoading={onStopLoading}
      />
      
      {/* Sidebar */}
      <aside className="w-72 border-r border-dark-300 p-4 flex-shrink-0">
        <Sidebar
          activeFilter={activeFilter}
          onFilterSelect={onFilterSelect}
          onResetFilters={onResetFilters}
        />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-20 flex-none border-b border-dark-300 p-4 bg-dark-200">
          <div className="flex items-center justify-between h-full">
            <div>
              <h1 className="text-2xl font-bold text-white">Stock Viewer</h1>
              <p className="text-sm text-gray-400">Real-time stock data with AI-powered insights</p>
            </div>
          </div>
        </header>

        {/* Search Bar */}
        <div className="flex-none p-4 bg-dark-200 border-b border-dark-300">
          <SearchBar
            value={searchQuery}
            onSearch={onSearch}
            isLoading={isLoading}
          />
        </div>


        {/* Stock List Section - Scrollable */}
        <section 
          className="flex-1 overflow-y-auto p-4" 
          id="stock-list"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <LiveStockDisplay
            stocks={stocks}
            isLoading={isLoadingStocks}
            loadingProgress={loadingProgress}
            onStockSelect={onStockSelect}
          />
        </section>
      </main>
    </div>
  )
}

export default Home