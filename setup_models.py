"""
NetraAI — One-Time Model Setup Script
Run this ONCE at home while you have internet.
After this, NetraAI runs 100% offline.
"""

import subprocess
import requests
import sys


def check_ollama():
    print("\n[1/3] Checking Ollama...")
    try:
        r = requests.get("http://localhost:11434/api/tags", timeout=5)
        models = [m["name"] for m in r.json().get("models", [])]
        print(f"      Ollama running ✓  —  Models: {models}")
        return True, models
    except Exception:
        print("      Ollama not running. Please start Ollama first.")
        print("      Download from: https://ollama.com")
        return False, []


def pull_phi3(existing_models):
    print("\n[2/3] Setting up Microsoft Phi-3 Mini...")
    if any("phi3" in m for m in existing_models):
        print("      Microsoft Phi-3 Mini already installed ✓")
        return True
    print("      Pulling Microsoft Phi-3 Mini (2.2GB)...")
    print("      This takes 5-10 minutes depending on internet speed.")
    result = subprocess.run(["ollama", "pull", "phi3"], 
                           capture_output=False)
    if result.returncode == 0:
        print("      Microsoft Phi-3 Mini installed ✓")
        return True
    else:
        print("      Failed to pull Phi-3 Mini. Try manually: ollama pull phi3")
        return False


def verify_phi3():
    print("\n[2b/3] Verifying Microsoft Phi-3 Mini...")
    try:
        r = requests.post(
            "http://localhost:11434/api/generate",
            json={"model": "phi3", "prompt": "<|user|>Say OK<|end|><|assistant|>",
                  "stream": False, "options": {"num_predict": 5}},
            timeout=30
        )
        response = r.json().get("response", "").strip()
        print(f"      Phi-3 test response: '{response}' ✓")
        return True
    except Exception as e:
        print(f"      Verification failed: {e}")
        return False


def download_vit_model():
    print("\n[3/3] Downloading ViT model (google/vit-base-patch16-224)...")
    print("      Size: ~350MB — saves to local HuggingFace cache.")
    try:
        from transformers import ViTForImageClassification, ViTImageProcessor
        ViTImageProcessor.from_pretrained("google/vit-base-patch16-224")
        ViTForImageClassification.from_pretrained("google/vit-base-patch16-224")
        print("      ViT model cached ✓")
        return True
    except Exception as e:
        print(f"      Failed: {e}")
        print("      Install transformers: pip install transformers torch")
        return False


if __name__ == "__main__":
    print("=" * 55)
    print("  NetraAI — One-Time Setup")
    print("  Microsoft Phi-3 Mini + ViT Model")
    print("=" * 55)
    
    ollama_ok, models = check_ollama()
    if not ollama_ok:
        print("\nPlease start Ollama and run this script again.")
        sys.exit(1)
    
    phi3_ok = pull_phi3(models)
    if phi3_ok:
        verify_phi3()
    
    vit_ok = download_vit_model()
    
    print("\n" + "=" * 55)
    if phi3_ok and vit_ok:
        print("  Setup Complete!")
        print("  NetraAI is ready to run 100% offline.")
        print("\n  To start:")
        print("  Terminal 1: ollama serve")
        print("  Terminal 2: uvicorn main:app --reload")
        print("  Terminal 3: cd frontend && npm start")
    else:
        print("  Setup incomplete — check errors above.")
    print("=" * 55)
