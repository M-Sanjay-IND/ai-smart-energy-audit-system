import requests
url = "https://digestible-semifine-chloe.ngrok-free.dev/data"
payload = {"voltage": 230, "current": 2, "power": 460, "energy": 0}
try:
    response = requests.post(url, json=payload, headers={"ngrok-skip-browser-warning": "true"}, timeout=10)
    print("STATUS", response.status_code)
    print("BODY", response.text)
except Exception as e:
    print("ERROR", e)
