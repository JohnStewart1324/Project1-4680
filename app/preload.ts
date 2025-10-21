import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Example: expose a method to get app version
  getVersion: () => ipcRenderer.invoke('get-version'),
  
  // Stock data fetching methods
  fetchYahooData: (symbol: string) => ipcRenderer.invoke('fetch-yahoo-data', symbol),
  fetchMultipleStocks: (symbols: string[]) => ipcRenderer.invoke('fetch-multiple-stocks', symbols),
  fetchHistoricalData: (symbol: string, period?: string) => ipcRenderer.invoke('fetch-historical-data', symbol, period),
})

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: {
      getVersion: () => Promise<string>
      fetchYahooData: (symbol: string) => Promise<any>
      fetchMultipleStocks: (symbols: string[]) => Promise<any[]>
      fetchHistoricalData: (symbol: string, period?: string) => Promise<any>
    }
  }
}
