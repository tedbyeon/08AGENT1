(function () {
  const slides = Array.from(document.querySelectorAll(".slide"));
  const total = slides.length;
  const progressFill = document.getElementById("progressFill");
  const dotsContainer = document.getElementById("dots");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const currentNum = document.getElementById("currentNum");
  const totalNum = document.getElementById("totalNum");

  let current = 0;
  let animating = false;

  totalNum.textContent = total;

  // build dots
  slides.forEach((_, i) => {
    const dot = document.createElement("div");
    dot.className = "dot" + (i === 0 ? " active" : "");
    dot.addEventListener("click", () => goTo(i));
    dotsContainer.appendChild(dot);
  });
  const dots = Array.from(dotsContainer.children);

  function staggerReveals(slide) {
    const reveals = slide.querySelectorAll(".reveal");
    reveals.forEach((el, i) => {
      el.style.transitionDelay = (i * 0.09) + "s";
    });
  }

  function render() {
    slides.forEach((slide, i) => {
      slide.classList.remove("active", "prev");
      if (i === current) {
        slide.classList.add("active");
        staggerReveals(slide);
      } else if (i < current) {
        slide.classList.add("prev");
      }
    });

    dots.forEach((d, i) => d.classList.toggle("active", i === current));
    progressFill.style.width = ((current + 1) / total * 100) + "%";
    currentNum.textContent = current + 1;

    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === total - 1;
  }

  function goTo(index) {
    if (animating || index < 0 || index >= total || index === current) return;
    animating = true;
    current = index;
    render();
    setTimeout(() => { animating = false; }, 650);
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  prevBtn.addEventListener("click", prev);
  nextBtn.addEventListener("click", next);

  window.addEventListener("keydown", (e) => {
    if (["ArrowRight", "ArrowDown", " ", "PageDown"].includes(e.key)) {
      e.preventDefault();
      next();
    } else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) {
      e.preventDefault();
      prev();
    }
  });

  // wheel navigation (throttled)
  let wheelLock = false;
  window.addEventListener("wheel", (e) => {
    if (wheelLock) return;
    if (Math.abs(e.deltaY) < 30) return;
    wheelLock = true;
    if (e.deltaY > 0) next(); else prev();
    setTimeout(() => { wheelLock = false; }, 700);
  }, { passive: true });

  // touch swipe navigation
  let touchStartX = 0;
  window.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  window.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) < 50) return;
    if (dx < 0) next(); else prev();
  }, { passive: true });

  render();
})();
