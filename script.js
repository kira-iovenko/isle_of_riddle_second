function showWidget(id) {
  document.querySelectorAll('.widget').forEach(w => w.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

function closeWidget() {
  document.querySelectorAll('.widget').forEach(w => w.classList.add('hidden'));
}

/* ------------------------------
   Rune puzzle logic (unchanged)
------------------------------ */
const correctOrder = [5, 10, 15, 20];
let playerOrder = [];
let wrongAttempts = 0;

const hintsList = [
  "Hint 1: The smallest rune must be touched first.",
  "Hint 2: The first inscription has all the same runes.",
  "Hint 3: The second inscription shows a mix — two of the same rune, one smaller, one larger.",
  "Hint 4: The last inscription reveals the path starts with the mightiest rune."
];

function setHint(text) {
  document.getElementById('rune-hint').textContent = text;
}

document.querySelectorAll('.rune').forEach(rune => {
  rune.addEventListener('click', () => {
    const val = parseInt(rune.dataset.value);
    const feedback = document.getElementById('rune-feedback');

    if (rune.classList.contains('active')) return;

    rune.classList.add('active');
    playerOrder.push(val);

    if (playerOrder.length === 4) {
      if (JSON.stringify(playerOrder) === JSON.stringify(correctOrder)) {
        feedback.textContent = "✨ The seal ignites — teleport activated!";
        feedback.style.color = "#ffd369";
        setTimeout(() => {
          showWidget('teleport');
        }, 1000);
      } else {
        wrongAttempts++;
        feedback.textContent = "The runes flicker angrily... reset!";
        feedback.style.color = "#ff6961";

        playerOrder = [];
        document.querySelectorAll('.rune').forEach(r => r.classList.remove('active'));

        setTimeout(() => {
          if (wrongAttempts === 1) setHint(hintsList[1]);
          if (wrongAttempts === 3) setHint(hintsList[2]);
          if (wrongAttempts === 6) setHint(hintsList[3]);
        }, 1500);
      }
    } else {
      feedback.textContent = "The rune glows...";
      feedback.style.color = "#ffd369";
    }
  });
});

setHint(hintsList[0]);

/* ------------------------------
   Overlay hit-testing
------------------------------ */
const overlays = document.querySelectorAll(".overlay");
const canvases = {};

overlays.forEach(img => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const helper = new Image();
  helper.src = img.src;

  helper.onload = () => {
    canvas.width = helper.width;
    canvas.height = helper.height;
    ctx.drawImage(helper, 0, 0);
    canvases[img.src] = { canvas, ctx, img };
  };
});

function isPixelVisible(img, x, y) {
  const data = canvases[img.src];
  if (!data) return false;

  const rect = img.getBoundingClientRect();
  const scaleX = data.canvas.width / rect.width;
  const scaleY = data.canvas.height / rect.height;

  const px = Math.floor((x - rect.left) * scaleX);
  const py = Math.floor((y - rect.top) * scaleY);

  if (px < 0 || py < 0 || px >= data.canvas.width || py >= data.canvas.height) return false;

  const alpha = data.ctx.getImageData(px, py, 1, 1).data[3];
  return alpha > 0;
}

document.addEventListener("mousemove", e => {
  overlays.forEach(img => img.classList.remove("glow"));
  document.body.style.cursor = "default";

  [...overlays].reverse().some(img => {
    if (isPixelVisible(img, e.clientX, e.clientY)) {
      img.classList.add("glow");
      document.body.style.cursor = "pointer";
      return true; // stop at first visible overlay
    }
    return false;
  });
});

document.addEventListener("click", e => {
  [...overlays].reverse().some(img => {
    if (isPixelVisible(img, e.clientX, e.clientY)) {
      const action = img.dataset.action;
      if (action) showWidget(action);
      return true;
    }
    return false;
  });
});
