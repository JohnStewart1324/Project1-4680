import React, { useState } from 'react'

interface AccountBalanceProps {
  balance: number
  onAddFunds: (amount: number) => void
  onResetAccount: () => void
}

const AccountBalance: React.FC<AccountBalanceProps> = ({ balance, onAddFunds, onResetAccount }) => {
  const [showAddFundsModal, setShowAddFundsModal] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [fundAmount, setFundAmount] = useState('')

  const handleAddFunds = () => {
    const amount = parseFloat(fundAmount)
    if (!isNaN(amount) && amount > 0) {
      onAddFunds(amount)
      setFundAmount('')
      setShowAddFundsModal(false)
    }
  }

  const handleReset = () => {
    onResetAccount()
    setShowResetModal(false)
  }

  return (
    <>
      <div className="flex items-center gap-4">
        {/* Balance Display */}
        <div className="bg-dark-200 rounded-lg px-6 py-3 border border-green-500/30">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Account Balance</div>
          <div className="text-2xl font-bold text-green-400">
            ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddFundsModal(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            💰 Add Funds
          </button>
          <button
            onClick={() => setShowResetModal(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            🔄 Reset Account
          </button>
        </div>
      </div>

      {/* Add Funds Modal */}
      {showAddFundsModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowAddFundsModal(false)}>
          <div className="bg-dark-200 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-4">Add Funds to Account</h2>
            <p className="text-gray-400 mb-4">Enter the amount you want to add to your practice trading account:</p>
            
            <input
              type="number"
              value={fundAmount}
              onChange={(e) => setFundAmount(e.target.value)}
              placeholder="Enter amount..."
              className="w-full bg-dark-300 text-white border border-gray-600 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:border-green-500"
              autoFocus
              min="0"
              step="0.01"
            />

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setFundAmount('100')}
                className="flex-1 px-3 py-2 bg-dark-300 hover:bg-dark-400 text-white rounded text-sm"
              >
                +$100
              </button>
              <button
                onClick={() => setFundAmount('500')}
                className="flex-1 px-3 py-2 bg-dark-300 hover:bg-dark-400 text-white rounded text-sm"
              >
                +$500
              </button>
              <button
                onClick={() => setFundAmount('1000')}
                className="flex-1 px-3 py-2 bg-dark-300 hover:bg-dark-400 text-white rounded text-sm"
              >
                +$1,000
              </button>
              <button
                onClick={() => setFundAmount('5000')}
                className="flex-1 px-3 py-2 bg-dark-300 hover:bg-dark-400 text-white rounded text-sm"
              >
                +$5,000
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAddFunds}
                disabled={!fundAmount || parseFloat(fundAmount) <= 0}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                Add Funds
              </button>
              <button
                onClick={() => {
                  setShowAddFundsModal(false)
                  setFundAmount('')
                }}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Account Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowResetModal(false)}>
          <div className="bg-dark-200 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-4">Reset Account</h2>
            <p className="text-gray-400 mb-6">
              Are you sure you want to reset your account? This will:
            </p>
            <ul className="text-gray-400 mb-6 list-disc list-inside space-y-1">
              <li>Reset your balance to $10,000</li>
              <li>Clear all your holdings</li>
              <li>Delete all investment history</li>
            </ul>
            <p className="text-red-400 mb-6 font-medium">This action cannot be undone!</p>

            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Yes, Reset Account
              </button>
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AccountBalance
