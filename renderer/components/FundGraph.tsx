import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'

interface FundGraphProps {
  isOpen: boolean
  onClose: () => void
  fundSymbol: string
  fundName: string
}

interface GraphDataPoint {
  date: string
  price: number
  volume?: number
}

const FundGraph: React.FC<FundGraphProps> = ({ isOpen, onClose, fundSymbol, fundName }) => {
  const [graphData, setGraphData] = useState<GraphDataPoint[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState('1mo')

  // Fetch historical data for the fund
  const fetchHistoricalData = async (symbol: string, range: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Convert time range to Yahoo Finance format and determine appropriate interval
      const rangeMap: { [key: string]: { range: string, interval: string } } = {
        '1d': { range: '1d', interval: '1m' },      // 1-minute intervals for 1 day
        '5d': { range: '5d', interval: '5m' },      // 5-minute intervals for 5 days
        '1mo': { range: '1mo', interval: '1d' },    // Daily intervals for 1 month
        '3mo': { range: '3mo', interval: '1d' },    // Daily intervals for 3 months
        '6mo': { range: '6mo', interval: '1d' },    // Daily intervals for 6 months
        '1y': { range: '1y', interval: '1d' },      // Daily intervals for 1 year
        '2y': { range: '2y', interval: '1d' },      // Daily intervals for 2 years
        '5y': { range: '5y', interval: '1d' },      // Daily intervals for 5 years
        'max': { range: 'max', interval: '1d' }     // Daily intervals for max
      }
      
      const config = rangeMap[range] || rangeMap['1mo']
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${config.range}&interval=${config.interval}`
      
      console.log(`📈 Fetching historical data for ${symbol} (${config.range}, ${config.interval})`)
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.chart && data.chart.result && data.chart.result[0]) {
        const result = data.chart.result[0]
        const timestamps = result.timestamp || []
        const prices = result.indicators?.quote?.[0]?.close || []
        const volumes = result.indicators?.quote?.[0]?.volume || []
        
        // Process data with proper filtering and formatting
        const chartData: GraphDataPoint[] = timestamps
          .map((timestamp: number, index: number) => {
            const price = prices[index]
            const volume = volumes[index]
            
            // Only include data points with valid prices
            if (!price || price <= 0 || isNaN(price)) {
              return null
            }
            
            const date = new Date(timestamp * 1000)
            
            // Format date based on time range
            let dateString: string
            if (range === '1d') {
              // For 1-day view, show time
              dateString = date.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              })
            } else if (range === '5d') {
              // For 5-day view, show day and time
              dateString = date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              })
            } else {
              // For longer periods, show date
              dateString = date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: range === '1y' || range === '2y' || range === '5y' || range === 'max' ? '2-digit' : undefined
              })
            }
            
            return {
              date: dateString,
              price: Math.round(price * 100) / 100, // Round to 2 decimal places
              volume: volume || 0,
              timestamp: timestamp // Keep original timestamp for sorting
            }
          })
          .filter((point): point is GraphDataPoint & { timestamp: number } => point !== null)
        
        // Sort by timestamp to ensure proper order
        chartData.sort((a, b) => a.timestamp - b.timestamp)
        
        // Remove timestamp from final data
        const finalData = chartData.map(({ timestamp, ...rest }) => rest)
        
        console.log(`📊 Loaded ${finalData.length} data points for ${symbol}`)
        console.log(`📊 Sample data:`, finalData.slice(0, 3))
        setGraphData(finalData)
      } else {
        throw new Error('No chart data available')
      }
      
    } catch (error) {
      console.error('❌ Error fetching historical data:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && fundSymbol) {
      fetchHistoricalData(fundSymbol, timeRange)
    }
  }, [isOpen, fundSymbol, timeRange])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dark-200 rounded-lg shadow-2xl w-11/12 h-5/6 max-w-6xl max-h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-300">
          <div>
            <h2 className="text-xl font-bold text-white">{fundName} ({fundSymbol})</h2>
            <p className="text-gray-400 text-sm">Historical Price Chart</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Time Range Selector */}
        <div className="p-4 border-b border-dark-300">
          <div className="flex gap-2 flex-wrap">
            {[
              { key: '1d', label: '1 Day' },
              { key: '5d', label: '5 Days' },
              { key: '1mo', label: '1 Month' },
              { key: '3mo', label: '3 Months' },
              { key: '6mo', label: '6 Months' },
              { key: '1y', label: '1 Year' },
              { key: '2y', label: '2 Years' },
              { key: '5y', label: '5 Years' },
              { key: 'max', label: 'Max' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTimeRange(key)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  timeRange === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Area */}
        <div className="flex-1 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="spinner mx-auto mb-4"></div>
                <p className="text-gray-400">Loading chart data...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-red-400">
                <p className="text-lg mb-2">❌ Error loading chart</p>
                <p className="text-sm">{error}</p>
                <button
                  onClick={() => fetchHistoricalData(fundSymbol, timeRange)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : graphData.length > 0 ? (
            <div className="h-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={graphData}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9CA3AF"
                    fontSize={12}
                    tick={{ fill: '#9CA3AF' }}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    fontSize={12}
                    tick={{ fill: '#9CA3AF' }}
                    domain={['dataMin - 5', 'dataMax + 5']}
                    tickFormatter={(value) => `$${value.toFixed(2)}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                    labelStyle={{ color: '#F9FAFB' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fill="url(#colorPrice)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400">No data available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-dark-300 text-center text-sm text-gray-400">
          Data provided by Yahoo Finance • {graphData.length} data points
        </div>
      </div>
    </div>
  )
}

export default FundGraph
