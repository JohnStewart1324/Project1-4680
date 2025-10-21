# Security Guidelines

## 🔐 API Key Protection

### ⚠️ IMPORTANT: Never Commit API Keys to Git

This project uses the Google Gemini API which requires an API key. **API keys should NEVER be committed to version control.**

### ✅ Proper Setup

1. **Environment Variables** (Recommended)
   - API keys are stored in `.env` file
   - `.env` is listed in `.gitignore` and will NOT be committed
   - Use `.env.example` as a template

2. **Getting Your API Key**
   - Visit: https://makersuite.google.com/app/apikey
   - Sign in with your Google account
   - Generate a free API key
   - Copy the key to your `.env` file

3. **Setup Steps**
   ```bash
   # 1. Copy the example file
   cp .env.example .env
   
   # 2. Edit .env and add your key
   # VITE_GEMINI_API_KEY=your_actual_api_key_here
   
   # 3. Build the app
   npm run build
   ```

### 🛡️ What's Protected

The following files are automatically excluded from Git:
- `.env` - Your actual API key (NEVER commit this)
- All other .env.* files

### ✅ What to Commit

- `.env.example` - Template file (safe to commit)
- Code that reads from environment variables

### ❌ If You Accidentally Committed Your API Key

1. **Immediately revoke the key** at https://makersuite.google.com/app/apikey
2. **Generate a new key**
3. **Update your .env file** with the new key

---

**Last Updated**: October 20, 2025
