import React from 'react'
import { Stock } from '../utils/aiFilter'
import ChartView from '../components/ChartView'
import AIAnalysis from '../components/AIAnalysis'

interface DetailsProps {
  stock: Stock
  onBack: () => void
}

const Details: React.FC<DetailsProps> = ({ stock, onBack }) => {
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
    <div className="min-h-screen bg-dark-100">
      {/* Header */}
      <header className="bg-dark-200 border-b border-dark-300 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="btn-secondary flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">{stock.ticker}</h1>
              <p className="text-gray-400">{stock.name}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-white">${stock.price.toFixed(2)}</div>
            <div className={`text-lg font-medium ${isPositiveChange ? 'positive-change' : 'negative-change'}`}>
              {isPositiveChange ? '+' : ''}{stock.change.toFixed(2)} ({isPositiveChange ? '+' : ''}{stock.changePercent.toFixed(2)}%)
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Chart Section - Narrower Width Above */}
          <div className="mb-6 max-w-4xl mx-auto">
            <ChartView stock={stock} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Key Metrics */}
            <div className="lg:col-span-1 space-y-6">
              {/* Basic Info */}
              <div className="card">
                <h3 className="text-lg font-semibold text-white mb-4">Company Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Ticker Symbol</span>
                    <span className="text-white font-medium">{stock.ticker}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Company Name</span>
                    <span className="text-white font-medium text-right">{stock.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sector</span>
                    <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm">
                      {stock.sector}
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial Metrics */}
              <div className="card">
                <h3 className="text-lg font-semibold text-white mb-4">Financial Metrics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Current Price</span>
                    <span className="text-white font-medium">${stock.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Volume</span>
                    <span className="text-white font-medium">{formatVolume(stock.volume)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Daily Change</span>
                    <span className={`font-medium ${isPositiveChange ? 'positive-change' : 'negative-change'}`}>
                      {isPositiveChange ? '+' : ''}{stock.change.toFixed(2)} ({isPositiveChange ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Column - AI Analysis and Risk Assessment */}
            <div className="lg:col-span-2 space-y-6">
              {/* AI Analysis */}
              <AIAnalysis stock={stock} />

              {/* Risk Assessment */}
              <div className="card">
                <h3 className="text-lg font-semibold text-white mb-4">Risk Assessment</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Volatility</span>
                    <div className="flex items-center">
                      <div className="w-24 bg-dark-300 rounded-full h-2 mr-2">
                        <div 
                          className="bg-yellow-400 h-2 rounded-full" 
                          style={{ width: `${Math.min(100, Math.abs(stock.changePercent) * 20)}%` }}
                        ></div>
                      </div>
                      <span className="text-white text-sm">
                        {Math.abs(stock.changePercent) < 1 ? 'Low' : Math.abs(stock.changePercent) < 3 ? 'Medium' : 'High'}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Liquidity</span>
                    <div className="flex items-center">
                      <div className="w-24 bg-dark-300 rounded-full h-2 mr-2">
                        <div 
                          className="bg-green-400 h-2 rounded-full" 
                          style={{ width: `${Math.min(100, (stock.volume / 50000000) * 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-white text-sm">
                        {stock.volume > 30000000 ? 'High' : stock.volume > 10000000 ? 'Medium' : 'Low'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Details
