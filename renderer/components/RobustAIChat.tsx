import React, { useState, useRef, useEffect } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { Stock } from '../utils/aiFilter'

interface RobustAIChatProps {
  isOpen: boolean
  onClose: () => void
  stocks: Stock[]
}

interface ChatMessage {
  id: string
  type: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  source?: 'gemini' | 'fallback' | 'mock'
  analysis?: {
    patterns?: string[]
    recommendations?: string[]
    insights?: string[]
  }
}

const RobustAIChat: React.FC<RobustAIChatProps> = ({ isOpen, onClose, stocks }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [isApiKeySet, setIsApiKeySet] = useState(false)
  const [aiMode, setAiMode] = useState<'gemini' | 'fallback' | 'mock'>('gemini')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load API key from localStorage on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('gemini_api_key')
    if (savedApiKey) {
      setApiKey(savedApiKey)
      setIsApiKeySet(true)
      console.log('🔑 Loaded API key from localStorage')
    }
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const dataStatus = stocks.length > 0 ? `✅ Loaded ${stocks.length} stocks` : '❌ No stock data available'
      
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        type: 'assistant',
        content: `👋 Hi! I'm Stockie, your AI stock expert! I can help you:\n\n• Find stocks based on your criteria\n• Analyze market patterns and trends\n• Identify investment opportunities\n• Explain complex financial concepts\n\n**Current Status:** ${dataStatus}\n\nI'm running in multiple modes to ensure I always work:\n• 🚀 Gemini AI (when API key is available)\n• 🧠 Smart Fallback (pattern-based analysis)\n• 📊 Mock Analysis (always available)\n\nWhat would you like to know about stocks?`,
        timestamp: new Date(),
        source: 'system'
      }
      setMessages([welcomeMessage])
    }
  }, [isOpen, messages.length, stocks.length])

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (apiKey.trim()) {
      setIsApiKeySet(true)
      localStorage.setItem('gemini_api_key', apiKey)
      setAiMode('gemini')
      console.log('🔑 API key saved, switching to Gemini mode')
    }
  }

  const switchToFallback = () => {
    setAiMode('fallback')
    const systemMessage: ChatMessage = {
      id: 'mode_switch_' + Date.now(),
      type: 'system',
      content: "🔄 Switched to Smart Fallback mode - I'll analyze your stocks using pattern recognition and built-in intelligence!",
      timestamp: new Date(),
      source: 'fallback'
    }
    setMessages(prev => [...prev, systemMessage])
  }

  const switchToMock = () => {
    setAiMode('mock')
    const systemMessage: ChatMessage = {
      id: 'mode_switch_' + Date.now(),
      type: 'system',
      content: "🔄 Switched to Mock Analysis mode - I'll provide sample analysis and recommendations!",
      timestamp: new Date(),
      source: 'mock'
    }
    setMessages(prev => [...prev, systemMessage])
  }

  // Smart fallback analysis
  const performFallbackAnalysis = (query: string, stockData: Stock[]): string => {
    console.log('🔍 Smart Analysis - Query:', query)
    console.log('📊 Smart Analysis - Stock data length:', stockData.length)
    console.log('📊 Smart Analysis - Sample stock:', stockData[0])
    
    const queryLower = query.toLowerCase()
    let analysis = "📊 **Smart Analysis Results:**\n\n"
    
    // Check if we have valid stock data
    if (!stockData || stockData.length === 0) {
      return "❌ **No stock data available.** Please make sure the stock data is loaded before using the AI chat."
    }
    
    // Find stocks based on query
    let filteredStocks = stockData
    
    if (queryLower.includes('tech') || queryLower.includes('technology')) {
      filteredStocks = stockData.filter(s => s.sector.toLowerCase().includes('technology') || 
        ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA'].includes(s.ticker))
      analysis += "🔍 **Technology Sector Analysis:**\n"
    } else if (queryLower.includes('energy') || queryLower.includes('oil') || queryLower.includes('gas')) {
      filteredStocks = stockData.filter(s => s.sector.toLowerCase().includes('energy') || 
        ['XOM', 'CVX', 'COP', 'EOG', 'SLB'].includes(s.ticker))
      analysis += "⚡ **Energy Sector Analysis:**\n"
    } else if (queryLower.includes('financial') || queryLower.includes('bank')) {
      filteredStocks = stockData.filter(s => s.sector.toLowerCase().includes('financial') || 
        ['JPM', 'BAC', 'WFC', 'GS', 'MS'].includes(s.ticker))
      analysis += "🏦 **Financial Sector Analysis:**\n"
    } else if (queryLower.includes('healthcare') || queryLower.includes('medical')) {
      filteredStocks = stockData.filter(s => s.sector.toLowerCase().includes('healthcare') || 
        ['JNJ', 'PFE', 'UNH', 'ABBV', 'MRK'].includes(s.ticker))
      analysis += "🏥 **Healthcare Sector Analysis:**\n"
    } else if (queryLower.includes('increasing') || queryLower.includes('gaining') || queryLower.includes('up')) {
      filteredStocks = stockData.filter(s => s.change > 0).sort((a, b) => b.changePercent - a.changePercent)
      analysis += "📈 **Stocks with Positive Movement:**\n"
    } else if (queryLower.includes('decreasing') || queryLower.includes('losing') || queryLower.includes('down')) {
      filteredStocks = stockData.filter(s => s.change < 0).sort((a, b) => a.changePercent - b.changePercent)
      analysis += "📉 **Stocks with Negative Movement:**\n"
    } else if (queryLower.includes('undervalued') || queryLower.includes('cheap') || queryLower.includes('value')) {
      filteredStocks = stockData.filter(s => s.pe > 0 && s.pe < 15).sort((a, b) => a.pe - b.pe)
      analysis += "💰 **Potentially Undervalued Stocks (Low P/E):**\n"
    } else if (queryLower.includes('dividend') || queryLower.includes('yield')) {
      filteredStocks = stockData.filter(s => s.dividendYield > 2).sort((a, b) => b.dividendYield - a.dividendYield)
      analysis += "💵 **High Dividend Yield Stocks:**\n"
    } else if (queryLower.includes('growth') || queryLower.includes('high growth')) {
      filteredStocks = stockData.filter(s => s.pe > 20 && s.changePercent > 0).sort((a, b) => b.changePercent - a.changePercent)
      analysis += "🚀 **Growth Stocks:**\n"
    }

    // Limit to top 10 results
    const topStocks = filteredStocks.slice(0, 10)
    
    if (topStocks.length === 0) {
      analysis += "❌ No stocks found matching your criteria. Try a different search term.\n\n"
      analysis += "💡 **Try these searches:**\n"
      analysis += "• 'tech stocks' - Technology companies\n"
      analysis += "• 'energy stocks' - Oil and gas companies\n"
      analysis += "• 'increasing stocks' - Stocks gaining today\n"
      analysis += "• 'undervalued stocks' - Low P/E ratio stocks\n"
      analysis += "• 'dividend stocks' - High yield stocks\n"
    } else {
      analysis += `Found ${topStocks.length} stocks matching your criteria:\n\n`
      
      topStocks.forEach((stock, index) => {
        const changeIcon = stock.change >= 0 ? '📈' : '📉'
        const sector = stock.sector && stock.sector !== 'Unknown' ? stock.sector : 'Technology'
        const marketCap = stock.marketCap > 0 ? `$${(stock.marketCap / 1e9).toFixed(1)}B` : 'N/A'
        
        analysis += `${index + 1}. **${stock.ticker}** - ${stock.name}\n`
        analysis += `   💰 Price: $${stock.price.toFixed(2)} ${changeIcon} ${stock.change >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%\n`
        analysis += `   🏢 Sector: ${sector}\n`
        if (stock.pe > 0) analysis += `   📊 P/E: ${stock.pe.toFixed(1)}\n`
        if (stock.dividendYield > 0) analysis += `   💵 Yield: ${stock.dividendYield.toFixed(2)}%\n`
        analysis += `   💎 Market Cap: ${marketCap}\n\n`
      })

      // Add pattern analysis
      const avgChange = topStocks.reduce((sum, s) => sum + s.changePercent, 0) / topStocks.length
      const sectors = [...new Set(topStocks.map(s => s.sector))]
      
      analysis += "🔍 **Pattern Analysis:**\n"
      analysis += `• Average change: ${avgChange >= 0 ? '+' : ''}${avgChange.toFixed(2)}%\n`
      analysis += `• Sectors represented: ${sectors.join(', ')}\n`
      analysis += `• Market sentiment: ${avgChange > 2 ? 'Very Positive' : avgChange > 0 ? 'Positive' : avgChange > -2 ? 'Neutral' : 'Negative'}\n\n`
      
      analysis += "💡 **Recommendations:**\n"
      if (avgChange > 2) {
        analysis += "• Strong momentum detected - consider momentum strategies\n"
        analysis += "• Monitor for potential profit-taking opportunities\n"
      } else if (avgChange < -2) {
        analysis += "• Potential buying opportunity for value investors\n"
        analysis += "• Consider dollar-cost averaging approach\n"
      } else {
        analysis += "• Mixed signals - consider diversification\n"
        analysis += "• Focus on fundamental analysis\n"
      }
    }

    return analysis
  }

  // Mock analysis for demonstration
  const performMockAnalysis = (query: string): string => {
    const mockResponses = [
      "📊 **Mock Analysis - Sample Response:**\n\nBased on your query, here are some sample insights:\n\n• **Market Trend**: Bullish sentiment in tech sector\n• **Top Picks**: AAPL, MSFT, GOOGL showing strong fundamentals\n• **Risk Level**: Moderate - consider diversification\n• **Time Horizon**: 6-12 months for optimal results\n\n*Note: This is a mock response for demonstration purposes.*",
      
      "🎯 **Sample Stock Analysis:**\n\n**Technology Sector Overview:**\n• Strong earnings growth expected\n• Innovation driving market expansion\n• Regulatory environment supportive\n\n**Key Recommendations:**\n1. **AAPL** - Strong ecosystem, consistent growth\n2. **MSFT** - Cloud leadership, AI integration\n3. **GOOGL** - Search dominance, YouTube growth\n\n**Risk Factors:**\n• Market volatility\n• Regulatory changes\n• Competition intensity\n\n*This is a demonstration response.*",
      
      "💡 **Investment Insights:**\n\n**Current Market Conditions:**\n• Interest rates: Stable\n• Inflation: Under control\n• Employment: Strong\n\n**Sector Rotation:**\n• Technology: Overweight\n• Healthcare: Neutral\n• Energy: Underweight\n\n**Portfolio Suggestions:**\n• 40% Growth stocks\n• 30% Value stocks\n• 20% Dividend stocks\n• 10% Cash/Bonds\n\n*Mock analysis for educational purposes.*"
    ]
    
    return mockResponses[Math.floor(Math.random() * mockResponses.length)]
  }

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      let response = ''
      let source: 'gemini' | 'fallback' | 'mock' = 'mock'

      if (aiMode === 'gemini' && isApiKeySet && apiKey.trim()) {
        try {
          console.log('🚀 Attempting Gemini API call...')
          const genAI = new GoogleGenerativeAI(apiKey)
          
          // Try different model names
          const modelsToTry = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro']
          let success = false
          
          for (const modelName of modelsToTry) {
            try {
              console.log(`🔄 Trying model: ${modelName}`)
              const model = genAI.getGenerativeModel({ model: modelName })
              
              const prompt = `You are Stockie, an expert stock analyst. Analyze this stock data and answer the user's question: "${inputValue}"\n\nStock Data: ${JSON.stringify(stocks.slice(0, 20), null, 2)}\n\nProvide a detailed analysis with specific recommendations.`
              
              const result = await model.generateContent(prompt)
              const response_text = await result.response.text()
              
              response = response_text
              source = 'gemini'
              success = true
              console.log(`✅ Gemini API success with ${modelName}`)
              break
            } catch (modelError) {
              console.warn(`⚠️ Model ${modelName} failed:`, modelError)
              continue
            }
          }
          
          if (!success) {
            throw new Error('All Gemini models failed')
          }
        } catch (geminiError) {
          console.warn('⚠️ Gemini API failed, falling back to smart analysis:', geminiError)
          response = performFallbackAnalysis(inputValue, stocks)
          source = 'fallback'
        }
      } else if (aiMode === 'fallback') {
        response = performFallbackAnalysis(inputValue, stocks)
        source = 'fallback'
      } else {
        response = performMockAnalysis(inputValue)
        source = 'mock'
      }

      const assistantMessage: ChatMessage = {
        id: Date.now().toString() + '_response',
        type: 'assistant',
        content: response,
        timestamp: new Date(),
        source: source,
        analysis: {
          patterns: extractPatterns(response),
          recommendations: extractRecommendations(response),
          insights: extractInsights(response)
        }
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('❌ All analysis methods failed:', error)
      
      // Ultimate fallback
      const fallbackMessage: ChatMessage = {
        id: Date.now().toString() + '_fallback',
        type: 'assistant',
        content: "I apologize, but I'm experiencing technical difficulties. However, I can still help you with basic stock information!\n\n**Available stocks:** " + stocks.slice(0, 10).map(s => s.ticker).join(', ') + "\n\n**Try asking:**\n• 'Show me tech stocks'\n• 'Find increasing stocks'\n• 'List dividend stocks'\n\nI'll do my best to help with the information I have!",
        timestamp: new Date(),
        source: 'fallback'
      }
      setMessages(prev => [...prev, fallbackMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const extractPatterns = (text: string): string[] => {
    const patterns: string[] = []
    const patternKeywords = ['pattern', 'trend', 'correlation', 'volatility', 'momentum', 'support', 'resistance']
    
    patternKeywords.forEach(keyword => {
      if (text.toLowerCase().includes(keyword)) {
        patterns.push(`Identified ${keyword} analysis`)
      }
    })
    
    return patterns
  }

  const extractRecommendations = (text: string): string[] => {
    const recommendations: string[] = []
    const recKeywords = ['buy', 'sell', 'hold', 'recommend', 'suggest', 'consider']
    
    recKeywords.forEach(keyword => {
      if (text.toLowerCase().includes(keyword)) {
        recommendations.push(`Investment ${keyword} provided`)
      }
    })
    
    return recommendations
  }

  const extractInsights = (text: string): string[] => {
    const insights: string[] = []
    const insightKeywords = ['insight', 'analysis', 'observation', 'finding', 'discovery']
    
    insightKeywords.forEach(keyword => {
      if (text.toLowerCase().includes(keyword)) {
        insights.push(`Key ${keyword} shared`)
      }
    })
    
    return insights
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-dark-200 rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-300">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Stockie AI</h2>
              <p className="text-sm text-gray-400">
                Mode: {aiMode === 'gemini' ? '🚀 Gemini AI' : aiMode === 'fallback' ? '🧠 Smart Fallback' : '📊 Mock Analysis'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={clearChat}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
            >
              Clear
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center"
            >
              ×
            </button>
          </div>
        </div>

        {/* Mode Controls */}
        <div className="p-4 border-b border-dark-300 bg-dark-100">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm text-gray-400">AI Mode:</span>
            <button
              onClick={() => setAiMode('gemini')}
              className={`px-3 py-1 rounded text-xs ${aiMode === 'gemini' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'}`}
              disabled={!isApiKeySet}
            >
              🚀 Gemini
            </button>
            <button
              onClick={switchToFallback}
              className={`px-3 py-1 rounded text-xs ${aiMode === 'fallback' ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}`}
            >
              🧠 Smart
            </button>
            <button
              onClick={switchToMock}
              className={`px-3 py-1 rounded text-xs ${aiMode === 'mock' ? 'bg-purple-600 text-white' : 'bg-gray-600 text-gray-300'}`}
            >
              📊 Mock
            </button>
          </div>
          
          {!isApiKeySet && (
            <div className="bg-blue-900 border border-blue-700 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter Gemini API key for full AI features..."
                  className="flex-1 px-3 py-2 bg-dark-300 border border-dark-400 rounded text-white placeholder-gray-400 text-sm"
                />
                <button
                  onClick={handleApiKeySubmit}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                >
                  Save
                </button>
              </div>
              <p className="text-blue-200 text-xs mt-1">
                Get your free API key at: <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a>
              </p>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : message.type === 'system'
                    ? 'bg-yellow-900 text-yellow-200 border border-yellow-700'
                    : 'bg-dark-300 text-gray-100'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                {message.analysis && (
                  <div className="mt-2 pt-2 border-t border-gray-600">
                    <div className="text-xs text-gray-400">
                      {message.analysis.patterns && message.analysis.patterns.length > 0 && (
                        <div>🔍 Patterns: {message.analysis.patterns.join(', ')}</div>
                      )}
                      {message.analysis.recommendations && message.analysis.recommendations.length > 0 && (
                        <div>💡 Recommendations: {message.analysis.recommendations.join(', ')}</div>
                      )}
                      {message.analysis.insights && message.analysis.insights.length > 0 && (
                        <div>💭 Insights: {message.analysis.insights.join(', ')}</div>
                      )}
                    </div>
                  </div>
                )}
                <div className="text-xs opacity-70 mt-1 flex items-center justify-between">
                  <span>{message.timestamp.toLocaleTimeString()}</span>
                  {message.source && (
                    <span className="ml-2">
                      {message.source === 'gemini' ? '🚀' : message.source === 'fallback' ? '🧠' : '📊'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-dark-300 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <div className="spinner w-4 h-4"></div>
                  <span className="text-gray-400">Stockie is thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-dark-300">
          <div className="flex space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask Stockie anything about stocks..."
              className="flex-1 px-4 py-2 bg-dark-300 border border-dark-400 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg"
            >
              Send
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            💡 Try: "Find undervalued tech stocks" or "What patterns do you see in the energy sector?"
          </div>
        </div>
      </div>
    </div>
  )
}

export default RobustAIChat
