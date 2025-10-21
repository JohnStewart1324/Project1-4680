import React, { useState, useRef, useEffect } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { Stock } from '../utils/aiFilter'

interface AIChatProps {
  isOpen: boolean
  onClose: () => void
  stocks: Stock[]
}

interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  analysis?: {
    patterns?: string[]
    recommendations?: string[]
    insights?: string[]
  }
}

const AIChat: React.FC<AIChatProps> = ({ isOpen, onClose, stocks }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [isApiKeySet, setIsApiKeySet] = useState(false)

  // Load API key from localStorage on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('gemini_api_key')
    if (savedApiKey) {
      setApiKey(savedApiKey)
      setIsApiKeySet(true)
      console.log('🔑 Loaded API key from localStorage')
    }
  }, [])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        type: 'assistant',
        content: "👋 Hi! I'm Stockie, your AI stock expert! I can help you:\n\n• Find stocks based on your criteria\n• Analyze market patterns and trends\n• Identify investment opportunities\n• Explain complex financial concepts\n\nJust ask me anything about stocks! What would you like to know?",
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    }
  }, [isOpen, messages.length])

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

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (apiKey.trim()) {
      setIsApiKeySet(true)
      localStorage.setItem('gemini_api_key', apiKey)
      console.log('🔑 API key saved to localStorage')
    }
  }

  const testApiKey = async () => {
    if (!apiKey.trim()) return
    
    setIsLoading(true)
    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      
      // Try different model names in order of preference
      const modelsToTry = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro']
      let lastError = null
      
      for (const modelName of modelsToTry) {
        try {
          console.log(`🔄 Trying model: ${modelName}`)
          const model = genAI.getGenerativeModel({ model: modelName })
          
          const result = await model.generateContent('Hello, can you respond with just "API key working" if you receive this message?')
          const response = await result.response
          const text = response.text()
          
          console.log(`✅ API key test successful with model ${modelName}:`, text)
          
          const testMessage: ChatMessage = {
            id: 'test_' + Date.now(),
            type: 'assistant',
            content: `✅ API key test successful with ${modelName}! ${text}`,
            timestamp: new Date()
          }
          setMessages(prev => [...prev, testMessage])
          return // Success, exit the function
        } catch (modelError) {
          console.warn(`⚠️ Model ${modelName} failed:`, modelError)
          lastError = modelError
          continue // Try next model
        }
      }
      
      // If all models failed, throw the last error
      throw lastError || new Error('All models failed')
      
    } catch (error) {
      console.error('❌ API key test failed:', error)
      const errorMessage: ChatMessage = {
        id: 'test_error_' + Date.now(),
        type: 'assistant',
        content: `❌ API key test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const generateStockAnalysisPrompt = (userQuery: string, stockData: Stock[]) => {
    const stockSummary = stockData.slice(0, 50).map(stock => ({
      ticker: stock.ticker,
      name: stock.name,
      price: stock.price,
      change: stock.change,
      changePercent: stock.changePercent,
      sector: stock.sector,
      pe: stock.pe,
      marketCap: stock.marketCap,
      volume: stock.volume
    }))

    return `You are Stockie, an expert stock analyst and financial advisor. You have access to real-time stock data and should provide insightful, actionable advice.

STOCK DATA CONTEXT:
${JSON.stringify(stockSummary, null, 2)}

USER QUERY: "${userQuery}"

INSTRUCTIONS:
1. Analyze the stock data to answer the user's question
2. Look for patterns, trends, and opportunities
3. Provide specific stock recommendations when relevant
4. Explain your reasoning clearly
5. Be conversational but professional
6. If asked about specific stocks, search through the data
7. Identify market patterns and explain their significance
8. Suggest investment strategies based on the data

RESPONSE FORMAT:
- Start with a brief analysis
- Highlight key patterns or insights
- Provide specific recommendations if applicable
- End with actionable next steps

Remember: You're Stockie, the friendly but knowledgeable stock expert!`
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
      if (!isApiKeySet) {
        const errorMessage: ChatMessage = {
          id: Date.now().toString() + '_error',
          type: 'assistant',
          content: "⚠️ Please set your Google Gemini API key first to use the AI chat feature.",
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
        setIsLoading(false)
        return
      }

      console.log('🔑 Using API key:', apiKey.substring(0, 10) + '...')
      console.log('📊 Stocks data length:', stocks.length)
      console.log('💬 User query:', inputValue)

      const genAI = new GoogleGenerativeAI(apiKey)
      
      // Try different model names in order of preference
      const modelsToTry = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro']
      let lastError = null
      let text = ''
      
      for (const modelName of modelsToTry) {
        try {
          console.log(`🔄 Trying model: ${modelName}`)
          const model = genAI.getGenerativeModel({ model: modelName })

          const prompt = generateStockAnalysisPrompt(inputValue, stocks)
          console.log('📝 Generated prompt length:', prompt.length)
          
          const result = await model.generateContent(prompt)
          const response = await result.response
          text = response.text()

          console.log(`✅ AI response received with ${modelName}, length:`, text.length)
          break // Success, exit the loop
        } catch (modelError) {
          console.warn(`⚠️ Model ${modelName} failed:`, modelError)
          lastError = modelError
          continue // Try next model
        }
      }
      
      if (!text) {
        throw lastError || new Error('All models failed')
      }

      const assistantMessage: ChatMessage = {
        id: Date.now().toString() + '_response',
        type: 'assistant',
        content: text,
        timestamp: new Date(),
        analysis: {
          patterns: extractPatterns(text),
          recommendations: extractRecommendations(text),
          insights: extractInsights(text)
        }
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('❌ AI Chat Error Details:', error)
      
      let errorMessage = "❌ Sorry, I encountered an error. "
      
      if (error instanceof Error) {
        if (error.message.includes('API_KEY_INVALID')) {
          errorMessage += "Your API key appears to be invalid. Please check it and try again."
        } else if (error.message.includes('QUOTA_EXCEEDED')) {
          errorMessage += "API quota exceeded. Please try again later."
        } else if (error.message.includes('PERMISSION_DENIED')) {
          errorMessage += "Permission denied. Please check your API key permissions."
        } else {
          errorMessage += `Error: ${error.message}`
        }
      } else {
        errorMessage += "Please check your API key and try again."
      }

      const errorChatMessage: ChatMessage = {
        id: Date.now().toString() + '_error',
        type: 'assistant',
        content: errorMessage,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorChatMessage])
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
              <p className="text-sm text-gray-400">Your Personal Stock Expert</p>
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

        {/* API Key Setup */}
        {!isApiKeySet && (
          <div className="p-4 border-b border-dark-300">
            <div className="bg-blue-900 border border-blue-700 rounded-lg p-4">
              <h3 className="text-blue-400 font-semibold mb-2">🔑 Setup Required</h3>
              <p className="text-blue-300 text-sm mb-3">
                Enter your Google Gemini API key to start chatting with Stockie:
              </p>
              <form onSubmit={handleApiKeySubmit} className="flex space-x-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Gemini API key..."
                  className="flex-1 px-3 py-2 bg-dark-300 border border-dark-400 rounded text-white placeholder-gray-400"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={testApiKey}
                  disabled={!apiKey.trim() || isLoading}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded"
                >
                  Test
                </button>
              </form>
              <p className="text-blue-200 text-xs mt-2">
                Get your free API key at: <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a>
              </p>
            </div>
          </div>
        )}

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
                <div className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
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
              disabled={isLoading || !isApiKeySet}
            />
            <button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading || !isApiKeySet}
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

export default AIChat
