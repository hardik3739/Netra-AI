from fastapi.testclient import TestClient
from main import app

client = TestClient(app)
response = client.get('/regpilot/branches', headers={'Origin': 'http://localhost:3000'})
print('STATUS', response.status_code)
print('TEXT', response.text)
print('HEADERS', response.headers)
try:
    print('JSON', response.json())
except Exception as e:
    print('JSON_ERR', e)
