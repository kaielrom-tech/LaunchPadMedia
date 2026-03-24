(() => {
  const revealEls = document.querySelectorAll(".reveal");

  function initSlider(root) {
    if (!root) return;
    const viewport = root.querySelector(".slider-viewport");
    const track = root.querySelector(".slider-track");
    const slides = root.querySelectorAll(".slider-slide");
    const prev = root.querySelector(".slider-prev");
    const next = root.querySelector(".slider-next");
    const dotsRoot = root.querySelector(".slider-dots");
    if (!viewport || !track || !slides.length || !prev || !next) return;
    let index = 0;
    let slideW = 0;
    let resizeTimer;

    function measure() {
      if (!viewport || !track || !slides.length) return;
      slideW = viewport.offsetWidth;
      slides.forEach((s) => {
        s.style.width = `${slideW}px`;
        s.style.flexBasis = `${slideW}px`;
      });
      track.style.width = `${slideW * slides.length}px`;
      go(index, false);
    }

    function go(i, animate) {
      index = (i + slides.length) % slides.length;
      if (!animate) {
        track.style.transition = "none";
      } else {
        track.style.transition = "";
      }
      if (slideW > 0) {
        track.style.transform = `translateX(-${index * slideW}px)`;
      }
      if (!animate) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            track.style.transition = "";
          });
        });
      }
      if (dotsRoot) {
        dotsRoot.querySelectorAll(".slider-dot").forEach((d, di) => {
          d.classList.toggle("active", di === index);
          d.setAttribute("aria-current", di === index ? "true" : "false");
        });
      }
    }

    if (dotsRoot) {
      slides.forEach((_, di) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "slider-dot" + (di === 0 ? " active" : "");
        b.setAttribute("aria-label", `Slide ${di + 1}`);
        b.setAttribute("aria-current", di === 0 ? "true" : "false");
        b.addEventListener("click", () => go(di, true));
        dotsRoot.appendChild(b);
      });
    }

    prev.addEventListener("click", () => go(index - 1, true));
    next.addEventListener("click", () => go(index + 1, true));

    measure();
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(measure, 120);
    });
  }

  initSlider(document.getElementById("services-slider"));

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  const form = document.getElementById("contact-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    const name = document.getElementById("c-name")?.value.trim();
    const email = document.getElementById("c-email")?.value.trim();
    const message = document.getElementById("c-message")?.value.trim();
    const status = document.getElementById("contact-status");

    if (!name || !email || !message) {
      e.preventDefault();
      if (status) status.textContent = "Please fill out all required fields.";
      return;
    }

    if (!email.includes("@")) {
      e.preventDefault();
      if (status) status.textContent = "Please enter a valid email address.";
      return;
    }

    const payload = JSON.parse(localStorage.getItem("lpm_messages") || "[]");
    payload.push({
      id: Date.now(),
      name,
      email,
      service: document.getElementById("c-service")?.value || "",
      msg: message,
      submitted: new Date().toISOString(),
      read: false
    });
    localStorage.setItem("lpm_messages", JSON.stringify(payload));

    e.preventDefault();
    form.reset();
    if (status) status.textContent = "Thanks — we received your message and will reply within one business day.";
  });
})();
