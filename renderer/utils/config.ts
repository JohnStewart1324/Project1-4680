// API Configuration for Real Stock Data
// Get free API keys from these services:

export const API_CONFIG = {
  // Alpha Vantage (Free: 5 calls/minute, 500 calls/day)
  // Get key from: https://www.alphavantage.co/support/#api-key
  ALPHA_VANTAGE_KEY: 'demo', // Using demo key for testing
  
  // IEX Cloud (Free: 50,000 calls/month)
  // Get key from: https://iexcloud.io/cloud-login#/register/
  IEX_CLOUD_KEY: 'pk_test_demo', // Using test key for testing
  
  // Polygon.io (Free: 5 calls/minute)
  // Get key from: https://polygon.io/
  POLYGON_KEY: 'demo_key' // Using demo key for testing
}

// Yahoo Finance doesn't require an API key (unofficial API)
// This is the default data source used by the app

export const DATA_SOURCES = {
  PRIMARY: 'YAHOO_FINANCE', // No API key required
  FALLBACK: 'ALPHA_VANTAGE'  // Requires API key
} as const

// Instructions for getting API keys:
export const API_SETUP_INSTRUCTIONS = {
  ALPHA_VANTAGE: {
    url: 'https://www.alphavantage.co/support/#api-key',
    steps: [
      '1. Visit the Alpha Vantage website',
      '2. Click "Get Free API Key"',
      '3. Fill out the form with your email',
      '4. Copy the API key and replace YOUR_ALPHA_VANTAGE_KEY in config.ts'
    ],
    limits: '5 calls/minute, 500 calls/day'
  },
  IEX_CLOUD: {
    url: 'https://iexcloud.io/cloud-login#/register/',
    steps: [
      '1. Visit the IEX Cloud website',
      '2. Click "Sign Up" for free account',
      '3. Verify your email',
      '4. Copy the API key and replace YOUR_IEX_CLOUD_KEY in config.ts'
    ],
    limits: '50,000 calls/month'
  },
  POLYGON: {
    url: 'https://polygon.io/',
    steps: [
      '1. Visit the Polygon.io website',
      '2. Click "Get Started" for free account',
      '3. Complete registration',
      '4. Copy the API key and replace YOUR_POLYGON_KEY in config.ts'
    ],
    limits: '5 calls/minute'
  }
}


