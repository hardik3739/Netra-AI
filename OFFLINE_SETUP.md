# NETRA AI — Complete Offline Setup Guide

This application is now fully configured to run offline (100% locally) without any external API calls or internet dependencies.

## Prerequisites

- **Python 3.8+** (for backend)
- **Node.js 18+** (for frontend)
- **Ollama** (for local LLM inference)
- **Tesseract OCR** (for document scanning)

## Step 1: Install Ollama (One-Time)

Ollama provides the local LLM model (Microsoft Phi-3 Mini) for regulatory analysis.

### Windows

1. Download Ollama from: https://ollama.com (requires internet once)
2. Install and run Ollama
3. Verify Ollama is running:
   ```powershell
   curl http://localhost:11434/api/tags
   ```
   You should see a JSON response.

### Pull the Model (One-Time Setup)

Run this ONCE while connected to internet:

```powershell
ollama pull phi3
```

This downloads ~2.2GB and takes 5-10 minutes. After this, everything runs offline.

**Verify the model is installed:**

```powershell
$body = @{
    model = "phi3"
    prompt = "<|user|>Say OK<|end|><|assistant|>"
    stream = $false
    options = @{num_predict = 5}
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:11434/api/generate" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body | Select-Object -ExpandProperty Content | ConvertFrom-Json
```

Expected output: `{"response": "OK", ...}`

---

## Step 2: Install Tesseract OCR (One-Time)

Required for document forgery detection (ForgeShield module).

### Windows

1. Download installer: https://github.com/UB-Mannheim/tesseract/wiki
2. Run installer (accept defaults)
3. Verify installation:
   ```powershell
   tesseract --version
   ```

**Note:** The installer may require administrator privileges. Run PowerShell as Administrator if needed.

---

## Step 3: Setup Python Virtual Environment

```powershell
cd d:\netraai_backend_complete\netraai_backend

# Activate virtualenv (if already created)
& .\venv\Scripts\Activate.ps1

# OR create a new one
python -m venv venv
& .\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
```

**Offline Installation (if no internet available):**

If you're installing without internet, ensure all wheels are pre-cached or use:

```powershell
pip install --no-index --find-links=file:///path/to/wheels -r requirements.txt
```

---

## Step 4: Setup Frontend

```powershell
cd d:\netraai_backend_complete\netraai_backend

# Install dependencies
npm install

# For audit-trail dashboard (if needed)
cd netraai-audit-trail
npm install
cd ..
```

---

## Step 5: Ensure Ollama is Running

Before starting the backend, **Ollama must be running in the background.**

### Start Ollama (Windows)

```powershell
ollama serve
```

This should output:
```
Listening on 127.0.0.1:11434 (server logs will appear here)
```

Leave this terminal open. You can minimize it.

---

## Step 6: Start the Backend

```powershell
# In a NEW PowerShell terminal (keep Ollama running in the other)
cd d:\netraai_backend_complete\netraai_backend
& .\venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8000
```

Expected output:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

---

## Step 7: Start the Frontend

```powershell
# In a NEW PowerShell terminal (keep backend running)
cd d:\netraai_backend_complete\netraai_backend
npm run dev
```

Expected output:
```
VITE v6.2.3  ready in 500 ms

➜  Local:   http://localhost:5173/
```

---

## Step 8: Access the Application

Open your browser and navigate to:

- **Main Dashboard:** http://localhost:5173
- **Audit Trail Dashboard:** http://localhost:3000 (if netraai-audit-trail is running)
- **API Docs:** http://localhost:8000/docs

---

## How Everything Runs Offline

### ✅ Backend (Python FastAPI)

| Module | Dependency | Offline Status |
|--------|-----------|---|
| **ForgeShield** | PyTorch + ViT Model | ✅ Fully offline (cached locally) |
| **RegPilot** | Ollama (Phi-3 Mini) | ✅ Runs on localhost:11434 |
| **Regulatory Crawling** | RBI/SEBI/IRDAI URLs | ✅ Falls back to mock data offline |
| **OCR** | Tesseract | ✅ Local binary |
| **Database** | PostgreSQL (local) | ✅ SQLite fallback if needed |

### ✅ Frontend (React + Vite)

| Component | Dependency | Offline Status |
|-----------|-----------|---|
| **Branch Map** | Google Maps API | ❌ Replaced with offline SVG map ✅ |
| **Charts** | Recharts library | ✅ Fully offline |
| **Icons** | Lucide React | ✅ Fully offline |
| **User Avatar** | Google profile image | ❌ Replaced with local SVG icon ✅ |
| **Compliance Dashboard** | Local state | ✅ Fully offline |

---

## Offline Mode Behavior

### When Running Offline

1. **Regulatory Portal Scraping:** Automatically uses rich mock data (sample circulars from RBI, SEBI, IRDAI, MCA)
2. **LLM Analysis:** Uses local Phi-3 Mini via Ollama (no cloud API)
3. **Map Display:** Shows simplified SVG map of India (no external tiles)
4. **User Interface:** All components render locally, no external CDNs
5. **Database:** Uses local SQLite or PostgreSQL (if running locally)

### Mock Regulatory Data

When internet is unavailable, the system serves pre-populated regulatory circulars:

- **RBI** (Reserve Bank of India): Master Direction on KYC amendments
- **SEBI** (Securities & Exchange Board): Cybersecurity framework guidelines
- **IRDAI** (Insurance Regulatory Authority): Data privacy guidelines
- **MCA** (Ministry of Corporate Affairs): XBRL filing requirements

Each mock circular includes:
- Realistic compliance requirements
- Department-wise action items
- Measurable action points (MAPs)
- Audit trails

---

## Troubleshooting

### Ollama Not Connecting

**Error:** `Connection refused on http://localhost:11434`

**Solution:**
1. Ensure Ollama is running: `ollama serve`
2. Check Ollama is listening: `netstat -an | findstr 11434`
3. Try manual connection: `curl http://localhost:11434/api/tags`

### Phi-3 Model Not Found

**Error:** `model 'phi3' not found`

**Solution:**
```powershell
ollama pull phi3
ollama list  # Verify it was installed
```

### Tesseract Not Found

**Error:** `TesseractNotFoundError`

**Solution:**
1. Install Tesseract from: https://github.com/UB-Mannheim/tesseract/wiki
2. Verify installation:
   ```powershell
   tesseract --version
   ```
3. If still not found, set environment variable:
   ```powershell
   $env:TESSERACT_CMD = "C:\Program Files\Tesseract-OCR\tesseract.exe"
   ```

### Frontend Not Loading

**Error:** Blank page or "Cannot GET /"

**Solution:**
1. Ensure npm dev server is running on port 5173
2. Check for errors in browser console (F12)
3. Verify backend is accessible: `curl http://localhost:8000/docs`

### Python Dependencies Installation Fails

**Solution (Offline):**

```powershell
# Download wheels on machine with internet
pip download -r requirements.txt -d ./wheels

# Transfer wheels folder to offline machine

# Install from wheels
pip install --no-index --find-links ./wheels -r requirements.txt
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Backend
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=phi3
DATABASE_URL=sqlite:///./netra.db

# Frontend
VITE_API_BASE_URL=http://localhost:8000
```

---

## Performance Notes

- **First LLM inference:** ~5-10 seconds (Phi-3 Mini is optimized for edge devices)
- **Subsequent inferences:** ~2-5 seconds (model cached in memory)
- **Frontend load:** <1 second (all assets local)
- **Map rendering:** Instant (SVG-based, no external tiles)

---

## Data Persistence

All data is stored locally:

- **Database:** `./netra.db` (SQLite)
- **ViT Model Cache:** `~/.cache/huggingface/hub/` (HuggingFace models)
- **Ollama Model:** `~/.ollama/models/` (Ollama cache)

---

## Resetting the Application

To start fresh:

```powershell
# Reset database
rm netra.db

# Clear model cache (optional)
rm -Recurse ~/.cache/huggingface/hub/
```

---

## Production Offline Deployment

For deployment without internet:

1. **Pre-download all models** on a machine with internet
2. **Create a wheels directory** with all Python packages
3. **Bundle with Docker** or create offline installer
4. **Set resource limits** (Phi-3 Mini uses ~4GB RAM)

---

## Support

For issues running offline, check:

1. Ollama service status: `http://localhost:11434/api/tags`
2. Backend health: `http://localhost:8000/docs`
3. Frontend console logs: Browser DevTools (F12)
4. Python logs: Check terminal output for errors
5. Network availability: `ping 8.8.8.8` (should fail)

---

**Last Updated:** June 2026  
**Status:** ✅ Fully Offline Ready
