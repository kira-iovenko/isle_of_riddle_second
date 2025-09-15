function showWidget(id) {
  document.querySelectorAll('.widget').forEach(w => w.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

const correctOrder = [5, 10, 15, 20]; // correct order
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

    // prevent double-clicking the same rune
    if (rune.classList.contains('active')) return;

    rune.classList.add('active');
    playerOrder.push(val);

    if (playerOrder.length === 4) {
      if (JSON.stringify(playerOrder) === JSON.stringify(correctOrder)) {
        feedback.textContent = "✨ The seal ignites — teleport activated!";
        feedback.style.color = "#ffd369";
        // show a hint after delay
        setTimeout(() => {
          showWidget('teleport');
        }, 1000);
      } else {
        wrongAttempts++;
        feedback.textContent = "The runes flicker angrily... reset!";
        feedback.style.color = "#ff6961";

        // reset
        playerOrder = [];
        document.querySelectorAll('.rune').forEach(r => r.classList.remove('active'));

        // show a hint after delay
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

// show the very first hint at start
setHint(hintsList[0]);