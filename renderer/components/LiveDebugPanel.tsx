import React, { useState, useEffect } from 'react'
import { ServerLoadingProgress } from '../utils/serverStockLoader'

interface LiveDebugPanelProps {
  loadingProgress: ServerLoadingProgress
  isLoading: boolean
  onRetryLoading?: () => void
  onStopLoading?: () => void
}

const LiveDebugPanel: React.FC<LiveDebugPanelProps> = ({
  loadingProgress,
  isLoading,
  onRetryLoading,
  onStopLoading
}) => {
  const [logs, setLogs] = useState<string[]>([])
  const [showDebug, setShowDebug] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now())

  // Update logs when progress changes
  useEffect(() => {
    if (isLoading && loadingProgress.loaded > 0) {
      const now = Date.now()
      const timeSinceLastUpdate = now - lastUpdate
      const serverStatus = loadingProgress.isFromServer ? ' (from server)' : ''
      const currentSymbol = loadingProgress.currentSymbol ? ` - ${loadingProgress.currentSymbol}` : ''
      const newLog = `[${new Date().toLocaleTimeString()}] Loaded ${loadingProgress.loaded}/${loadingProgress.total} stocks (${loadingProgress.percentage}%)${serverStatus}${currentSymbol} - ${timeSinceLastUpdate}ms since last update`
      
      setLogs(prev => [...prev.slice(-19), newLog]) // Keep last 20 logs
      setLastUpdate(now)
    }
  }, [loadingProgress.loaded, loadingProgress.total, loadingProgress.percentage, loadingProgress.currentSymbol, loadingProgress.isFromServer, isLoading, lastUpdate])


  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      {/* Toggle Button */}
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors mb-2"
      >
        {showDebug ? 'Hide' : 'Show'} Debug
      </button>

      {/* Debug Panel */}
      {showDebug && (
        <div className="bg-dark-200 border border-dark-300 rounded-lg p-4 max-h-96 overflow-y-auto">
          <h3 className="text-white font-semibold mb-3 flex items-center">
            🖥️ Server Stock Debug
            {isLoading && (
              <div className="ml-2 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            )}
            {loadingProgress.isFromServer && (
              <div className="ml-2 w-2 h-2 bg-blue-400 rounded-full"></div>
            )}
          </h3>
          
         {/* Current Status */}
         <div className="mb-4 p-3 bg-dark-300 rounded-lg">
           <div className="text-sm text-gray-400 mb-1">Current Progress</div>
           <div className="text-lg font-bold text-white">
             {loadingProgress.loaded.toLocaleString()} / {loadingProgress.total.toLocaleString()}
           </div>
           <div className="text-sm text-blue-400">
             {loadingProgress.percentage}% complete
           </div>
           {loadingProgress.currentSymbol && (
             <div className="text-sm text-yellow-400">
               Current: {loadingProgress.currentSymbol}
             </div>
           )}
           {loadingProgress.serverStatus && (
             <div className="text-sm text-blue-400">
               Server: {loadingProgress.serverStatus.stocksLoaded} stocks
             </div>
           )}
           <div className="text-sm text-gray-400 mt-2">
             Status: {loadingProgress.isLoading ? 'Loading...' : 'Complete ✅'}
           </div>
         </div>



          {/* Recent Logs */}
          <div className="mb-4">
            <div className="text-sm text-gray-400 mb-2">Live Updates</div>
            <div className="space-y-1 max-h-32 overflow-y-auto bg-dark-100 p-2 rounded">
              {logs.length === 0 ? (
                <div className="text-xs text-gray-500">Waiting for updates...</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="text-xs text-gray-300 font-mono">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Status Info */}
              <div className="text-xs text-gray-500 space-y-1">
                <div>🖥️ Server-based data</div>
                <div>📊 Comprehensive stock database</div>
                <div>🔄 Real-time updates</div>
                {loadingProgress.isFromServer && (
                  <div className="text-blue-400">📡 Connected to server</div>
                )}
            <div className="mt-2 space-x-2">
              {onRetryLoading && loadingProgress.loaded > 0 && (
                <button
                  onClick={onRetryLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                >
                  🔄 Retry Loading
                </button>
              )}
              {onStopLoading && isLoading && (
                <button
                  onClick={onStopLoading}
                  className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
                >
                  ⏹️ Stop Loading
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LiveDebugPanel


