import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { fileURLToPath } from 'url'
import fetch from 'node-fetch'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// Note: electron-squirrel-startup is not included in this basic setup

const createWindow = (): void => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 800,
    width: 1200,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'default',
    show: false,
  })

  // and load the index.html of the app.
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // Open the DevTools.
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools()
  }
}

// Set up IPC handlers for stock data fetching
function setupIpcHandlers() {
  // Handle Yahoo Finance API requests
  ipcMain.handle('fetch-yahoo-data', async (event, symbol: string) => {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching Yahoo data:', error)
      throw error
    }
  })

  // Handle multiple stock data requests
  ipcMain.handle('fetch-multiple-stocks', async (event, symbols: string[]) => {
    try {
      const promises = symbols.map(async (symbol) => {
        try {
          const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          })
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          
          const data = await response.json()
          return { symbol, data, success: true }
        } catch (error) {
          console.error(`Error fetching data for ${symbol}:`, error)
          return { symbol, error: (error as Error).message, success: false }
        }
      })

      const results = await Promise.allSettled(promises)
      return results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value
        } else {
          return { symbol: symbols[index], error: (result.reason as Error).message, success: false }
        }
      })
    } catch (error) {
      console.error('Error in batch fetch:', error)
      throw error
    }
  })

  // Handle historical data requests
  ipcMain.handle('fetch-historical-data', async (event, symbol: string, period: string = '1mo') => {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${period}&interval=1d`
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching historical data:', error)
      throw error
    }
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  setupIpcHandlers()
  createWindow()
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
