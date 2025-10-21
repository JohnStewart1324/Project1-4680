import React, { useState } from 'react'
import { Stock } from '../utils/aiFilter'

interface InvestmentModalProps {
  stock: Stock
  balance: number
  onInvest: (shares: number, totalCost: number) => void
  onClose: () => void
}

const InvestmentModal: React.FC<InvestmentModalProps> = ({ stock, balance, onInvest, onClose }) => {
  const [investmentAmount, setInvestmentAmount] = useState('')
  const [shares, setShares] = useState('')
  const [inputMode, setInputMode] = useState<'amount' | 'shares'>('amount')

  const handleAmountChange = (value: string) => {
    setInvestmentAmount(value)
    const amount = parseFloat(value)
    if (!isNaN(amount) && amount > 0) {
      const calculatedShares = amount / stock.price
      setShares(calculatedShares.toFixed(6))
    } else {
      setShares('')
    }
  }

  const handleSharesChange = (value: string) => {
    setShares(value)
    const numShares = parseFloat(value)
    if (!isNaN(numShares) && numShares > 0) {
      const calculatedAmount = numShares * stock.price
      setInvestmentAmount(calculatedAmount.toFixed(2))
    } else {
      setInvestmentAmount('')
    }
  }

  const handleInvest = () => {
    const numShares = parseFloat(shares)
    const totalCost = parseFloat(investmentAmount)

    if (isNaN(numShares) || isNaN(totalCost) || numShares <= 0 || totalCost <= 0) {
      alert('Please enter a valid amount')
      return
    }

    if (totalCost > balance) {
      alert('Insufficient funds!')
      return
    }

    onInvest(numShares, totalCost)
  }

  const totalCost = parseFloat(investmentAmount) || 0
  const canAfford = totalCost > 0 && totalCost <= balance
  const numShares = parseFloat(shares) || 0

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-dark-200 rounded-lg p-6 max-w-lg w-full mx-4 border border-gray-700" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Invest in {stock.ticker}</h2>
          <p className="text-gray-400">{stock.name}</p>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-400">Current Price:</span>
              <span className="text-xl font-bold text-white ml-2">${stock.price.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-sm text-gray-400">Your Balance:</span>
              <span className="text-xl font-bold text-green-400 ml-2">
                ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Input Mode Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setInputMode('amount')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              inputMode === 'amount' ? 'bg-blue-600 text-white' : 'bg-dark-300 text-gray-400 hover:bg-dark-400'
            }`}
          >
            By Dollar Amount
          </button>
          <button
            onClick={() => setInputMode('shares')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              inputMode === 'shares' ? 'bg-blue-600 text-white' : 'bg-dark-300 text-gray-400 hover:bg-dark-400'
            }`}
          >
            By Number of Shares
          </button>
        </div>

        {/* Investment Input */}
        {inputMode === 'amount' ? (
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">Investment Amount ($)</label>
            <input
              type="number"
              value={investmentAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="Enter dollar amount..."
              className="w-full bg-dark-300 text-white border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500"
              autoFocus
              min="0"
              step="0.01"
            />
          </div>
        ) : (
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">Number of Shares</label>
            <input
              type="number"
              value={shares}
              onChange={(e) => handleSharesChange(e.target.value)}
              placeholder="Enter number of shares..."
              className="w-full bg-dark-300 text-white border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500"
              autoFocus
              min="0"
              step="0.000001"
            />
          </div>
        )}

        {/* Quick Amount Buttons */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <button
            onClick={() => handleAmountChange('100')}
            className="px-3 py-2 bg-dark-300 hover:bg-dark-400 text-white rounded text-sm"
          >
            $100
          </button>
          <button
            onClick={() => handleAmountChange('500')}
            className="px-3 py-2 bg-dark-300 hover:bg-dark-400 text-white rounded text-sm"
          >
            $500
          </button>
          <button
            onClick={() => handleAmountChange('1000')}
            className="px-3 py-2 bg-dark-300 hover:bg-dark-400 text-white rounded text-sm"
          >
            $1,000
          </button>
          <button
            onClick={() => handleAmountChange(balance.toString())}
            className="px-3 py-2 bg-dark-300 hover:bg-dark-400 text-white rounded text-sm"
          >
            Max
          </button>
        </div>

        {/* Summary */}
        {totalCost > 0 && (
          <div className="bg-dark-300 rounded-lg p-4 mb-4">
            <h3 className="text-sm text-gray-400 uppercase tracking-wide mb-3">Investment Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Shares:</span>
                <span className="text-white font-medium">{numShares.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Price per Share:</span>
                <span className="text-white font-medium">${stock.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-600 pt-2">
                <span className="text-gray-400 font-medium">Total Cost:</span>
                <span className="text-white font-bold">${totalCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Remaining Balance:</span>
                <span className={`font-medium ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
                  ${(balance - totalCost).toFixed(2)}
                </span>
              </div>
            </div>
            {!canAfford && (
              <div className="mt-3 text-red-400 text-sm">
                ⚠️ Insufficient funds! You need ${(totalCost - balance).toFixed(2)} more.
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleInvest}
            disabled={!canAfford || totalCost <= 0}
            className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            Confirm Investment
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default InvestmentModal

