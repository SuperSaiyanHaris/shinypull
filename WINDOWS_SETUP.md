# Windows Setup Guide

Step-by-step instructions for Windows PC setup.

## Prerequisites

### 1. Install Node.js

1. **Download Node.js**
   - Go to https://nodejs.org/
   - Download the LTS (Long Term Support) version
   - Choose Windows Installer (.msi) - 64-bit

2. **Run Installer**
   - Double-click the downloaded file
   - Click "Next" through the installer
   - ✅ Check "Automatically install necessary tools"
   - Click "Install"
   - Restart your computer when prompted

3. **Verify Installation**
   - Open Command Prompt (search for "cmd" in Start menu)
   - Type: `node --version`
   - Should show: `v20.x.x` or similar
   - Type: `npm --version`
   - Should show: `10.x.x` or similar

### 2. Install Git (Optional, for version control)

1. Download from https://git-scm.com/download/win
2. Run installer with default settings
3. Choose "Use Git from Git Bash only" or "Git from the command line"

### 3. Choose a Code Editor

**Recommended: VS Code**
1. Download from https://code.visualstudio.com/
2. Install with default settings
3. Install these extensions:
   - ES7+ React/Redux/React-Native snippets
   - Tailwind CSS IntelliSense
   - Prettier - Code formatter

## Project Setup

### Option A: Using Command Prompt

1. **Open Command Prompt**
   - Press `Win + R`
   - Type `cmd` and press Enter

2. **Navigate to your project folder**
   ```cmd
   cd C:\Users\YourUsername\Documents
   cd tcg-price-tracker
   ```

3. **Install dependencies**
   ```cmd
   npm install
   ```
   
   This will take 2-3 minutes. You'll see a progress bar.

4. **Start the app**
   ```cmd
   npm run dev
   ```

5. **Open in browser**
   - Open Chrome/Edge/Firefox
   - Go to: `http://localhost:3000`

### Option B: Using VS Code (Recommended)

1. **Open VS Code**

2. **Open Project Folder**
   - File → Open Folder
   - Navigate to `tcg-price-tracker`
   - Click "Select Folder"

3. **Open Terminal in VS Code**
   - Press `` Ctrl + ` `` (backtick key)
   - Or: View → Terminal

4. **Install and Run**
   ```bash
   npm install
   npm run dev
   ```

## Common Windows Issues

### Issue 1: "npm is not recognized"

**Cause**: Node.js not in PATH

**Fix**:
1. Restart your computer
2. If still not working:
   - Open Command Prompt as Administrator
   - Run: `setx PATH "%PATH%;C:\Program Files\nodejs"`
   - Restart Command Prompt

### Issue 2: PowerShell Execution Policy Error

**Error**: "running scripts is disabled on this system"

**Fix**:
1. Open PowerShell as Administrator
2. Run:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
3. Type `Y` and press Enter

### Issue 3: Port 3000 Already in Use

**Error**: "Port 3000 is already in use"

**Fix Option 1** - Kill the process:
```cmd
netstat -ano | findstr :3000
taskkill /PID [PID_NUMBER] /F
```

**Fix Option 2** - Use different port:
Edit `vite.config.js`:
```javascript
server: {
  port: 3001  // Change to any available port
}
```

### Issue 4: Slow npm install

**Causes**: Windows Defender, antivirus, or slow connection

**Fixes**:
1. Temporarily disable antivirus during install
2. Use faster package manager:
   ```cmd
   npm install -g pnpm
   pnpm install
   ```

### Issue 5: EPERM or Access Denied Errors

**Fix**:
1. Run Command Prompt/VS Code as Administrator
2. Or move project to a folder without special permissions
   - Good: `C:\Users\YourName\Projects\tcg-tracker`
   - Avoid: `C:\Program Files\` or Desktop

## Development Workflow

### Daily Startup

1. Open VS Code
2. Open project folder
3. Press `` Ctrl + ` `` for terminal
4. Run `npm run dev`
5. Edit files - changes appear automatically!

### Stopping the Server

- Press `Ctrl + C` in terminal
- Type `Y` if asked

### Making Changes

1. Edit files in `src/` folder
2. Save (`Ctrl + S`)
3. Browser auto-refreshes!

## File Locations on Windows

- **Project**: `C:\Users\YourName\Documents\tcg-price-tracker`
- **Node Modules**: `C:\Users\YourName\Documents\tcg-price-tracker\node_modules`
- **Builds**: `C:\Users\YourName\Documents\tcg-price-tracker\dist`

## VS Code Shortcuts (Windows)

- **Open Terminal**: `` Ctrl + ` ``
- **Quick Open File**: `Ctrl + P`
- **Search in Files**: `Ctrl + Shift + F`
- **Format Document**: `Shift + Alt + F`
- **Comment Line**: `Ctrl + /`
- **Save All**: `Ctrl + K, S`

## Recommended VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.autoSave": "afterDelay",
  "files.autoSaveDelay": 1000
}
```

## Building for Production

```cmd
npm run build
```

Output will be in `dist/` folder. These are the files you upload to your hosting service.

## Testing the PWA on Windows

1. **Using Chrome**:
   - Run: `npm run dev`
   - Open Chrome DevTools (F12)
   - Click "Application" tab
   - Look for "Service Workers" and "Manifest"

2. **Install as App**:
   - Click ⋮ (three dots) in Chrome
   - More Tools → Create Shortcut
   - ✅ Check "Open as window"
   - App appears on desktop!

## Deploying from Windows

### To Vercel:
```cmd
npm install -g vercel
vercel login
vercel --prod
```

### To Netlify:
```cmd
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

## Need Help?

### Check Terminal Output
- Errors are usually red
- Warnings are yellow
- Look for line numbers

### Clear Everything and Start Over
```cmd
rmdir /s node_modules
del package-lock.json
npm install
```

### Update Node.js
Download latest LTS from https://nodejs.org/

## Quick Reference Commands

```cmd
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Check for updates
npm outdated

# Update packages
npm update
```

## Performance Tips for Windows

1. **Exclude from Windows Defender**:
   - Settings → Update & Security → Windows Security
   - Virus & threat protection → Manage settings
   - Add exclusion → Folder
   - Add your `node_modules` folder

2. **Use SSD**: Keep project on SSD if available

3. **Close Other Apps**: VS Code can use lots of RAM

4. **Use PowerShell 7**: Faster than default PowerShell
   - Download from Microsoft Store

## Next Steps

1. ✅ Install Node.js
2. ✅ Install VS Code
3. ✅ Open project in VS Code
4. ✅ Run `npm install`
5. ✅ Run `npm run dev`
6. ✅ Open `http://localhost:3000`
7. 🎉 Start building!

---

**Stuck?** Check the main README.md or create an issue on GitHub.

**Working?** Start editing `src/App.jsx` and see your changes live!
