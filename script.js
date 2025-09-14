function showWidget(id) {
  document.querySelectorAll('.widget').forEach(w => w.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

const correctOrder = [5, 10, 15, 20];
let currentStep = 0;

document.querySelectorAll('.rune').forEach(rune => {
  rune.addEventListener('click', () => {
    const val = parseInt(rune.dataset.value);
    const feedback = document.getElementById('rune-feedback');

    if (val === correctOrder[currentStep]) {
      rune.classList.add('active');
      currentStep++;
      feedback.textContent = "The rune glows...";
      feedback.style.color = "#ffd369";

      if (currentStep === correctOrder.length) {
        feedback.textContent = "✨ The seal ignites — teleport activated!";
        // TODO: trigger teleport animation or move to next scene
      }
    } else {
      feedback.textContent = "The runes flicker angrily... reset!";
      feedback.style.color = "#ff6961";
      // reset
      currentStep = 0;
      document.querySelectorAll('.rune').forEach(r => r.classList.remove('active'));
    }
  });
});
