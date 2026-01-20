#!/usr/bin/env python3
"""
Gateway REST simple pour tester le connecteur Midpoint
"""

from flask import Flask, request, jsonify
import json
from datetime import datetime

app = Flask(__name__)

@app.route('/')
def health():
    """Endpoint de santé"""
    return jsonify({'status': 'Gateway OK', 'timestamp': datetime.now().isoformat()})

@app.route('/create', methods=['POST'])
def create():
    """Reçoit les créations d'objets depuis Midpoint"""
    data = request.get_json()

    print("\n" + "="*60)
    print("CREATE REÇU")
    print("="*60)
    print(json.dumps(data, indent=2, ensure_ascii=False))
    print("="*60 + "\n")

    # Retourne un UID généré
    return jsonify({
        'success': True,
        'uid': str(int(datetime.now().timestamp() * 1000)),
        'message': 'Object created successfully'
    })

@app.route('/update', methods=['POST'])
def update():
    """Reçoit les modifications d'objets depuis Midpoint"""
    data = request.get_json()

    print("\n" + "="*60)
    print("UPDATE REÇU")
    print("="*60)
    print(json.dumps(data, indent=2, ensure_ascii=False))
    print("="*60 + "\n")

    return jsonify({
        'success': True,
        'message': 'Object updated successfully'
    })

@app.route('/delete', methods=['POST'])
def delete():
    """Reçoit les suppressions d'objets depuis Midpoint"""
    data = request.get_json()

    print("\n" + "="*60)
    print("DELETE REÇU")
    print("="*60)
    print(json.dumps(data, indent=2, ensure_ascii=False))
    print("="*60 + "\n")

    return jsonify({
        'success': True,
        'message': 'Object deleted successfully'
    })

if __name__ == '__main__':
    print("\n" + "="*60)
    print("Gateway REST Midpoint - Démarrage")
    print("="*60)
    print("Écoute sur : http://0.0.0.0:5000")
    print("Endpoints disponibles :")
    print("  - GET  /           (santé)")
    print("  - POST /create     (création)")
    print("  - POST /update     (modification)")
    print("  - POST /delete     (suppression)")
    print("="*60 + "\n")

    app.run(host='0.0.0.0', port=5000, debug=True)
