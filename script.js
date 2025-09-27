let sealUnlocked = false;

function showWidget(id) {
  document.querySelectorAll('.widget').forEach(w => w.classList.add('hidden'));
  const target = document.getElementById(id);
  target.classList.remove('hidden');

  // hide intro button if intro is active
  if (id === 'intro') {
    document.getElementById('intro-btn').style.display = 'none';
  }

  // unlock seal once tomb has been opened at least once
  if (id === 'tomb' && !sealUnlocked) {
    sealUnlocked = true;
    const sealImg = document.querySelector('.overlay[data-action="seal"]');
    if (sealImg) {
      sealImg.classList.remove("hidden");   // reveal seal
      sealImg.style.pointerEvents = 'auto'; // enable interaction
    }
  }
}

function closeWidget() {
  document.querySelectorAll('.widget').forEach(w => w.classList.add('hidden'));

  // show intro button once intro is closed
  const introBtn = document.getElementById('intro-btn');
  introBtn.style.display = 'block';
}

/* ------------------------------
   Rune puzzle logic
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
  overlays.forEach(img => {
    img.classList.remove("glow");

    // keep seal hidden unless unlocked and explicitly revealed
    if (img.dataset.action === "seal" && sealUnlocked) {
      img.style.opacity = 0;
    }
  });

  document.body.style.cursor = "default";

  [...overlays].reverse().some(img => {
    if (isPixelVisible(img, e.clientX, e.clientY)) {
      if (img.dataset.action === "seal" && sealUnlocked) {
        img.style.opacity = 1; // reveal only if unlocked
      }
      img.classList.add("glow");
      document.body.style.cursor = "pointer";
      return true; // stop at first visible overlay
    }
    return false;
  });
});

document.addEventListener("click", e => {
  // If click happened inside a widget → ignore
  if (e.target.closest(".widget")) return;

  // If click happened on a puzzle tile → ignore
  if (e.target.closest(".tile")) return;

  // If click happened on a floating button (like Intro 📜) → ignore
  if (e.target.closest("button")) return;

  // Try overlay hit-testing
  let handled = [...overlays].reverse().some(img => {
    if (isPixelVisible(img, e.clientX, e.clientY)) {
      const action = img.dataset.action;
      if (action) showWidget(action);
      return true;
    }
    return false;
  });

  // If not handled by overlays → close any open widget
  if (!handled) {
    closeWidget();
  }
});

/* ------------------------------
   Seal Puzzle (15-puzzle)
------------------------------ */
const size = 4; // 4x4 grid
const puzzleBoard = document.getElementById("puzzle");
let tiles = [];
let isShuffling = false;
let puzzleSolved = false;

// Create tiles
function init() {
  tiles = [];
  puzzleBoard.innerHTML = "";
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const index = row * size + col;
      const tile = document.createElement("div");
      tile.classList.add("tile");
      tile.dataset.index = index;

      if (index === size * size - 1) {
        tile.classList.add("empty");
      } else {
        tile.style.backgroundPosition =
          `${(col * 100) / (size - 1)}% ${(row * 100) / (size - 1)}%`;
      }

      puzzleBoard.appendChild(tile);
      tiles.push(tile);
    }
  }
}

// Shuffle tiles by making random valid moves
function shuffle(maxAttempts = 1000) {
  isShuffling = true;

  let attempts = 0;

  // Helper: check if ALL non-empty tiles are wrong
  function allWrong() {
    for (let i = 0; i < tiles.length; i++) {
      const tile = tiles[i];
      if (tile.classList.contains("empty")) continue;
      if (parseInt(tile.dataset.index) === i) {
        return false; // found a correct tile
      }
    }
    return true;
  }

  while (attempts++ < maxAttempts && !allWrong()) {
    // Perform random valid move
    const emptyTile = tiles.find(t => t.classList.contains("empty"));
    const emptyIndex = Array.from(puzzleBoard.children).indexOf(emptyTile);
    const emptyRow = Math.floor(emptyIndex / size);
    const emptyCol = emptyIndex % size;

    // Collect adjacent tiles
    const neighbors = tiles.filter((tile, idx) => {
      const row = Math.floor(idx / size);
      const col = idx % size;
      return (
        (row === emptyRow && Math.abs(col - emptyCol) === 1) ||
        (col === emptyCol && Math.abs(row - emptyRow) === 1)
      );
    });

    // Pick a random neighbor and move it
    const randomTile = neighbors[Math.floor(Math.random() * neighbors.length)];
    moveTile(randomTile);
  }

  isShuffling = false;
}

// Swap tile with empty if adjacent
function moveTile(tile) {
  if (puzzleSolved) return;
  const emptyTile = tiles.find(t => t.classList.contains("empty"));
  const emptyIndex = Array.from(puzzleBoard.children).indexOf(emptyTile);
  const tileIndex = Array.from(puzzleBoard.children).indexOf(tile);

  const emptyRow = Math.floor(emptyIndex / size);
  const emptyCol = emptyIndex % size;
  const tileRow = Math.floor(tileIndex / size);
  const tileCol = tileIndex % size;

  const isAdjacent =
    (tileRow === emptyRow && Math.abs(tileCol - emptyCol) === 1) ||
    (tileCol === emptyCol && Math.abs(tileRow - emptyRow) === 1);

  if (isAdjacent) {
    // Swap them in the DOM
    const emptyClone = emptyTile.cloneNode(true);
    const tileClone = tile.cloneNode(true);

    puzzleBoard.replaceChild(tileClone, emptyTile);
    puzzleBoard.replaceChild(emptyClone, tile);

    // Re-hook event listener on the cloned tile
    tileClone.addEventListener("click", () => moveTile(tileClone));

    // Update tiles array
    tiles = Array.from(puzzleBoard.children);

    // Update correct tile highlighting
    updateCorrectTiles();

    // Check win after every move
    if (!isShuffling && checkSolved()) {
      const status = document.getElementById("puzzle-status");
      const activateBtn = document.getElementById("activate-seal-btn");
      const backBtn = document.getElementById("seal-back-btn");
      const overlay = document.getElementById("puzzle-overlay");

      status.textContent = "✨ The seal is ready to be activated!";
      status.style.color = "#ffd369";

      // Hide Step Back, show Activate Seal
      backBtn.classList.add("hidden");
      activateBtn.classList.remove("hidden");

      // Show solved seal overlay
      overlay.classList.remove("hidden");
    }
  }
}

// Highlight correct tiles
function updateCorrectTiles() {
  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i];
    if (tile.classList.contains("empty")) {
      tile.classList.remove("wrong");
      continue;
    }
    if (parseInt(tile.dataset.index) === i) {
      tile.classList.remove("wrong");
    } else {
      tile.classList.add("wrong");
    }
  }
}

// Check if puzzle is solved
function checkSolved() {
  for (let i = 0; i < tiles.length; i++) {
    if (parseInt(tiles[i].dataset.index) !== i) {
      return false;
    }
  }
  puzzleSolved = true;
  return true;
}

// Add click events
puzzleBoard.addEventListener("click", e => {
  if (puzzleSolved) return;
  if (e.target.classList.contains("tile") &&
      !e.target.classList.contains("empty")) {
    moveTile(e.target);
  }
});

// Seal activation logic
document.getElementById("activate-seal-btn").addEventListener("click", () => {
  const overlay = document.getElementById("puzzle-overlay");
  const puzzleGrid = document.getElementById("puzzle");

  if (overlay && puzzleGrid) {
    // Trigger both glow and fade-out at the same time
    overlay.classList.add("glow");
    puzzleGrid.classList.add("fade-out");

    // After animations → close widget + remove seal from tomb + show follow-up widget
    setTimeout(() => {
      closeWidget();

      // Permanently remove seal overlay
      const sealOverlay = document.querySelector('.overlay[data-action="seal"]');
      if (sealOverlay) {
        sealOverlay.remove();
      }

      // Permanently remove tomb closed overlay
      const tombClosed = document.querySelector('.overlay[data-action="tomb"]');
      if (tombClosed) {
        tombClosed.remove();
      }

      // Reveal tomb open overlay
      const tombOpen = document.querySelector('.overlay[data-action="tomb-open"]');
      if (tombOpen) {
        tombOpen.classList.remove("hidden");
      }

      // Reset puzzle tiles (in case widget is ever reopened)
      puzzleGrid.classList.remove("fade-out");

      // Show follow-up widget
      showWidget("seal-followup");
    }, 1500);
  }
});

// Initialize and shuffle on load
init();
shuffle(1);


/* ------------------------------
   Underground Cave
------------------------------ */

// Enter tomb → fade widget, scroll, then show cave
document.getElementById("enter-tomb-btn").addEventListener("click", () => {
  // Fade out widget
  closeWidget();

  // Reveal cave section
  const caveSection = document.getElementById("cave-scene");
  caveSection.classList.remove("hidden");

  // Smooth scroll to cave
  caveSection.scrollIntoView({ behavior: "smooth" });

  // After scroll, open cave follow-up widget
  showWidget("cave-followup");
});

// Scroll back to beach scene from cave entrance
document.getElementById("climb-up-btn").addEventListener("click", () => {
  closeWidget();
  const beachScene = document.getElementById("beach-scene");
  if (beachScene) {
    beachScene.scrollIntoView({ behavior: "smooth" });
  }
});

