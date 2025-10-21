// Test Yahoo Finance quoteSummary endpoint
async function testYahooQuoteSummary() {
  const symbol = 'GOOGL'
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=1d&includePrePost=false&events=div%7Csplit`
  
  console.log(`Testing quoteSummary for ${symbol}...`)
  console.log(`URL: ${url}\n`)
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': `https://finance.yahoo.com/quote/${symbol}`
      }
    })
    
    console.log(`Status: ${response.status} ${response.statusText}\n`)
    
    if (!response.ok) {
      console.error('❌ Request failed')
      return
    }
    
    const data = await response.json()
    
    console.log('Full response:', JSON.stringify(data, null, 2).substring(0, 2000))
    
    if (data.chart && data.chart.result && data.chart.result[0]) {
      const result = data.chart.result[0]
      const meta = result.meta
      
      console.log('✅ Successfully retrieved data!\n')
      
      // Price module
      if (result.price) {
        console.log('📊 Price Module:')
        console.log('  Market Cap:', result.price.marketCap)
        console.log('  Regular Market Price:', result.price.regularMarketPrice)
        console.log()
      }
      
      // Summary Detail
      if (result.summaryDetail) {
        console.log('📈 Summary Detail:')
        console.log('  Trailing PE:', result.summaryDetail.trailingPE)
        console.log('  Forward PE:', result.summaryDetail.forwardPE)
        console.log('  Dividend Yield:', result.summaryDetail.dividendYield)
        console.log('  Trailing Dividend Yield:', result.summaryDetail.trailingAnnualDividendYield)
        console.log('  Market Cap:', result.summaryDetail.marketCap)
        console.log()
      }
      
      // Key Statistics
      if (result.defaultKeyStatistics) {
        console.log('📊 Key Statistics:')
        console.log('  Trailing PE:', result.defaultKeyStatistics.trailingPE)
        console.log('  Forward PE:', result.defaultKeyStatistics.forwardPE)
        console.log()
      }
      
    } else {
      console.error('❌ No result data found')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testYahooQuoteSummary()

