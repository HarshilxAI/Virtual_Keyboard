const video = document.getElementById("webcam");
const canvas = document.getElementById("output");
const ctx = canvas.getContext("2d");

const keys = [
  "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P",
  "A", "S", "D", "F", "G", "H", "J", "K", "L",
  "Z", "X", "C", "V", "B", "N", "M",
  "Space", "Back", "Clear"
];

const keyBoxes = [];
const keyHoverStart = {};
let typedText = "";
let activeKey = null;
let blinkKey = null;
let blinkStart = 0;

video.addEventListener("loadedmetadata", () => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
});

// Draw the keyboard
function drawKeyboard() {
  const startX = 30;
  const startY = 240; // ⬆️ Shifted up from 300 to 240
  const keyWidth = 55;
  const keyHeight = 40;
  const spacing = 8;

  keyBoxes.length = 0;

  ctx.font = "14px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let i = 0; i < keys.length; i++) {
    const row = i < 10 ? 0 : i < 19 ? 1 : i < 26 ? 2 : 3;
    const col = i < 10 ? i : i < 19 ? i - 10 : i < 26 ? i - 19 : i - 26;

    const x = startX + col * (keyWidth + spacing);
    const y = startY + row * (keyHeight + spacing);

    keyBoxes.push({ key: keys[i], x, y, width: keyWidth, height: keyHeight });

    let fillStyle = "#333"; // default
    if (activeKey === keys[i]) {
      fillStyle = "#FFD700"; // gold
    }
    if (blinkKey === keys[i]) {
      const blinkElapsed = Date.now() - blinkStart;
      if (blinkElapsed < 200) {
        fillStyle = "#FF4500"; // orange blink
      } else {
        blinkKey = null;
      }
    }

    ctx.fillStyle = fillStyle;
    ctx.fillRect(x, y, keyWidth, keyHeight);
    ctx.strokeStyle = "#4fc3f7";
    ctx.strokeRect(x, y, keyWidth, keyHeight);
    ctx.fillStyle = "#fff";
    ctx.fillText(keys[i], x + keyWidth / 2, y + keyHeight / 2);
  }
}

function checkKeyHover(finger) {
  activeKey = null;

  for (let box of keyBoxes) {
    const { key, x, y, width, height } = box;
    const inside = finger.x >= x && finger.x <= x + width && finger.y >= y && finger.y <= y + height;

    if (inside) {
      activeKey = key;

      if (!keyHoverStart[key]) {
        keyHoverStart[key] = Date.now();
      } else {
        const timeHovered = Date.now() - keyHoverStart[key];
        if (timeHovered > 2000) {
          triggerKeyAction(key);
          keyHoverStart[key] = null;
        }
      }
      return;
    } else {
      keyHoverStart[key] = null;
    }
  }
}

function triggerKeyAction(key) {
  if (key === "Space") {
    typedText += " ";
  } else if (key === "Back") {
    typedText = typedText.slice(0, -1);
  } else if (key === "Clear") {
    typedText = "";
  } else {
    typedText += key;
  }

  blinkKey = key;
  blinkStart = Date.now();

  document.getElementById("typed-text-display").innerText = "Typed: " + typedText;
}

const connections = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [0,9],[9,10],[10,11],[11,12],
  [0,13],[13,14],[14,15],[15,16],
  [0,17],[17,18],[18,19],[19,20]
];

function drawHand(landmarks) {
  ctx.strokeStyle = "#00FF00";
  ctx.lineWidth = 2;
  for (let [start, end] of connections) {
    const sx = (1 - landmarks[start].x) * canvas.width;
    const sy = landmarks[start].y * canvas.height;
    const ex = (1 - landmarks[end].x) * canvas.width;
    const ey = landmarks[end].y * canvas.height;

    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  }

  for (let point of landmarks) {
    const x = (1 - point.x) * canvas.width;
    const y = point.y * canvas.height;

    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = "red";
    ctx.fill();
  }
}

function onResults(results) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.scale(-1, 1);
  ctx.drawImage(results.image, -canvas.width, 0, canvas.width, canvas.height);
  ctx.restore();

  drawKeyboard();

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const landmarks = results.multiHandLandmarks[0];
    drawHand(landmarks);

    const indexTip = landmarks[8];
    const finger = {
      x: (1 - indexTip.x) * canvas.width,
      y: indexTip.y * canvas.height
    };
    checkKeyHover(finger);
  }
}

const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7,
});

hands.onResults(onResults);

const camera = new Camera(video, {
  onFrame: async () => {
    await hands.send({ image: video });
  },
  width: 640,
  height: 480,
});
camera.start();

canvas.addEventListener("click", (event) => {
  const rect = canvas.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const clickY = event.clientY - rect.top;

  for (let box of keyBoxes) {
    if (
      clickX >= box.x &&
      clickX <= box.x + box.width &&
      clickY >= box.y &&
      clickY <= box.y + box.height
    ) {
      triggerKeyAction(box.key);
      break;
    }
  }
});

// News button click
document.getElementById("news-btn").addEventListener("click", () => {
  document.getElementById("chrome-note").style.display = "block";
  document.getElementById("news-btn").disabled = true;
});
