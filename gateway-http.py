#!/usr/bin/env python3
"""
Gateway HTTP Simple - Reçoit les opérations de Midpoint via HTTP
"""

from flask import Flask, request, jsonify
import json
from datetime import datetime

app = Flask(__name__)

def print_separator():
    print("=" * 60)

@app.route('/create', methods=['POST'])
def create():
    try:
        data = request.get_json()

        print_separator()
        print("CREATE REÇU VIA HTTP")
        print_separator()
        print(json.dumps(data, indent=2, ensure_ascii=False))
        print_separator()
        print()

        return jsonify({
            "status": "success",
            "message": "User created",
            "uid": data.get("attributes", {}).get("username", "unknown")
        }), 201

    except Exception as e:
        print(f"❌ Erreur: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/update', methods=['POST'])
def update():
    try:
        data = request.get_json()

        print_separator()
        print("UPDATE REÇU VIA HTTP")
        print_separator()
        print(json.dumps(data, indent=2, ensure_ascii=False))
        print_separator()
        print()

        return jsonify({
            "status": "success",
            "message": "User updated",
            "uid": data.get("uid", "unknown")
        }), 200

    except Exception as e:
        print(f"❌ Erreur: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/delete', methods=['POST'])
def delete():
    try:
        data = request.get_json()

        print_separator()
        print("DELETE REÇU VIA HTTP")
        print_separator()
        print(json.dumps(data, indent=2, ensure_ascii=False))
        print_separator()
        print()

        return jsonify({
            "status": "success",
            "message": "User deleted",
            "uid": data.get("uid", "unknown")
        }), 200

    except Exception as e:
        print(f"❌ Erreur: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ok",
        "service": "Gateway HTTP Midpoint",
        "timestamp": datetime.now().isoformat()
    }), 200


if __name__ == '__main__':
    print("=" * 60)
    print("Gateway HTTP - Réception opérations Midpoint")
    print("=" * 60)
    print("Endpoints disponibles:")
    print("  - POST /create  → Création d'utilisateur")
    print("  - POST /update  → Modification d'utilisateur")
    print("  - POST /delete  → Suppression d'utilisateur")
    print("  - GET  /health  → Health check")
    print("=" * 60)
    print("Serveur démarré sur http://localhost:5000")
    print("=" * 60)
    print()

    app.run(host='0.0.0.0', port=5000, debug=False)
