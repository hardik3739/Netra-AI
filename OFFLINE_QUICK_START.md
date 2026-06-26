# NETRA AI — Offline Quick Start Checklist

Use this checklist to ensure everything is configured for offline operation.

## Pre-Flight Checklist

- [ ] **Ollama installed** and running (`ollama serve` in a terminal)
- [ ] **Phi-3 model available** (`ollama list` shows `phi3`)
- [ ] **Tesseract OCR** installed (`tesseract --version` works)
- [ ] **Python 3.8+** installed (`python --version`)
- [ ] **Node.js 18+** installed (`node --version`)

## Setup Checklist

```powershell
# 1. Activate Python environment
cd d:\netraai_backend_complete\netraai_backend
& .\venv\Scripts\Activate.ps1

# 2. Verify backend dependencies
pip list | grep -E "(fastapi|torch|transformers|ollama|pytesseract)"

# 3. Reinstall if needed (after removing Google dependencies)
npm ci  # Force install exact versions from package-lock.json

# 4. Check frontend dependencies
npm list | grep -E "(google|genai|maps)" # Should show nothing

# 5. Verify no external imports
grep -r "import.*google" src/ --include="*.tsx" --include="*.ts"  # Should return nothing
```

## Runtime Checklist (Every Session)

### Terminal 1: Start Ollama
```powershell
# This MUST be running before starting backend
ollama serve
# Expected: "Listening on 127.0.0.1:11434"
```

### Terminal 2: Start Backend
```powershell
cd d:\netraai_backend_complete\netraai_backend
& .\venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8000
# Expected: "Application startup complete"
```

### Terminal 3: Start Frontend
```powershell
cd d:\netraai_backend_complete\netraai_backend
npm run dev
# Expected: "Local: http://localhost:5173"
```

## Connectivity Verification

✅ **Run these to verify offline mode:**

```powershell
# Should FAIL (no internet)
ping 8.8.8.8          # Google DNS - should timeout
ping google.com       # Should resolve but can't reach
ipconfig /all         # Check your network status

# Should SUCCEED (local services)
curl http://localhost:11434/api/tags        # Ollama
curl http://localhost:8000/docs             # Backend API
curl http://localhost:5173                  # Frontend (in browser)

# Should resolve but NOT ping (firewall rules)
curl http://rbi.org.in/scripts/NotificationUser.aspx  # Will fail - using mock instead
```

## Offline Mode Indicators

✅ In the browser console, you should see:

```javascript
// Expected log patterns
"Ollama available at http://localhost:11434"
"Using mock regulatory data (offline mode)"
"SVG map rendered (offline)"
"No external CDN resources loaded"
```

❌ Should NOT see:

```javascript
// Should NOT see these errors
"Failed to load from googleapis.com"
"Google Maps API key missing"
"@google/genai not found"
"Failed to fetch regulatory portal"
```

## Offline Network Isolation (Optional)

To fully test offline mode, disconnect your network:

```powershell
# View network connections
netstat -an | grep ESTABLISHED

# After disconnecting network:
# - Backend should continue running
# - Frontend should continue working
# - All data should display from cache
# - Regulatory data should use mock data
```

## Performance Baseline

Measure offline performance:

```powershell
# Measure Ollama response time
# Expected: 5-10 seconds for first inference, 2-5 for subsequent

# Measure Frontend load time
# Expected: <1 second

# Measure API response time
# Expected: <500ms
```

## Cleanup Before Going Offline

```powershell
# Clear browser cache (recommended but not required)
# Clear browser cookies (recommended but not required)

# Verify no pending downloads
# Verify all ports are listening

netstat -an | findstr LISTENING
# Should see:
# TCP    127.0.0.1:11434    LISTENING  (Ollama)
# TCP    127.0.0.1:5173     LISTENING  (Frontend)
# TCP    127.0.0.1:8000     LISTENING  (Backend)
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Frontend won't load | Backend not running on 8000? |
| Map not displaying | Check browser console for SVG errors |
| LLM not responding | Is Ollama running? `ollama serve` in another terminal |
| OCR not working | Is Tesseract installed? Run `tesseract --version` |
| Database locked | Restart backend |

## Success Indicators

✅ You're ready for offline when:

1. **All three services running:**
   - `http://localhost:11434` (Ollama) ✅
   - `http://localhost:8000` (Backend) ✅
   - `http://localhost:5173` (Frontend) ✅

2. **No external requests made:**
   - Network isolation test passes ✅
   - Browser DevTools Network tab shows only localhost ✅
   - No 401/403 API key errors ✅

3. **All modules functional:**
   - ForgeShield loads and analyzes documents ✅
   - RegPilot displays mock regulatory data ✅
   - Audit trail records all actions ✅
   - Branch map displays without errors ✅

---

**Ready to go offline!** 🚀
