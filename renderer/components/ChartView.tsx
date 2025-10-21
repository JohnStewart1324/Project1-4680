import React, { useState, useEffect, useRef } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush } from 'recharts'
import { Stock } from '../utils/aiFilter'
import { getHistoricalData, HistoricalData } from '../utils/stockDataService'

interface ChartViewProps {
  stock: Stock
}

const ChartView: React.FC<ChartViewProps> = ({ stock }) => {
  const [chartData, setChartData] = useState<HistoricalData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRealData, setIsRealData] = useState(false)
  const [brushRange, setBrushRange] = useState<[number, number] | null>(null)
  const [timeRange, setTimeRange] = useState('1mo')
  const chartRef = useRef<any>(null)

  // Generate mock price data for the last 30 days (fallback)
  const generateMockData = () => {
    const data = []
    const basePrice = stock.price
    let currentPrice = basePrice
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      // Add some random variation to simulate price movement
      const variation = (Math.random() - 0.5) * 0.1 // ±5% variation
      currentPrice = currentPrice * (1 + variation)
      
      data.push({
        date: date.toISOString().split('T')[0],
        price: Math.max(0.01, currentPrice), // Ensure price doesn't go negative
        volume: Math.floor(Math.random() * stock.volume * 2) + stock.volume * 0.5,
        high: currentPrice * 1.02,
        low: currentPrice * 0.98,
        open: currentPrice * 0.99,
        close: currentPrice
      })
    }
    
    return data
  }

  // Fetch real historical data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Try to get real data first
        console.log(`📊 Fetching ${timeRange} data for ${stock.ticker}`)
        const realData = await getHistoricalData(stock.ticker, timeRange)
        
        if (realData.length > 0) {
          setChartData(realData)
          setIsRealData(true)
          console.log(`✅ Loaded ${realData.length} real data points for ${stock.ticker}`)
        } else {
          // Fallback to mock data
          setChartData(generateMockData())
          setIsRealData(false)
          console.log(`⚠️ Using mock chart data for ${stock.ticker}`)
        }
      } catch (error) {
        console.error('Error fetching chart data:', error)
        setChartData(generateMockData())
        setIsRealData(false)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
    // Reset brush range when time range changes
    setBrushRange(null)
  }, [stock.ticker, timeRange])

  // Handle zoom functionality
  const handleZoom = (direction: 'in' | 'out') => {
    if (!chartData.length) return
    
    const totalPoints = chartData.length
    const currentRange = brushRange || [0, totalPoints - 1]
    const currentSpan = currentRange[1] - currentRange[0]
    
    let newSpan: number
    if (direction === 'in') {
      newSpan = Math.max(5, Math.floor(currentSpan * 0.7)) // Zoom in by 30%
    } else {
      newSpan = Math.min(totalPoints - 1, Math.floor(currentSpan * 1.3)) // Zoom out by 30%
    }
    
    const center = (currentRange[0] + currentRange[1]) / 2
    const newStart = Math.max(0, Math.floor(center - newSpan / 2))
    const newEnd = Math.min(totalPoints - 1, newStart + newSpan)
    
    setBrushRange([newStart, newEnd])
  }

  // Handle mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    if (e.deltaY < 0) {
      handleZoom('in')
    } else {
      handleZoom('out')
    }
  }

  // Reset zoom
  const resetZoom = () => {
    setBrushRange(null)
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark-200 border border-dark-300 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">{`Date: ${label}`}</p>
          <p className="text-blue-400">
            {`Price: $${payload[0].value.toFixed(2)}`}
          </p>
          <p className="text-gray-400">
            {`Volume: ${payload[1]?.value.toLocaleString() || 'N/A'}`}
          </p>
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="w-full h-80 bg-dark-200 rounded-lg p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-400">Loading real-time chart data...</p>
        </div>
      </div>
    )
  }

  // Get human-readable label for time range
  const getTimeRangeLabel = (range: string) => {
    const labels: { [key: string]: string } = {
      '1d': '1 Day',
      '5d': '5 Days',
      '1mo': '1 Month',
      '3mo': '3 Months',
      '6mo': '6 Months',
      '1y': '1 Year',
      '2y': '2 Years',
      '5y': '5 Years',
      'max': 'All Time'
    }
    return labels[range] || '1 Month'
  }

  return (
    <div className="w-full bg-dark-200 rounded-lg p-4">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">
            {stock.ticker} Price Chart
          </h3>
          <p className="text-sm text-gray-400">
            {getTimeRangeLabel(timeRange)} {isRealData ? '(real data)' : '(simulated data)'}
          </p>
        </div>
        
        {/* Zoom Controls */}
        <div className="flex gap-2">
          <button
            onClick={() => handleZoom('out')}
            className="bg-dark-300 hover:bg-dark-400 text-gray-300 px-3 py-1 rounded text-sm transition-colors"
            title="Zoom Out"
          >
            🔍−
          </button>
          <button
            onClick={() => handleZoom('in')}
            className="bg-dark-300 hover:bg-dark-400 text-gray-300 px-3 py-1 rounded text-sm transition-colors"
            title="Zoom In"
          >
            🔍+
          </button>
          <button
            onClick={resetZoom}
            className="bg-dark-300 hover:bg-dark-400 text-gray-300 px-3 py-1 rounded text-sm transition-colors"
            title="Reset Zoom"
          >
            ↺
          </button>
        </div>
      </div>
      
      {/* Time Range Selector */}
      <div className="mb-4 flex gap-2 flex-wrap">
        {[
          { key: '1d', label: '1D' },
          { key: '5d', label: '5D' },
          { key: '1mo', label: '1M' },
          { key: '3mo', label: '3M' },
          { key: '6mo', label: '6M' },
          { key: '1y', label: '1Y' },
          { key: '2y', label: '2Y' },
          { key: '5y', label: '5Y' },
          { key: 'max', label: 'Max' }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTimeRange(key)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              timeRange === key
                ? 'bg-blue-600 text-white'
                : 'bg-dark-300 text-gray-300 hover:bg-dark-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      
      <div 
        className="h-48" 
        onWheel={handleWheel}
        style={{ cursor: 'grab' }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            ref={chartRef}
            data={chartData} 
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="date" 
              stroke="#9CA3AF"
              fontSize={12}
              tickFormatter={(value) => {
                const date = new Date(value)
                return `${date.getMonth() + 1}/${date.getDate()}`
              }}
            />
            <YAxis 
              stroke="#9CA3AF"
              fontSize={12}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#3B82F6" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#3B82F6' }}
            />
            <Brush
              dataKey="date"
              height={30}
              stroke="#3B82F6"
              fill="#1F2937"
              startIndex={brushRange?.[0]}
              endIndex={brushRange?.[1]}
              onChange={(e) => {
                if (e && typeof e.startIndex === 'number' && typeof e.endIndex === 'number') {
                  setBrushRange([e.startIndex, e.endIndex])
                }
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-2 text-xs text-center text-gray-500">
        Use mouse wheel or buttons to zoom • Drag brush handles to select range
      </div>
      
      <div className="mt-2 text-xs text-center">
        {isRealData ? (
          <span className="text-green-400">✅ Real-time data from Yahoo Finance</span>
        ) : (
          <span className="text-yellow-400">⚠️ Simulated data (real data unavailable)</span>
        )}
      </div>
    </div>
  )
}

export default ChartView
