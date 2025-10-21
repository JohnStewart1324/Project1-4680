import React, { useState, useEffect } from 'react'
import { Stock } from './utils/aiFilter'
import { filterStocksByPrompt, getFilterCategories } from './utils/aiFilter'
import { getStockDataWithFallback } from './utils/stockDataService'
import { serverStockLoader, ServerLoadingProgress } from './utils/serverStockLoader'
import StockCard from './components/StockCard'
import ChartView from './components/ChartView'
import ErrorBoundary from './components/ErrorBoundary'
import LoadingError from './components/LoadingError'
import Home from './pages/Home'
import Details from './pages/Details'
import SideAIChat from './components/SideAIChat'
import FundGraph from './components/FundGraph'
import AccountBalance from './components/AccountBalance'
import InvestmentModal from './components/InvestmentModal'
import Portfolio from './components/Portfolio'
import { loadTradingAccount, saveTradingAccount, resetTradingAccount, addFunds as addFundsToAccount, buyStock, TradingAccount } from './utils/tradingStorage'
import stocksData from './data/stocks.json'
import './styles/globals.css'

type ViewMode = 'home' | 'details'

function App() {
  const [stocks, setStocks] = useState<Stock[]>([])
  const [isLoadingStocks, setIsLoadingStocks] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState<ServerLoadingProgress>({ 
    loaded: 0, 
    total: 0, 
    currentSymbol: '', 
    percentage: 0, 
    isFromServer: false,
    isLoading: false
  })
  const [retryCount, setRetryCount] = useState(0)
  const [maxRetries] = useState(3)
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('home')
  const [loadingError, setLoadingError] = useState<string | null>(null)
  const [useMockData, setUseMockData] = useState(false)

  // Category state - SIMPLIFIED
  const [currentCategory, setCurrentCategory] = useState<string>('all')
  const [isLoadingCategory, setIsLoadingCategory] = useState(false)
  
  // AI Chat state
  const [isAIChatOpen, setIsAIChatOpen] = useState(false)
  
  // Fund Graph state
  const [isGraphOpen, setIsGraphOpen] = useState(false)
  const [selectedFund, setSelectedFund] = useState<{symbol: string, name: string} | null>(null)

  // Trading Account state
  const [tradingAccount, setTradingAccount] = useState<TradingAccount>({ balance: 10000, holdings: [], lastUpdated: new Date().toISOString() })
  const [investmentStock, setInvestmentStock] = useState<Stock | null>(null)
  const [showInvestmentModal, setShowInvestmentModal] = useState(false)

  // Load trading account from localStorage on mount
  useEffect(() => {
    const account = loadTradingAccount()
    setTradingAccount(account)
    console.log('💰 Loaded trading account:', account)
  }, [])

  // Trading functions
  const handleAddFunds = (amount: number) => {
    const updated = addFundsToAccount(tradingAccount, amount)
    setTradingAccount(updated)
    console.log(`💰 Added $${amount} to account. New balance: $${updated.balance}`)
  }

  const handleResetAccount = () => {
    const newAccount = resetTradingAccount()
    setTradingAccount(newAccount)
    console.log('🔄 Account reset to default')
  }

  const handleInvestClick = (stock: Stock) => {
    setInvestmentStock(stock)
    setShowInvestmentModal(true)
  }

  const handleInvest = (shares: number, totalCost: number) => {
    if (investmentStock) {
      const updated = buyStock(
        tradingAccount,
        investmentStock.ticker,
        investmentStock.name,
        shares,
        investmentStock.price
      )
      
      if (updated) {
        setTradingAccount(updated)
        setShowInvestmentModal(false)
        setInvestmentStock(null)
        console.log(`✅ Invested $${totalCost} in ${investmentStock.ticker} (${shares} shares)`)
      } else {
        alert('Investment failed - insufficient funds')
      }
    }
  }

  // Load initial stock data
  useEffect(() => {
    const loadStockData = async () => {
      setIsLoadingStocks(true)
      setLoadingError(null)
      
      // Try to load from server first
      try {
        console.log('🚀 Loading from server first...')
        await serverStockLoader.loadAllStocks(
          (progress) => {
            console.log(`📊 Server progress: ${progress.loaded}/${progress.total} (${progress.percentage}%)`)
            setLoadingProgress(progress)
          },
          (finalStocks) => {
            console.log(`🎉 Server loading completed: ${finalStocks?.length || 0} stocks`)
            if (finalStocks && finalStocks.length > 0) {
              console.log(`📊 First few server stocks:`, finalStocks.slice(0, 3).map(s => s.ticker))
            setStocks(finalStocks)
              setRetryCount(0)
              setLoadingError(null)
            setIsLoadingStocks(false)
              return
            } else {
              console.warn('⚠️ No stocks received from server, falling back to mock data')
            }
          },
          (error) => {
            console.error('❌ Server loading failed:', error)
            setLoadingError(error)
            console.log('📊 Falling back to mock data due to server error')
          }
        )
      } catch (error) {
        console.error('❌ Error in server loading:', error)
        setLoadingError(error instanceof Error ? error.message : String(error))
        console.log('📊 Falling back to mock data due to server error')
      }

      // Fallback to mock data if server loading failed
      if (useMockData || loadingError) {
        console.log('📊 Loading mock data as fallback')
        const mockStocks = stocksData as Stock[]
        console.log(`📊 Mock data loaded: ${mockStocks.length} stocks`)
        setStocks(mockStocks)
        setIsLoadingStocks(false)
      }
    }

    loadStockData()
  }, [useMockData])

  // NEW CLEAN SEARCH IMPLEMENTATION
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  
  // Get filtered stocks based on search query
  const getFilteredStocks = () => {
    if (!searchQuery.trim()) {
      return stocks
    }
    
    const query = searchQuery.toLowerCase()
    return stocks.filter(stock => 
      stock.ticker.toLowerCase().includes(query) ||
      stock.name.toLowerCase().includes(query) ||
      stock.sector.toLowerCase().includes(query)
    )
  }
  
  const filteredStocks = getFilteredStocks()
  
  // Handle search input change
  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
  }


  // Handle stock selection
  const handleStockSelect = (stock: Stock) => {
    setSelectedStock(stock)
    setViewMode('details')
  }

  // SIMPLE category handler
  const loadCategoryStocks = async (category: string) => {
    console.log(`🔄 Loading category: ${category}`)
    setIsLoadingCategory(true)
    setCurrentCategory(category)

    try {
      let url = 'http://localhost:3001/api/stocks'
      if (category !== 'all') {
        url = `http://localhost:3001/api/stocks/category/${category}`
      }

      const response = await fetch(url)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const data = await response.json()
      if (!data.success) throw new Error('API returned error')

      const newStocks = data.data || []
      console.log(`✅ Loaded ${newStocks.length} stocks for ${category}`)
      
      setStocks(newStocks)
      setSearchQuery('')

    } catch (error) {
      console.error(`❌ Failed to load ${category}:`, error)
    } finally {
      setIsLoadingCategory(false)
    }
  }

  // Handle back to home
  const handleBackToHome = () => {
    setViewMode('home')
    setSelectedStock(null)
  }

  // Handle retry loading
  const handleRetryLoading = async () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1)
      console.log(`🔄 Retrying stock loading (attempt ${retryCount + 1}/${maxRetries})`)
      
      const loadStockData = async () => {
        setIsLoadingStocks(true)
    setLoadingError(null)

        try {
          await serverStockLoader.loadAllStocks(
            (progress) => setLoadingProgress(progress),
            (finalStocks) => {
              if (finalStocks && finalStocks.length > 0) {
                setStocks(finalStocks)
            setRetryCount(0)
            setLoadingError(null)
              }
            setIsLoadingStocks(false)
          },
          (error) => {
              setLoadingError(error)
            setIsLoadingStocks(false)
          }
        )
      } catch (error) {
          setLoadingError('Failed to retry loading')
        setIsLoadingStocks(false)
      }
    }
    
    loadStockData()
  }
  }

  // Handle stop loading
  const handleStopLoading = () => {
    console.log('⏹️ Stopping stock loading...')
    serverStockLoader.stop()
    setIsLoadingStocks(false)
  }


  if (viewMode === 'details' && selectedStock) {
    return (
      <ErrorBoundary>
        <Details 
          stock={selectedStock}
          onBack={handleBackToHome}
        />
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <div className="h-screen flex bg-dark-100 text-white">
        {/* Main Content - Full Width */}
        <main className="flex-1 flex flex-col">
          {/* Header */}
          <header className="flex-none border-b border-dark-300 p-4 bg-dark-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-white">Practice Trading Simulator</h1>
                <p className="text-sm text-gray-400">Real-time stock data with AI-powered insights</p>
              </div>
              
              {/* AI Chat Button */}
              <button
                onClick={() => {
                  if (stocks.length > 0) {
                    setIsAIChatOpen(true)
                  } else {
                    alert('Please wait for stock data to load before using AI chat.')
                  }
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 shadow-lg ${
                  stocks.length > 0 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white' 
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
                disabled={stocks.length === 0}
              >
                <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">S</span>
                </div>
                <span className="font-medium">
                  Chat with Stockie {stocks.length > 0 ? '' : '(Loading...)'}
                </span>
              </button>
            </div>
            
            {/* Account Balance */}
            <AccountBalance
              balance={tradingAccount.balance}
              onAddFunds={handleAddFunds}
              onResetAccount={handleResetAccount}
            />
          </header>

          {/* Search Bar */}
          <div className="flex-none p-4 bg-dark-200 border-b border-dark-300">
            <div className="w-full max-w-2xl mx-auto">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search stocks by ticker, name, or sector..."
                  className="input-field w-full pl-10 pr-4 py-3 text-lg"
                />
              </div>
              
              {/* Search status */}
              <div className="mt-2 text-sm text-gray-400 text-center">
                {searchQuery ? `Showing ${filteredStocks.length} of ${stocks.length} stocks` : `Showing all ${stocks.length} stocks`}
              </div>
            </div>
          </div>

          {/* Category Buttons - SIMPLIFIED */}
          <div className="bg-dark-200 border-b border-dark-300 p-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => loadCategoryStocks('all')}
                disabled={isLoadingCategory}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentCategory === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                } ${isLoadingCategory ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                📊 All Stocks
              </button>

              <button
                onClick={() => loadCategoryStocks('sp500')}
                disabled={isLoadingCategory}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentCategory === 'sp500'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                } ${isLoadingCategory ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                📈 S&P 500
              </button>

              <button
                onClick={() => loadCategoryStocks('nasdaq')}
                disabled={isLoadingCategory}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentCategory === 'nasdaq'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                } ${isLoadingCategory ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                💻 NASDAQ
              </button>

              <button
                onClick={() => loadCategoryStocks('dow')}
                disabled={isLoadingCategory}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentCategory === 'dow'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                } ${isLoadingCategory ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                🏛️ Dow Jones
              </button>

              <button
                onClick={() => loadCategoryStocks('crypto')}
                disabled={isLoadingCategory}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentCategory === 'crypto'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                } ${isLoadingCategory ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                ₿ Crypto
              </button>

              <button
                onClick={() => setCurrentCategory('my-investments')}
                disabled={isLoadingCategory}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentCategory === 'my-investments'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                } ${isLoadingCategory ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                💼 My Investments
              </button>
            </div>
            
          </div>

          {/* Stock List Section */}
          <section 
            className="flex-1 overflow-y-auto p-4" 
            id="stock-list"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {isLoadingStocks ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="spinner mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading stocks...</p>
                  {loadingProgress && (
                    <p className="text-sm text-gray-500 mt-2">
                      {loadingProgress.loaded} / {loadingProgress.total} stocks loaded
                    </p>
                  )}
                </div>
              </div>
            ) : loadingError ? (
              <LoadingError
                error={loadingError}
                onRetry={handleRetryLoading}
                onUseMockData={() => setUseMockData(true)}
                isLoading={isLoadingStocks}
              />
            ) : currentCategory === 'my-investments' ? (
              <div>
                {/* My Investments View */}
                {tradingAccount.holdings.length === 0 ? (
                  <div className="text-center text-gray-400 py-20">
                    <div className="text-6xl mb-4">💼</div>
                    <p className="text-2xl mb-2 font-semibold">No Investments Yet</p>
                    <p className="text-lg">Start investing by clicking the "Invest" button on any stock!</p>
                    <button
                      onClick={() => setCurrentCategory('all')}
                      className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Browse All Stocks
                    </button>
                  </div>
                ) : (
                  <Portfolio
                    holdings={tradingAccount.holdings}
                    stocks={stocks}
                    onSelectStock={handleStockSelect}
                  />
                )}
              </div>
            ) : filteredStocks.length === 0 ? (
              <div className="text-center text-gray-400 py-10">
                <p className="text-lg mb-2">No stocks found.</p>
                <p className="text-sm">Try adjusting your search or filter criteria.</p>
              </div>
            ) : (
              <div>
                <div className="mb-4 p-2 bg-blue-900 text-blue-200 rounded text-sm">
                  📊 Showing {filteredStocks.length} stocks for category: {currentCategory}
                  {filteredStocks.length > 0 && (
                    <div className="mt-1 text-xs">
                      First 5: {filteredStocks.slice(0, 5).map(s => s.ticker).join(', ')}
                    </div>
                  )}
                </div>
                
                {/* Show Graph Button for Mutual Funds */}
                {(currentCategory === 'sp500' || currentCategory === 'nasdaq' || currentCategory === 'dow') && (
                  <div className="mb-4 text-center">
                    <button
                      onClick={() => {
                        const fundSymbol = currentCategory === 'sp500' ? 'SPY' : 
                                         currentCategory === 'nasdaq' ? 'QQQ' : 
                                         currentCategory === 'dow' ? 'DIA' : ''
                        const fundName = currentCategory === 'sp500' ? 'S&P 500 ETF' : 
                                       currentCategory === 'nasdaq' ? 'NASDAQ ETF' : 
                                       currentCategory === 'dow' ? 'Dow Jones ETF' : ''
                        
                        if (fundSymbol && fundName) {
                          console.log(`📈 Opening graph for ${fundSymbol} (${currentCategory})`)
                          setSelectedFund({ symbol: fundSymbol, name: fundName })
                          setIsGraphOpen(true)
                        }
                      }}
                      className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center gap-2 mx-auto"
                    >
                      📈 Show Graph
                      <span className="text-xs opacity-75">
                        ({currentCategory === 'sp500' ? 'SPY' : currentCategory === 'nasdaq' ? 'QQQ' : 'DIA'})
                      </span>
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-8">
                  {filteredStocks.map((stock, index) => (
                    <StockCard
                      key={stock.ticker}
                      stock={stock}
                      onSelect={() => handleStockSelect(stock)}
                      onInvest={handleInvestClick}
                      searchQuery={searchQuery}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
      
      {/* AI Chat Side Panel */}
      <SideAIChat
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        stocks={stocks}
      />
      
      {/* Fund Graph Modal */}
      {selectedFund && (
        <FundGraph
          isOpen={isGraphOpen}
          onClose={() => {
            setIsGraphOpen(false)
            setSelectedFund(null)
          }}
          fundSymbol={selectedFund.symbol}
          fundName={selectedFund.name}
        />
      )}

      {/* Investment Modal */}
      {showInvestmentModal && investmentStock && (
        <InvestmentModal
          stock={investmentStock}
          balance={tradingAccount.balance}
          onInvest={handleInvest}
          onClose={() => {
            setShowInvestmentModal(false)
            setInvestmentStock(null)
          }}
        />
      )}
    </ErrorBoundary>
  )
}

export default App