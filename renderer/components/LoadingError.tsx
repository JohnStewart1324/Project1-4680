import React from 'react'

interface LoadingErrorProps {
  error: string
  onRetry: () => void
  onUseMockData: () => void
  isLoading: boolean
}

const LoadingError: React.FC<LoadingErrorProps> = ({ 
  error, 
  onRetry, 
  onUseMockData, 
  isLoading 
}) => {
  return (
    <div className="min-h-screen bg-dark-100 flex items-center justify-center">
      <div className="max-w-lg mx-auto text-center">
        <div className="bg-dark-200 border border-red-500 p-8 rounded-lg shadow-lg">
          {/* Error Icon */}
          <div className="text-6xl mb-4">⚠️</div>
          
          {/* Error Title */}
          <h2 className="text-2xl font-bold text-white mb-4">
            Stock Data Loading Failed
          </h2>
          
          {/* Error Message */}
          <p className="text-gray-300 mb-6">
            {error}
          </p>
          
          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={onRetry}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              {isLoading ? 'Retrying...' : 'Try Again'}
            </button>
            
            <button
              onClick={onUseMockData}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Use Sample Data
            </button>
          </div>
          
          {/* Additional Info */}
          <div className="mt-6 text-sm text-gray-400">
            <p>
              If the problem persists, try using sample data to explore the app's features.
            </p>
            <p className="mt-2">
              Real-time data requires a stable internet connection and may be temporarily unavailable.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoadingError







