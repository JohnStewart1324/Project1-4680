export interface Stock {
  ticker: string
  name: string
  sector: string
  price: number
  pe: number | null  // Real value or null - NO ESTIMATES
  dividendYield: number | null  // Real value or null - NO ESTIMATES
  marketCap: number | null  // Real value or null - NO ESTIMATES
  volume: number
  change: number
  changePercent: number
}

/**
 * Mock AI filtering function that interprets natural language queries
 * and filters stocks based on various criteria.
 * 
 * TODO: Replace with real AI API integration (OpenAI, Gemini, etc.)
 * This would involve:
 * 1. Sending the prompt to an AI service
 * 2. Parsing the AI response to extract filtering criteria
 * 3. Applying those criteria to filter the stock data
 */
export function filterStocksByPrompt(prompt: string, data: Stock[]): Stock[] {
  const query = prompt.toLowerCase()
  
  // Mock AI interpretation - in a real implementation, this would be
  // handled by an AI service that understands natural language queries
  
  // Value/Undervalued stocks (low P/E ratio) - ONLY REAL VALUES
  if (query.includes('undervalued') || query.includes('value') || query.includes('cheap')) {
    return data.filter(stock => stock.pe !== null && stock.pe < 15)
  }
  
  // Growth stocks (high P/E ratio) - ONLY REAL VALUES
  if (query.includes('growth') || query.includes('high growth')) {
    return data.filter(stock => stock.pe !== null && stock.pe > 25)
  }
  
  // Dividend stocks - ONLY REAL VALUES
  if (query.includes('dividend') || query.includes('income') || query.includes('yield')) {
    return data.filter(stock => stock.dividendYield !== null && stock.dividendYield > 2.5)
  }
  
  // High dividend stocks - ONLY REAL VALUES
  if (query.includes('high dividend') || query.includes('high yield')) {
    return data.filter(stock => stock.dividendYield !== null && stock.dividendYield > 3.5)
  }
  
  // Tech stocks
  if (query.includes('tech') || query.includes('technology')) {
    return data.filter(stock => stock.sector === 'Technology')
  }
  
  // Energy stocks
  if (query.includes('energy') || query.includes('oil') || query.includes('gas')) {
    return data.filter(stock => stock.sector === 'Energy')
  }
  
  // Financial stocks
  if (query.includes('financial') || query.includes('bank') || query.includes('finance')) {
    return data.filter(stock => stock.sector === 'Financial')
  }
  
  // Healthcare stocks
  if (query.includes('healthcare') || query.includes('health') || query.includes('medical')) {
    return data.filter(stock => stock.sector === 'Healthcare')
  }
  
  // Consumer goods stocks
  if (query.includes('consumer') || query.includes('retail') || query.includes('goods')) {
    return data.filter(stock => stock.sector === 'Consumer Goods')
  }
  
  // Large cap stocks - ONLY REAL VALUES
  if (query.includes('large cap') || query.includes('large-cap') || query.includes('big')) {
    return data.filter(stock => stock.marketCap !== null && stock.marketCap > 500000000000) // > $500B
  }
  
  // Small cap stocks - ONLY REAL VALUES
  if (query.includes('small cap') || query.includes('small-cap') || query.includes('small')) {
    return data.filter(stock => stock.marketCap !== null && stock.marketCap < 100000000000) // < $100B
  }
  
  // Low volatility stocks
  if (query.includes('low volatility') || query.includes('stable') || query.includes('safe')) {
    return data.filter(stock => Math.abs(stock.changePercent) < 1.0)
  }
  
  // High volume stocks
  if (query.includes('high volume') || query.includes('liquid') || query.includes('active')) {
    return data.filter(stock => stock.volume > 20000000)
  }
  
  // Price range filters
  if (query.includes('under $100') || query.includes('cheap stocks')) {
    return data.filter(stock => stock.price < 100)
  }
  
  if (query.includes('over $200') || query.includes('expensive stocks')) {
    return data.filter(stock => stock.price > 200)
  }
  
  // If no specific criteria match, return all stocks
  return data
}

/**
 * Generate AI insights for why a stock matches the current filter
 * TODO: Replace with real AI-generated insights
 */
export function generateAIInsight(stock: Stock, prompt: string): string {
  const insights = []
  
  // Only use real P/E data - NO ESTIMATES
  if (stock.pe !== null && stock.pe < 15) {
    insights.push('Low P/E ratio suggests potential value opportunity')
  }
  
  // Only use real dividend yield data - NO ESTIMATES
  if (stock.dividendYield !== null && stock.dividendYield > 3) {
    insights.push('High dividend yield provides steady income')
  }
  
  if (stock.sector === 'Technology') {
    insights.push('Tech sector exposure for growth potential')
  }
  
  // Only use real market cap data - NO ESTIMATES
  if (stock.marketCap !== null && stock.marketCap > 500000000000) {
    insights.push('Large-cap stability with established market position')
  }
  
  if (Math.abs(stock.changePercent) < 1.0) {
    insights.push('Low volatility indicates stable price movement')
  }
  
  if (stock.volume > 20000000) {
    insights.push('High trading volume ensures good liquidity')
  }
  
  return insights.length > 0 
    ? insights.join(' • ') 
    : 'This stock matches your search criteria based on current market data.'
}

/**
 * Get predefined filter categories for the sidebar
 */
export function getFilterCategories() {
  return [
    { id: 'all', name: 'All Stocks', icon: '📊' },
    { id: 'undervalued', name: 'Undervalued', icon: '💰' },
    { id: 'dividend', name: 'High Dividend', icon: '💵' },
    { id: 'tech', name: 'Technology', icon: '💻' },
    { id: 'energy', name: 'Energy', icon: '⚡' },
    { id: 'financial', name: 'Financial', icon: '🏦' },
    { id: 'healthcare', name: 'Healthcare', icon: '🏥' },
    { id: 'growth', name: 'Growth', icon: '📈' },
    { id: 'value', name: 'Value', icon: '💎' },
  ]
}
