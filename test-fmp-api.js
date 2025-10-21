// Test Financial Modeling Prep API (free tier)
async function testFMPAPI() {
  const symbol = 'GOOGL'
  const url = `https://financialmodelingprep.com/api/v3/quote/${symbol}`
  
  console.log(`Testing FMP API for ${symbol}...`)
  console.log(`URL: ${url}\n`)
  
  try {
    const response = await fetch(url)
    
    console.log(`Status: ${response.status} ${response.statusText}\n`)
    
    if (!response.ok) {
      console.error('❌ Request failed')
      return
    }
    
    const data = await response.json()
    
    console.log('Full response:', JSON.stringify(data, null, 2))
    
    if (data && data.length > 0) {
      const stock = data[0]
      console.log('\n✅ Successfully retrieved data!\n')
      console.log('Symbol:', stock.symbol)
      console.log('Name:', stock.name)
      console.log('Price:', stock.price)
      console.log('P/E Ratio:', stock.pe)
      console.log('Market Cap:', stock.marketCap)
      console.log('Volume:', stock.volume)
      console.log('Change:', stock.change)
      console.log('Change %:', stock.changesPercentage)
      console.log('Dividend Yield:', stock.dividendYield || 'N/A')
    } else {
      console.error('❌ No data found')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testFMPAPI()

