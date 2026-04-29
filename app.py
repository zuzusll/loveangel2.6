from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
import requests
import random
import os

app = Flask(__name__)
CORS(app)

# --- НАСТРОЙКИ TELEGRAM ---
TELEGRAM_TOKEN = '8707170113:AAH88gma6zaDP1KJunOi0bQdxOAtZ9xi2qo'
CHAT_ID = '8291998554'

COMPLIMENTS = [
    "Твои руки творят магию ✨",
    "Ты — самая яркая звезда в этой небуле ❤️",
    "Ловить сердечки легко, а твой взгляд — бесценно 🌸",
    "Ты — моё главное вдохновение! 💎"
]

@app.route('/')
def home():
    # Эта команда ищет index.html в папке templates
    return render_template('index.html')

@app.route('/get_compliment', methods=['GET'])
def get_compliment():
    return jsonify({"text": random.choice(COMPLIMENTS)})

@app.route('/victory', methods=['POST'])
def victory():
    msg = "💖 ПОБЕДА! Она собрала все сердца своими руками! ✨"
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    try:
        requests.post(url, json={"chat_id": CHAT_ID, "text": msg})
    except:
        pass
    return jsonify({"status": "delivered"})

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
