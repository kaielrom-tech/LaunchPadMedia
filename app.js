// app.js - scroll reveal (fade + slide from left/right)
(() => {
  const els = document.querySelectorAll(".reveal, .reveal-left, .reveal-right");

  if (!("IntersectionObserver" in window)) {
    els.forEach(el => el.classList.add("is-visible"));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  els.forEach(el => io.observe(el));
})();
