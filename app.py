from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
import random

app = Flask(__name__)
CORS(app) # Это решает проблему "не работает" в браузере

# --- НАСТРОЙКИ ---
TELEGRAM_TOKEN = '8707170113:AAH88gma6zaDP1KJunOi0bQdxOAtZ9xi2qo'
CHAT_ID = '8291998554'

COMPLIMENTS = [
    "Твоя улыбка сияет ярче всех звезд в этой небуле ✨",
    "Ты — самое прекрасное, что случалось с этим кодом ❤️",
    "С каждым собранным сердечком я люблю тебя всё сильнее 🌸",
    "Даже искусственный интеллект знает, что ты — чудо! 💎"
]

@app.route('/')
def home():
    return "Сервер любви запущен и ждет запросов! ✨"

@app.route('/get_compliment', methods=['GET'])
def get_compliment():
    return jsonify({"text": random.choice(COMPLIMENTS)})

@app.route('/victory', methods=['POST'])
def victory():
    # Уведомление тебе в Telegram
    msg = "💖 Твоя любимая только что прошла игру! Пора обнять её! 💐"
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    try:
        requests.post(url, json={"chat_id": CHAT_ID, "text": msg})
    except:
        print("Telegram не настроен, но игра продолжается!")
    return jsonify({"status": "delivered"})

if __name__ == '__main__':
    print("Сервер запущен на http://sosy.hyi")
    app.run(port=5000)