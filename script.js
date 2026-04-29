'use strict';

// --- НАСТРОЙКА ССЫЛКИ ---
// Когда выложишь на Render, замени этот адрес на свою ссылку
const SERVER_URL = 'https://loveangel2-6.onrender.com'; 

const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const loadingScreen = document.getElementById('loading');

let vw = canvasElement.width = window.innerWidth;
let vh = canvasElement.height = window.innerHeight;
let score = 0;
let hearts = [];
let isWon = false;

// Настройка MediaPipe Hands
const hands = new Hands({locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
}});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
});

hands.onResults(onResults);

// Запуск камеры
const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({image: videoElement});
    },
    width: 1280,
    height: 720
});
camera.start().then(() => {
    loadingScreen.style.display = 'none';
    document.getElementById('ui').style.display = 'block';
});

// Запрос комплимента у Python
async function getCompliment() {
    try {
        const res = await fetch(`${SERVER_URL}/get_compliment`);
        const data = await res.json();
        const box = document.getElementById('compliment-box');
        box.style.opacity = 0;
        setTimeout(() => {
            box.innerText = data.text;
            box.style.opacity = 1;
        }, 500);
    } catch (e) { console.log("Python-сервер не отвечает"); }
}

// Уведомление о победе
async function sendVictory() {
    try {
        await fetch(`${SERVER_URL}/victory`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({status: 'won'})
        });
    } catch (e) { console.log("Ошибка отправки победы"); }
}

function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, vw, vh);

    // Рисуем камеру (зеркально)
    canvasCtx.translate(vw, 0);
    canvasCtx.scale(-1, 1);
    canvasCtx.drawImage(results.image, 0, 0, vw, vh);
    
    // Эффект "Газа" (розовый туман поверх видео)
    canvasCtx.fillStyle = 'rgba(25, 0, 40, 0.5)';
    canvasCtx.fillRect(0, 0, vw, vh);
    canvasCtx.restore();

    let pointerX = -100;
    let pointerY = -100;

    // Если рука в кадре
    if (results.multiHandLandmarks && results.multiHandLandmarks[0]) {
        const indexFinger = results.multiHandLandmarks[0][8]; // Кончик указательного пальца
        pointerX = (1 - indexFinger.x) * vw;
        pointerY = indexFinger.y * vh;

        // Рисуем магическое свечение на пальце
        canvasCtx.beginPath();
        let grad = canvasCtx.createRadialGradient(pointerX, pointerY, 0, pointerX, pointerY, 60);
        grad.addColorStop(0, 'rgba(255, 105, 180, 0.9)');
        grad.addColorStop(1, 'rgba(255, 105, 180, 0)');
        canvasCtx.fillStyle = grad;
        canvasCtx.arc(pointerX, pointerY, 60, 0, Math.PI * 2);
        canvasCtx.fill();
        
        canvasCtx.font = "30px Arial";
        canvasCtx.fillText("✨", pointerX - 15, pointerY + 10);
    }

    // Создаем новые сердечки
    if (Math.random() < 0.04 && hearts.length < 15 && !isWon) {
        hearts.push({
            x: Math.random() * vw,
            y: -50,
            speed: Math.random() * 2 + 2,
            char: ['💖', '🌸', '✨', '💎'][Math.floor(Math.random()*4)]
        });
    }

    // Рисуем и ловим сердечки
    canvasCtx.font = "45px Arial";
    for (let i = hearts.length - 1; i >= 0; i--) {
        let h = hearts[i];
        canvasCtx.fillText(h.char, h.x, h.y);
        h.y += h.speed;

        // Коллизия (проверка расстояния между пальцем и сердцем)
        let dist = Math.hypot(h.x - pointerX, h.y - pointerY);
        if (dist < 70) {
            hearts.splice(i, 1);
            score++;
            document.getElementById('score').innerText = `Собрано любви: ${score} / 20`;
            
            if (score % 5 === 0) getCompliment();
            
            if (score === 20 && !isWon) {
                isWon = true;
                sendVictory();
                document.getElementById('ui').innerHTML = "<h1 style='font-size: 60px; text-shadow: 0 0 25px #ff69b4;'>Ты моё чудо! ❤️</h1>";
            }
        }

        if (h.y > vh + 50) hearts.splice(i, 1);
    }
}

window.addEventListener('resize', () => {
    vw = canvasElement.width = window.innerWidth;
    vh = canvasElement.height = window.innerHeight;
});
