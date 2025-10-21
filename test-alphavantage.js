// Test Alpha Vantage API (demo key - limited)
async function testAlphaVantage() {
  const symbol = 'GOOGL'
  const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=demo`
  
  console.log(`Testing Alpha Vantage API for ${symbol}...`)
  console.log(`URL: ${url}\n`)
  
  try {
    const response = await fetch(url)
    
    console.log(`Status: ${response.status} ${response.statusText}\n`)
    
    if (!response.ok) {
      console.error('❌ Request failed')
      return
    }
    
    const data = await response.json()
    
    console.log('Response (first 1000 chars):', JSON.stringify(data, null, 2).substring(0, 1000))
    
    if (data.Symbol) {
      console.log('\n✅ Successfully retrieved data!\n')
      console.log('Symbol:', data.Symbol)
      console.log('Name:', data.Name)
      console.log('P/E Ratio:', data.PERatio)
      console.log('Market Cap:', data.MarketCapitalization)
      console.log('Dividend Yield:', data.DividendYield)
    } else {
      console.error('❌ No data found or rate limited')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testAlphaVantage()

