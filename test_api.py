import requests
import json

print("Testing NetraAI API endpoints...")
print("=" * 50)

# Test GET /regpilot/branches
try:
    resp = requests.get('http://localhost:8000/regpilot/branches', timeout=5)
    print(f"✓ GET /regpilot/branches: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        print(f"  → Found {len(data)} branches")
except Exception as e:
    print(f"✗ GET /regpilot/branches FAILED: {e}")

# Test GET /forgeshield/patterns
try:
    resp = requests.get('http://localhost:8000/forgeshield/patterns', timeout=5)
    print(f"✓ GET /forgeshield/patterns: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        print(f"  → Found {len(data)} fraud patterns")
except Exception as e:
    print(f"✗ GET /forgeshield/patterns FAILED: {e}")

# Test GET /regpilot/compliance-history
try:
    resp = requests.get('http://localhost:8000/regpilot/compliance-history', timeout=5)
    print(f"✓ GET /regpilot/compliance-history: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        print(f"  → Found {len(data)} snapshots")
except Exception as e:
    print(f"✗ GET /regpilot/compliance-history FAILED: {e}")

# Test GET /forgeshield/stats
try:
    resp = requests.get('http://localhost:8000/forgeshield/stats', timeout=5)
    print(f"✓ GET /forgeshield/stats: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        print(f"  → Stats: {data}")
except Exception as e:
    print(f"✗ GET /forgeshield/stats FAILED: {e}")

# Test POST /regpilot/snapshot (manually trigger snapshot)
try:
    resp = requests.post('http://localhost:8000/regpilot/snapshot', timeout=5)
    print(f"✓ POST /regpilot/snapshot: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        print(f"  → Snapshot recorded: {data.get('date')}")
except Exception as e:
    print(f"✗ POST /regpilot/snapshot FAILED: {e}")

print("=" * 50)
print("API Endpoint Testing Complete!")
