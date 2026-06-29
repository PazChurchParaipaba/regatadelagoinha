import urllib.request
import urllib.error
import json
import sys

URL = 'https://groezaseypdbpgymgpvo.supabase.co/rest/v1/embarcacoes'
KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdyb2V6YXNleXBkYnBneW1ncHZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNjkxNjYsImV4cCI6MjA4MTY0NTE2Nn0.5U5QeoGmZn_i9Y8POoUCkatBUAdSW-cjHRyfxpm_pyM'

headers = {
    'apikey': KEY,
    'Authorization': f'Bearer {KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
}

def sync():
    # 1. Get current
    req = urllib.request.Request(URL, headers={'apikey': KEY, 'Authorization': f'Bearer {KEY}'})
    try:
        with urllib.request.urlopen(req) as response:
            current_data = json.loads(response.read().decode('utf-8'))
            print(f"Found {len(current_data)} records in Supabase.")
    except urllib.error.URLError as e:
        print("Failed to get current data:", e)
        return

    # 2. Delete all
    if len(current_data) > 0:
        print("Deleting current records...")
        req = urllib.request.Request(f"{URL}?id=gt.0", headers=headers, method='DELETE')
        try:
            with urllib.request.urlopen(req) as response:
                print("Delete status:", response.status)
        except urllib.error.URLError as e:
            print("Failed to delete:", e)
            return

    # 3. Read data.json and upload
    with open('data.json', 'r', encoding='utf-8') as f:
        local_data = json.load(f)

    print(f"Uploading {len(local_data)} records...")
    
    payload = []
    for item in local_data:
        payload.append({
            "num_embarcacao": item.get("numEmbarcacao", 0),
            "tamanho": item.get("tamanho", ""),
            "nome_barco": item.get("nomeBarco", ""),
            "proprietario": item.get("proprietario", ""),
            "empresa": item.get("empresa", "")
        })

    data_bytes = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(URL, data=data_bytes, headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req) as response:
            print("Upload successful! Status:", response.status)
    except urllib.error.URLError as e:
        print("Failed to upload:", e)
        if hasattr(e, 'read'):
            print(e.read().decode('utf-8'))

if __name__ == "__main__":
    sync()
