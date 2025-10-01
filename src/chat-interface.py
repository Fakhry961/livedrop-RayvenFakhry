import requests
import sys
import time

BASE = input("Enter your ngrok base URL (e.g. https://abcd.ngrok.io): ").strip().rstrip('/')

def ask(q):
    try:
        r = requests.post(BASE + "/chat", json={"question": q}, timeout=30)
        r.raise_for_status()
        data = r.json()
        print("\nAnswer:", data.get("answer","(no answer)"))
        print("Sources:", ", ".join(data.get("sources", [])))
    except Exception as e:
        print("Request error:", e)

def repl():
    print("Connected to", BASE)
    while True:
        q = input("\n> ")
        if q.lower() in ("exit","quit"):
            print("bye")
            break
        print("[Retrieving context...]\n[Calling LLM...]")
        ask(q)
        time.sleep(0.1)

if __name__ == "__main__":
    repl()