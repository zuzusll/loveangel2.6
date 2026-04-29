const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');

let vw = canvasElement.width = window.innerWidth;
let vh = canvasElement.height = window.innerHeight;
let score = 0;
let hearts = [];

// Автоматически определяет адрес твоего сервера на Render
const SERVER_URL = window.location.origin; 

const hands = new Hands({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.7 });
hands.onResults(onResults);

const camera = new Camera(videoElement, {
    onFrame: async () => { await hands.send({image: videoElement}); },
    width: 1280, height: 720
});
camera.start().then(() => document.getElementById('loading').style.display = 'none');
document.getElementById('ui').style.display = 'block';

function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, vw, vh);
    canvasCtx.translate(vw, 0);
    canvasCtx.scale(-1, 1);
    canvasCtx.drawImage(results.image, 0, 0, vw, vh);
    canvasCtx.fillStyle = 'rgba(10, 0, 20, 0.6)';
    canvasCtx.fillRect(0, 0, vw, vh);
    canvasCtx.restore();

    let pX = -100, pY = -100;
    if (results.multiHandLandmarks && results.multiHandLandmarks[0]) {
        const finger = results.multiHandLandmarks[0][8];
        pX = (1 - finger.x) * vw;
        pY = finger.y * vh;
        
        canvasCtx.beginPath();
        canvasCtx.fillStyle = 'rgba(255, 105, 180, 0.8)';
        canvasCtx.arc(pX, pY, 40, 0, Math.PI*2);
        canvasCtx.fill();
    }

    if (Math.random() < 0.04) hearts.push({x: Math.random()*vw, y: -50, s: Math.random()*3+2});

    canvasCtx.font = "40px Arial";
    hearts.forEach((h, i) => {
        canvasCtx.fillText("💖", h.x, h.y);
        h.y += h.s;
        if (Math.hypot(h.x - pX, h.y - pY) < 60) {
            hearts.splice(i, 1);
            score++;
            document.getElementById('score').innerText = `Любовь: ${score} / 20`;
            if (score % 5 === 0) fetch(`${SERVER_URL}/get_compliment`).then(r => r.json()).then(d => {
                document.getElementById('compliment-box').innerText = d.text;
            });
            if (score === 20) {
                fetch(`${SERVER_URL}/victory`, {method:'POST'});
                alert("Ты поймала всю мою любовь! ❤️");
            }
        }
    });
}