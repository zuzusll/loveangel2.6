'use strict';

const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const loadingScreen = document.getElementById('loading');
const uiScreen = document.getElementById('ui');

let vw = canvasElement.width = window.innerWidth;
let vh = canvasElement.height = window.innerHeight;

let score = 0;
const winScore = 20;
let hearts = [];
let handTrails = []; // Светящийся след от руки

// --- НАСТРОЙКА НЕЙРОСЕТИ ---
const hands = new Hands({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
}});

hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

// Что происходит, когда нейросеть видит руку
hands.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({image: videoElement});
  },
  width: 1280,
  height: 720
});

// Запускаем камеру
camera.start().then(() => {
    loadingScreen.style.display = 'none';
    uiScreen.style.display = 'block';
});

// --- СВЯЗЬ С PYTHON ---
async function fetchCompliment() {
    try {
        const res = await fetch('http://127.0.0.1:5000/get_compliment');
        const data = await res.json();
        document.getElementById('compliment-box').innerText = data.text;
    } catch (e) { console.log("Python-сервер отдыхает"); }
}

async function sendVictory() {
    try {
        await fetch('http://127.0.0.1:5000/victory', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({status: 'won'})
        });
    } catch (e) { console.log("Ошибка ТГ"); }
}

// --- ЛОГИКА И ОТРИСОВКА ---
function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, vw, vh);

    // 1. Рисуем камеру как зеркало
    canvasCtx.translate(vw, 0);
    canvasCtx.scale(-1, 1);
    canvasCtx.drawImage(results.image, 0, 0, vw, vh);
    
    // 2. Накладываем романтичный "газ" (затемнение + розовый оттенок)
    canvasCtx.fillStyle = 'rgba(20, 0, 20, 0.6)';
    canvasCtx.fillRect(0, 0, vw, vh);
    canvasCtx.restore();

    // Генерируем сердечки
    if (Math.random() < 0.03 && hearts.length < 10) {
        hearts.push({
            x: Math.random() * vw,
            y: -50,
            s: Math.random() * 3 + 2,
            char: ['💖', '🌸', '✨', '💎'][Math.floor(Math.random()*4)]
        });
    }

    // Обработка рук
    let pointerX = -100;
    let pointerY = -100;

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        // Берем указательный палец первой руки (точка 8)
        const indexFinger = results.multiHandLandmarks[0][8];
        
        // Переводим координаты нейросети в координаты экрана (с учетом зеркальности)
        pointerX = (1 - indexFinger.x) * vw;
        pointerY = indexFinger.y * vh;

        // Рисуем светящуюся ауру вокруг её пальца
        canvasCtx.beginPath();
        let grad = canvasCtx.createRadialGradient(pointerX, pointerY, 0, pointerX, pointerY, 50);
        grad.addColorStop(0, 'rgba(255, 105, 180, 0.8)');
        grad.addColorStop(1, 'rgba(255, 105, 180, 0)');
        canvasCtx.fillStyle = grad;
        canvasCtx.arc(pointerX, pointerY, 50, 0, Math.PI * 2);
        canvasCtx.fill();
        
        // Рисуем искорку на самом пальце
        canvasCtx.font = "30px Arial";
        canvasCtx.fillText("✨", pointerX - 15, pointerY + 10);
    }

    // Двигаем и рисуем сердечки
    canvasCtx.font = "40px Arial";
    for (let i = hearts.length - 1; i >= 0; i--) {
        let h = hearts[i];
        
        // Отрисовка
        canvasCtx.fillText(h.char, h.x, h.y);
        h.y += h.s; // Падение

        // Проверка: поймала ли она сердечко рукой?
        let d = Math.hypot(h.x - pointerX, h.y - pointerY);
        if (d < 60) {
            hearts.splice(i, 1);
            score++;
            document.getElementById('score').innerText = `Собрано любви: ${score} / ${winScore}`;
            
            if (score % 4 === 0) fetchCompliment();
            
            if (score === winScore) {
                sendVictory();
                document.getElementById('ui').innerHTML = "<h1 style='font-size: 50px; text-shadow: 0 0 20px #ff69b4;'>Ты моё чудо! ❤️</h1><p>Я уже бегу к тебе!</p>";
                score++; // Чтобы не спамить победу
            }
        }

        // Удаляем те, что упали вниз
        if (h.y > vh + 50) hearts.splice(i, 1);
    }
}

// При изменении размера окна
window.addEventListener('resize', () => {
    vw = canvasElement.width = window.innerWidth;
    vh = canvasElement.height = window.innerHeight;
});