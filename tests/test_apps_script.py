# -*- coding: utf-8 -*-
import sys
import json
import urllib.request
import urllib.error

sys.stdout.reconfigure(encoding='utf-8')

url = "https://script.google.com/macros/s/AKfycbzM-ad9rvD2-OQYZPazJRWpW5UALaP1dyzZs7p095LEEGRXQSqGSY6eO3TermwhwE4a/exec"

print(f"Testing GET: {url}")
try:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=20) as res:
        print("GET Status:", res.status)
        content = res.read().decode('utf-8')
        print("GET Response:", content)
except Exception as e:
    print("GET Error:", e)

print("\nTesting POST: (Mock small upload test)")
try:
    payload = {
        "action": "upload_evidence",
        "teacherName": "NGÔ THỊ LIỀN",
        "teacherStt": 1,
        "folderName": "01 - NGÔ THỊ LIỀN",
        "contestName": "KiemTraKetNoi",
        "fileBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=",
        "mimeType": "image/jpeg"
    }
    data_bytes = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        url,
        data=data_bytes,
        headers={
            "Content-Type": "text/plain;charset=utf-8",
            "User-Agent": "Mozilla/5.0"
        }
    )
    with urllib.request.urlopen(req, timeout=30) as res:
        print("POST Status:", res.status)
        content = res.read().decode('utf-8')
        print("POST Response:", content)
except Exception as e:
    print("POST Error:", e)
