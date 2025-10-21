import React from 'react'
import { Holding } from '../utils/tradingStorage'
import { Stock } from '../utils/aiFilter'

interface PortfolioProps {
  holdings: Holding[]
  stocks: Stock[]
  onSelectStock: (stock: Stock) => void
}

const Portfolio: React.FC<PortfolioProps> = ({ holdings, stocks, onSelectStock }) => {
  // Calculate current values and gains/losses
  const portfolioData = holdings.map(holding => {
    const currentStock = stocks.find(s => s.ticker === holding.ticker)
    const currentPrice = currentStock?.price || holding.avgPurchasePrice
    const currentValue = holding.shares * currentPrice
    const totalCost = holding.shares * holding.avgPurchasePrice
    const gainLoss = currentValue - totalCost
    const gainLossPercent = (gainLoss / totalCost) * 100

    return {
      ...holding,
      currentPrice,
      currentValue,
      totalCost,
      gainLoss,
      gainLossPercent,
      stock: currentStock
    }
  })

  const totalPortfolioValue = portfolioData.reduce((sum, item) => sum + item.currentValue, 0)
  const totalCost = portfolioData.reduce((sum, item) => sum + item.totalCost, 0)
  const totalGainLoss = totalPortfolioValue - totalCost
  const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0

  if (holdings.length === 0) {
    return (
      <div className="bg-dark-200 rounded-lg p-8 text-center">
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-xl font-semibold text-white mb-2">No Holdings Yet</h3>
        <p className="text-gray-400">Start investing by clicking the "Invest" button on any stock card above!</p>
      </div>
    )
  }

  return (
    <div className="bg-dark-200 rounded-lg p-6">
      {/* Portfolio Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-4">My Portfolio</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-dark-300 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Total Value</div>
            <div className="text-2xl font-bold text-white">
              ${totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-dark-300 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Total Cost</div>
            <div className="text-2xl font-bold text-white">
              ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-dark-300 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Total Gain/Loss</div>
            <div className={`text-2xl font-bold ${totalGainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalGainLoss >= 0 ? '+' : ''}${totalGainLoss.toFixed(2)}
              <span className="text-sm ml-2">
                ({totalGainLoss >= 0 ? '+' : ''}{totalGainLossPercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left text-gray-400 text-sm font-medium pb-3 px-2">Stock</th>
              <th className="text-right text-gray-400 text-sm font-medium pb-3 px-2">Shares</th>
              <th className="text-right text-gray-400 text-sm font-medium pb-3 px-2">Avg Cost</th>
              <th className="text-right text-gray-400 text-sm font-medium pb-3 px-2">Current Price</th>
              <th className="text-right text-gray-400 text-sm font-medium pb-3 px-2">Current Value</th>
              <th className="text-right text-gray-400 text-sm font-medium pb-3 px-2">Gain/Loss</th>
              <th className="text-right text-gray-400 text-sm font-medium pb-3 px-2">%</th>
            </tr>
          </thead>
          <tbody>
            {portfolioData.map((item) => (
              <tr
                key={item.ticker}
                className="border-b border-gray-800 hover:bg-dark-300 cursor-pointer transition-colors"
                onClick={() => item.stock && onSelectStock(item.stock)}
              >
                <td className="py-4 px-2">
                  <div>
                    <div className="text-white font-semibold">{item.ticker}</div>
                    <div className="text-sm text-gray-400">{item.name}</div>
                  </div>
                </td>
                <td className="text-right text-white px-2">
                  {item.shares.toFixed(6)}
                </td>
                <td className="text-right text-white px-2">
                  ${item.avgPurchasePrice.toFixed(2)}
                </td>
                <td className="text-right text-white px-2">
                  ${item.currentPrice.toFixed(2)}
                </td>
                <td className="text-right text-white font-medium px-2">
                  ${item.currentValue.toFixed(2)}
                </td>
                <td className={`text-right font-medium px-2 ${item.gainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {item.gainLoss >= 0 ? '+' : ''}${item.gainLoss.toFixed(2)}
                </td>
                <td className={`text-right font-medium px-2 ${item.gainLossPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {item.gainLossPercent >= 0 ? '+' : ''}{item.gainLossPercent.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Note */}
      <div className="mt-4 text-center text-sm text-gray-500">
        Click on any holding to view detailed stock information
      </div>
    </div>
  )
}

export default Portfolio

