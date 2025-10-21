import React from 'react'
import { Stock } from '../utils/aiFilter'
import { generateAIInsight } from '../utils/aiFilter'

interface StockCardProps {
  stock: Stock
  onSelect: (stock: Stock) => void
  onInvest: (stock: Stock) => void
  searchQuery?: string
}

const StockCard: React.FC<StockCardProps> = ({ stock, onSelect, onInvest, searchQuery = '' }) => {
  const formatMarketCap = (marketCap: number | null): string => {
    if (marketCap === null) return '—'
    if (marketCap >= 1e12) {
      return `$${(marketCap / 1e12).toFixed(1)}T`
    } else if (marketCap >= 1e9) {
      return `$${(marketCap / 1e9).toFixed(1)}B`
    } else if (marketCap >= 1e6) {
      return `$${(marketCap / 1e6).toFixed(1)}M`
    }
    return `$${marketCap.toLocaleString()}`
  }

  const formatVolume = (volume: number): string => {
    if (volume >= 1e6) {
      return `${(volume / 1e6).toFixed(1)}M`
    } else if (volume >= 1e3) {
      return `${(volume / 1e3).toFixed(1)}K`
    }
    return volume.toLocaleString()
  }

  const isPositiveChange = stock.changePercent >= 0

  return (
    <div 
      className="stock-card fade-in"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-xl font-bold text-white">{stock.ticker}</h3>
          <p className="text-sm text-gray-400">{stock.name}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">${stock.price.toFixed(2)}</div>
          <div className={`text-sm font-medium ${isPositiveChange ? 'positive-change' : 'negative-change'}`}>
            {isPositiveChange ? '+' : ''}{stock.change.toFixed(2)} ({isPositiveChange ? '+' : ''}{stock.changePercent.toFixed(2)}%)
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 mb-4">
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">Volume</div>
          <div className="text-lg font-semibold text-white">{formatVolume(stock.volume)}</div>
        </div>
      </div>

      {/* Sector Badge */}
      <div className="mb-3">
        <span className="inline-block bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
          {stock.sector}
        </span>
      </div>

      {/* AI Insight */}
      <div className="bg-dark-300 rounded-md p-3">
        <div className="flex items-start">
          <div className="text-yellow-400 mr-2 text-sm">🤖</div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">AI Insight</div>
            <div className="text-sm text-gray-300">
              {generateAIInsight(stock, searchQuery)}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onInvest(stock)
          }}
          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          💰 Invest
        </button>
        <button
          onClick={() => onSelect(stock)}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          📊 Details
        </button>
      </div>
    </div>
  )
}

export default StockCard
