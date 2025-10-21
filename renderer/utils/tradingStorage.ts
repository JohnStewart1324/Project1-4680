// Trading account storage utilities

export interface Holding {
  ticker: string
  name: string
  shares: number
  avgPurchasePrice: number
  purchaseDate: string
}

export interface TradingAccount {
  balance: number
  holdings: Holding[]
  lastUpdated: string
}

const STORAGE_KEY = 'trading_account'
const DEFAULT_BALANCE = 10000

export function loadTradingAccount(): TradingAccount {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Error loading trading account:', error)
  }
  
  // Return default account
  return {
    balance: DEFAULT_BALANCE,
    holdings: [],
    lastUpdated: new Date().toISOString()
  }
}

export function saveTradingAccount(account: TradingAccount): void {
  try {
    account.lastUpdated = new Date().toISOString()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(account))
  } catch (error) {
    console.error('Error saving trading account:', error)
  }
}

export function resetTradingAccount(): TradingAccount {
  const newAccount: TradingAccount = {
    balance: DEFAULT_BALANCE,
    holdings: [],
    lastUpdated: new Date().toISOString()
  }
  saveTradingAccount(newAccount)
  return newAccount
}

export function addFunds(account: TradingAccount, amount: number): TradingAccount {
  const updated = {
    ...account,
    balance: account.balance + amount
  }
  saveTradingAccount(updated)
  return updated
}

export function buyStock(
  account: TradingAccount,
  ticker: string,
  name: string,
  shares: number,
  pricePerShare: number
): TradingAccount | null {
  const totalCost = shares * pricePerShare
  
  if (totalCost > account.balance) {
    return null // Insufficient funds
  }
  
  // Check if we already have this stock
  const existingHoldingIndex = account.holdings.findIndex(h => h.ticker === ticker)
  
  let updatedHoldings: Holding[]
  
  if (existingHoldingIndex >= 0) {
    // Update existing holding - calculate new average price
    const existing = account.holdings[existingHoldingIndex]
    const totalShares = existing.shares + shares
    const totalValue = (existing.shares * existing.avgPurchasePrice) + totalCost
    const newAvgPrice = totalValue / totalShares
    
    updatedHoldings = [...account.holdings]
    updatedHoldings[existingHoldingIndex] = {
      ...existing,
      shares: totalShares,
      avgPurchasePrice: newAvgPrice
    }
  } else {
    // Add new holding
    updatedHoldings = [
      ...account.holdings,
      {
        ticker,
        name,
        shares,
        avgPurchasePrice: pricePerShare,
        purchaseDate: new Date().toISOString()
      }
    ]
  }
  
  const updated: TradingAccount = {
    ...account,
    balance: account.balance - totalCost,
    holdings: updatedHoldings
  }
  
  saveTradingAccount(updated)
  return updated
}

export function sellStock(
  account: TradingAccount,
  ticker: string,
  shares: number,
  pricePerShare: number
): TradingAccount | null {
  const holdingIndex = account.holdings.findIndex(h => h.ticker === ticker)
  
  if (holdingIndex < 0) {
    return null // Don't own this stock
  }
  
  const holding = account.holdings[holdingIndex]
  
  if (holding.shares < shares) {
    return null // Don't have enough shares
  }
  
  const saleProceeds = shares * pricePerShare
  let updatedHoldings: Holding[]
  
  if (holding.shares === shares) {
    // Sell all shares - remove the holding
    updatedHoldings = account.holdings.filter(h => h.ticker !== ticker)
  } else {
    // Sell some shares - update the holding
    updatedHoldings = [...account.holdings]
    updatedHoldings[holdingIndex] = {
      ...holding,
      shares: holding.shares - shares
    }
  }
  
  const updated: TradingAccount = {
    ...account,
    balance: account.balance + saleProceeds,
    holdings: updatedHoldings
  }
  
  saveTradingAccount(updated)
  return updated
}

