import { Stock } from './aiFilter'
import { getMultipleStocksData, convertToStock } from './stockDataService'

/**
 * Smart batch loader that handles API rate limits
 */
export class BatchStockLoader {
  private batchSize: number = 3 // Load 3 stocks at a time (more conservative)
  private delayBetweenBatches: number = 3000 // 3 second delay between batches
  private maxRetries: number = 2
  private retryDelay: number = 5000 // 5 second delay on retry

  constructor(batchSize: number = 3, delayBetweenBatches: number = 3000) {
    this.batchSize = batchSize
    this.delayBetweenBatches = delayBetweenBatches
  }

  /**
   * Load all stocks in batches to avoid API limits
   */
  async loadAllStocks(
    allSymbols: string[],
    onProgress: (loaded: number, total: number, currentBatch: string[]) => void,
    onComplete: (stocks: Stock[]) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    const allStocks: Stock[] = []
    const batches = this.createBatches(allSymbols, this.batchSize)
    
    console.log(`🚀 Starting batch load: ${allSymbols.length} stocks in ${batches.length} batches`)

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      console.log(`📦 Loading batch ${i + 1}/${batches.length}: ${batch.join(', ')}`)

      try {
        const batchStocks = await this.loadBatchWithRetry(batch)
        if (batchStocks && batchStocks.length > 0) {
          allStocks.push(...batchStocks)
        }
        
        onProgress(allStocks.length, allSymbols.length, batch)
        
        // Add delay between batches (except for the last one)
        if (i < batches.length - 1) {
          console.log(`⏳ Waiting ${this.delayBetweenBatches}ms before next batch...`)
          await this.delay(this.delayBetweenBatches)
        }
      } catch (error) {
        console.error(`❌ Failed to load batch ${i + 1}:`, error)
        console.log(`⚠️ Continuing with next batch...`)
        // Don't stop the entire process, just skip this batch
        onProgress(allStocks.length, allSymbols.length, batch)
        
        // Add delay even on error to avoid rate limits
        if (i < batches.length - 1) {
          await this.delay(this.delayBetweenBatches)
        }
      }
    }

    console.log(`✅ Batch loading complete: ${allStocks.length} stocks loaded`)
    onComplete(allStocks)
  }

  /**
   * Load a single batch with retry logic
   */
  private async loadBatchWithRetry(symbols: string[]): Promise<Stock[]> {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${this.maxRetries} for batch: ${symbols.join(', ')}`)
        const realData = await getMultipleStocksData(symbols)
        
        if (realData.length > 0) {
          return realData.map(convertToStock)
        } else {
          throw new Error('No data returned from API')
        }
      } catch (error) {
        console.warn(`⚠️ Attempt ${attempt} failed:`, error)
        
        if (attempt < this.maxRetries) {
          console.log(`⏳ Retrying in ${this.retryDelay}ms...`)
          await this.delay(this.retryDelay)
        } else {
          throw error
        }
      }
    }
    
    throw new Error('Max retries exceeded')
  }

  /**
   * Create batches from symbols array
   */
  private createBatches(symbols: string[], batchSize: number): string[][] {
    const batches: string[][] = []
    for (let i = 0; i < symbols.length; i += batchSize) {
      batches.push(symbols.slice(i, i + batchSize))
    }
    return batches
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Load stocks with different strategies based on API limits
   */
  static async loadWithStrategy(
    symbols: string[],
    strategy: 'aggressive' | 'conservative' | 'balanced' = 'balanced'
  ): Promise<{ stocks: Stock[], progress: (loaded: number, total: number) => void }> {
    let loadedCount = 0
    const allStocks: Stock[] = []

    const progressCallback = (loaded: number, total: number) => {
      loadedCount = loaded
      console.log(`📊 Progress: ${loaded}/${total} stocks loaded (${Math.round((loaded/total)*100)}%)`)
    }

    let batchSize: number
    let delayBetweenBatches: number

    switch (strategy) {
      case 'aggressive':
        batchSize = 10
        delayBetweenBatches = 1000
        break
      case 'conservative':
        batchSize = 3
        delayBetweenBatches = 3000
        break
      case 'balanced':
      default:
        batchSize = 5
        delayBetweenBatches = 2000
        break
    }

    const loader = new BatchStockLoader(batchSize, delayBetweenBatches)

    return new Promise((resolve, reject) => {
      loader.loadAllStocks(
        symbols,
        (loaded, total, currentBatch) => {
          progressCallback(loaded, total)
        },
        (stocks) => {
          resolve({ stocks, progress: progressCallback })
        },
        (error) => {
          reject(error)
        }
      )
    })
  }
}

/**
 * Get all available stock symbols organized by category
 */
export function getAllStockSymbols(): string[] {
  return [
    // Technology Giants
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'NFLX', 'AMD', 'INTC',
    'ORCL', 'CRM', 'ADBE', 'CSCO', 'IBM', 'QCOM', 'TXN', 'AVGO', 'MU', 'AMAT',
    'SNOW', 'PLTR', 'CRWD', 'OKTA', 'ZS', 'NET', 'DDOG', 'MDB', 'TEAM', 'WDAY',
    'NOW', 'ADSK', 'ANSS', 'CDNS', 'INTU', 'SNPS', 'KLAC', 'LRCX', 'TER', 'FTNT',
    
    // Financial Sector
    'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'AXP', 'BLK', 'SPGI', 'V', 'MA',
    'PYPL', 'COF', 'USB', 'PNC', 'TFC', 'SCHW', 'CB', 'MMC', 'AON', 'ICE',
    'BRK.B', 'BK', 'STT', 'TROW', 'NTRS', 'FITB', 'RF', 'HBAN', 'CFG', 'KEY',
    
    // Healthcare & Biotech
    'JNJ', 'PFE', 'UNH', 'ABBV', 'MRK', 'TMO', 'ABT', 'DHR', 'BMY', 'AMGN',
    'GILD', 'BIIB', 'REGN', 'VRTX', 'MRNA', 'BNTX', 'ILMN', 'ISRG', 'SYK', 'MDT',
    'ZTS', 'LLY', 'CVS', 'CI', 'ANTM', 'HUM', 'AET', 'ESRX', 'PRGO', 'MYL',
    
    // Consumer & Retail
    'WMT', 'HD', 'PG', 'KO', 'PEP', 'NKE', 'MCD', 'SBUX', 'TGT', 'LOW',
    'COST', 'TJX', 'BKNG', 'ABNB', 'EBAY', 'ETSY', 'ROKU', 'ZM', 'PTON', 'DOCU',
    'AMZN', 'BABA', 'JD', 'PDD', 'VIPS', 'WB', 'YMM', 'TAL', 'EDU', 'COE',
    
    // Energy & Utilities
    'XOM', 'CVX', 'COP', 'EOG', 'SLB', 'KMI', 'WMB', 'PSX', 'VLO', 'MPC',
    'NEE', 'DUK', 'SO', 'D', 'EXC', 'AEP', 'XEL', 'SRE', 'PEG', 'ED',
    'EPD', 'K', 'WEC', 'ES', 'ETR', 'FE', 'AEE', 'CNP', 'LNT', 'PNW',
    
    // Industrial & Aerospace
    'BA', 'CAT', 'GE', 'HON', 'UPS', 'FDX', 'RTX', 'LMT', 'NOC', 'GD',
    'EMR', 'ETN', 'ITW', 'MMM', 'DE', 'CMI', 'PCAR', 'PH', 'ROK', 'SWK',
    'CSX', 'NSC', 'UNP', 'KSU', 'CNI', 'CP', 'TRMB', 'WAB', 'TXT', 'LUV',
    
    // Communication & Media
    'VZ', 'T', 'CMCSA', 'DIS', 'NFLX', 'GOOGL', 'META', 'TWTR', 'SNAP', 'PINS',
    'SPOT', 'LYFT', 'UBER', 'DASH', 'SQ', 'SHOP', 'CRWD', 'OKTA', 'ZS', 'NET',
    'CHTR', 'TMUS', 'SIRI', 'FOX', 'FOXA', 'NWS', 'NWSA', 'VIAC', 'VIACA', 'PARA',
    
    // Real Estate & REITs
    'AMT', 'PLD', 'CCI', 'EQIX', 'PSA', 'O', 'SPG', 'WELL', 'AVB', 'EQR',
    'MAA', 'UDR', 'ESS', 'AIV', 'BXP', 'KIM', 'REG', 'SLG', 'VTR', 'WY',
    'EXR', 'UDR', 'MAA', 'ESS', 'AIV', 'BXP', 'KIM', 'REG', 'SLG', 'VTR',
    
    // Materials & Mining
    'LIN', 'APD', 'SHW', 'ECL', 'DD', 'DOW', 'PPG', 'NEM', 'FCX', 'NUE',
    'X', 'CLF', 'AA', 'SCCO', 'VALE', 'RIO', 'BHP', 'GOLD', 'ABX', 'AEM',
    'IFF', 'PPG', 'SHW', 'ECL', 'DD', 'DOW', 'PPG', 'NEM', 'FCX', 'NUE',
    
    // International Giants
    'ASML', 'TSM', 'BABA', 'JD', 'PDD', 'NIO', 'XPEV', 'LI', 'BIDU', 'TME',
    'VIPS', 'WB', 'YMM', 'TAL', 'EDU', 'COE', 'BILI', 'IQ', 'WB', 'MOMO',
    'TM', 'HMC', 'SONY', 'NTT', 'MUFG', 'SMFG', 'MFG', 'DB', 'SAP', 'ASML'
  ]
}

/**
 * Load stocks with different strategies
 */
export const LoadingStrategies = {
  // Fast but might hit rate limits
  AGGRESSIVE: 'aggressive' as const,
  
  // Slow but very reliable
  CONSERVATIVE: 'conservative' as const,
  
  // Balanced approach
  BALANCED: 'balanced' as const
}
