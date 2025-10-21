import React, { useState, useEffect } from 'react'
import { Stock } from '../utils/aiFilter'
import { ServerLoadingProgress } from '../utils/serverStockLoader'
import SkeletonCard from './SkeletonCard'

interface LiveStockDisplayProps {
  stocks: Stock[]
  isLoading: boolean
  loadingProgress: ServerLoadingProgress
  onStockSelect: (stock: Stock) => void
}

const LiveStockDisplay: React.FC<LiveStockDisplayProps> = ({
  stocks,
  isLoading,
  loadingProgress,
  onStockSelect
}) => {
  const [displayedStocks, setDisplayedStocks] = useState<Stock[]>([])
  const [newStocksCount, setNewStocksCount] = useState(0)

  // Update displayed stocks when new ones are loaded
  useEffect(() => {
    if (stocks.length > displayedStocks.length) {
      const newStocks = stocks.slice(displayedStocks.length)
      setNewStocksCount(newStocks.length)
      setDisplayedStocks(stocks)
      
      // Clear the new stocks count after 3 seconds
      setTimeout(() => setNewStocksCount(0), 3000)
    }
  }, [stocks, displayedStocks.length])

  return (
    <div className="w-full">
      {/* Simple Header */}
      <div className="bg-dark-200 border-b border-dark-300 p-4 mb-4 rounded-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            📊 Stock Market Data
            {loadingProgress.isFromServer && (
              <span className="ml-2 text-green-400">
                ✅ Connected to server
              </span>
            )}
          </h2>
          <div className="text-sm text-gray-400">
            {loadingProgress.loaded} stocks available
            {loadingProgress.serverStatus && (
              <div className="text-xs text-blue-400">
                Last updated: {new Date(loadingProgress.serverStatus.lastUpdated || '').toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stock Content */}
      <div className="w-full">
        {isLoading && displayedStocks.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="spinner mx-auto mb-4"></div>
              <p className="text-gray-400">Starting to load stocks...</p>
            </div>
          </div>
        ) : displayedStocks.length === 0 ? (
          <div className="text-center text-gray-400 py-10">
            <p className="text-lg mb-2">No stocks loaded yet.</p>
            <p className="text-sm">Stocks will appear here as they are loaded.</p>
          </div>
        ) : (
          <>
            {/* New Stocks Alert */}
            {newStocksCount > 0 && (
              <div className="mb-4 p-3 bg-green-900 border border-green-700 rounded-lg">
                <p className="text-green-400 text-sm">
                  🎉 {newStocksCount} new stocks just loaded! Scroll down to see them.
                </p>
              </div>
            )}

            {/* Stock Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-8">
              {displayedStocks.map((stock, index) => (
                <div
                  key={stock.ticker}
                  className={`card hover:bg-dark-300 transition-all duration-200 cursor-pointer ${
                    index >= displayedStocks.length - newStocksCount ? 'animate-pulse border-green-500' : ''
                  }`}
                  onClick={() => onStockSelect(stock)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-white text-lg">{stock.ticker}</h3>
                    <span className="text-xs text-gray-400">#{index + 1}</span>
                  </div>
                  
                  <p className="text-gray-300 text-sm mb-2 truncate">{stock.name}</p>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-xs">Price:</span>
                      <span className="text-white font-semibold">${stock.price.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-xs">Change:</span>
                      <span className={stock.change >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-xs">Sector:</span>
                      <span className="text-blue-400 text-xs">{stock.sector}</span>
                    </div>
                  </div>

                  {/* Loading indicator for newest stocks */}
                  {index >= displayedStocks.length - newStocksCount && (
                    <div className="mt-2 text-xs text-green-400 flex items-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                      Just loaded
                    </div>
                  )}
                </div>
              ))}
            </div>

          </>
        )}
      </div>
    </div>
  )
}

export default LiveStockDisplay

