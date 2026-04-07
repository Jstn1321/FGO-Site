#!/usr/bin/env python3
"""
Simple Flask API server.
Run with: python server.py
Sits behind nginx reverse proxy on your Ubuntu server.
Proxy /api/* to this Flask app (default port 5050).

Install deps:  pip install flask flask-cors
"""

from flask import Flask, jsonify
from flask_cors import CORS
import subprocess, os, sys
import sys

app = Flask(__name__)
CORS(app)

PYTHON = "/home/justin/Website/FGO-Site/fgo-banners/venv/bin/python3"

# Adjust this path to wherever your scraper lives on the server
SCRAPER_PATH = "/home/justin/Website/FGO-Site/fgo-banners/scraper.py"
#SCRAPER_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "scraper.py")
@app.route("/api/refresh", methods=["POST"])
def refresh():
    try:
        result = subprocess.run(
            [PYTHON, SCRAPER_PATH],
            capture_output=True,
            text=True,
            timeout=60
        )
        if result.returncode == 0:
            return jsonify({
                "success": True,
                "message": "Banners updated successfully.",
                "output": result.stdout[-800:] if result.stdout else ""
            })
        else:
            return jsonify({
                "success": False,
                "message": "Scraper exited with an error.",
                "output": result.stderr[-800:] if result.stderr else ""
            }), 500
    except subprocess.TimeoutExpired:
        return jsonify({"success": False, "message": "Scraper timed out (60s)."}), 504
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route("/api/status", methods=["GET"])
def status():
    return jsonify({"ok": True})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5050, debug=False)
