import urllib.request
import urllib.error
import json
import time

BASE_URL = "http://127.0.0.1:8002/api"
HEADERS = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; Mobile)",
    "Origin": "http://192.168.1.105:3003",
    "Referer": "http://192.168.1.105:3003/"
}

def make_request(url, method="GET", data=None):
    try:
        req = urllib.request.Request(url, method=method)
        for k, v in HEADERS.items():
            req.add_header(k, v)
        
        if data:
            req.data = json.dumps(data).encode('utf-8')

        with urllib.request.urlopen(req, timeout=10) as response:
            return {
                "status": response.status,
                "body": response.read().decode('utf-8')
            }
    except urllib.error.HTTPError as e:
        return {
            "status": e.code,
            "body": e.read().decode('utf-8')
        }
    except Exception as e:
        return {"error": str(e)}

def test_connectivity():
    print(f"\n--- Testing Connectivity ({BASE_URL}/ping) ---")
    res = make_request(f"{BASE_URL}/ping")
    if "error" in res:
        print(f"FAILED: {res['error']}")
        return False
    print(f"Status: {res['status']}")
    print(f"Status: {res['status']}")
    if res['status'] != 200:
        with open('last_error.html', 'w', encoding='utf-8') as f:
            f.write(res['body'])
        print("MAPPED ERROR TO last_error.html")
    # print(f"Body: {res['body']}") # Commented out to avoid truncation
    return res['status'] == 200

def test_db_connection():
    print(f"\n--- Testing DB Connection ({BASE_URL}/health) ---")
    res = make_request(f"{BASE_URL}/health")
    if "error" in res:
        print(f"FAILED: {res['error']}")
        return False
    print(f"Status: {res['status']}")
    if res['status'] != 200:
        with open('last_error.html', 'w', encoding='utf-8') as f:
            f.write(res['body'])
        print("MAPPED ERROR TO last_error.html")
    
    return res['status'] == 200 and "Database connection established" in res['body']

def test_login():
    print(f"\n--- Testing Login ({BASE_URL}/vendor/login) ---")
    payload = {
        "email": "mobiletest@test.com",
        "password": "password"
    }
    
    res = make_request(f"{BASE_URL}/vendor/login", method="POST", data=payload)
    
    if "error" in res:
        print(f"FAILED: {res['error']}")
        return False
        
    print(f"Status: {res['status']}")
    print(f"Body: {res['body'][:500]}...") # Truncate token
    
    if res['status'] == 200:
        if 'token' in res['body']:
            print("SUCCESS: Token received!")
            return True
        else:
            print("FAILED: No token in response")
            return False
    else:
        print(f"FAILED: Status {res['status']}")
        return False

if __name__ == "__main__":
    print("STARTING COMPREHENSIVE MOBILE SIMULATION TEST (URLLIB)")
    
    if test_connectivity():
        if test_db_connection():
            test_login()
        else:
            print("SKIPPING LOGIN: DB Check Failed")
    else:
        print("SKIPPING REST: Connectivity Failed")
