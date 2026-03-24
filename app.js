(() => {
  const revealEls = document.querySelectorAll(".reveal");
  const REVIEWS_KEY = "lpm_reviews";

  function getReviews() {
    try {
      return JSON.parse(localStorage.getItem(REVIEWS_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveReviews(items) {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(items));
  }

  function renderApprovedReviews() {
    const list = document.getElementById("reviews-list");
    if (!list) return;
    list.innerHTML = "";
    const approved = getReviews()
      .filter((r) => r.status === "approved")
      .sort((a, b) => new Date(b.submitted || 0) - new Date(a.submitted || 0));
    if (!approved.length) {
      const p = document.createElement("p");
      p.className = "reviews-empty";
      p.textContent = "No published reviews yet.";
      list.appendChild(p);
      return;
    }
    approved.forEach((r) => {
      const art = document.createElement("article");
      art.className = "review-card";
      const n = Number(r.stars) || 0;
      const starsEl = document.createElement("div");
      starsEl.className = "review-stars";
      starsEl.setAttribute("aria-label", `${n} out of 5 stars`);
      starsEl.textContent = "★".repeat(Math.min(5, Math.max(0, n))) + "☆".repeat(5 - Math.min(5, Math.max(0, n)));
      const body = document.createElement("p");
      body.className = "review-body";
      body.textContent = r.body || "";
      const foot = document.createElement("footer");
      foot.className = "review-meta";
      const who = document.createElement("strong");
      who.textContent = r.name || "Client";
      foot.appendChild(who);
      if (r.submitted) {
        const d = document.createElement("span");
        d.className = "review-date";
        d.textContent = ` · ${new Date(r.submitted).toLocaleDateString()}`;
        foot.appendChild(d);
      }
      art.appendChild(starsEl);
      art.appendChild(body);
      art.appendChild(foot);
      list.appendChild(art);
    });
  }

  function initReviewForm() {
    const form = document.getElementById("review-form");
    if (!form) return;
    const status = document.getElementById("review-status");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("r-name")?.value.trim();
      const stars = document.getElementById("r-stars")?.value;
      const body = document.getElementById("r-body")?.value.trim();
      if (!name || !stars || !body) {
        if (status) status.textContent = "Please fill out every field.";
        return;
      }
      if (body.length < 15) {
        if (status) status.textContent = "Please write at least a short review (15+ characters).";
        return;
      }
      const all = getReviews();
      all.push({
        id: Date.now(),
        name,
        stars: Number(stars),
        body,
        status: "pending",
        submitted: new Date().toISOString()
      });
      saveReviews(all);
      form.reset();
      if (status) {
        status.textContent = "Thanks — your review was submitted for moderation and will appear after approval.";
      }
    });
  }

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

  function initBundleScroll() {
    const root = document.getElementById("bundle-carousel");
    if (!root) return;
    const viewport = root.querySelector(".bundle-scroll-viewport");
    const prev = root.querySelector(".bundle-scroll-btn.prev");
    const next = root.querySelector(".bundle-scroll-btn.next");
    if (!viewport || !prev || !next) return;

    const step = () => Math.max(240, Math.round(viewport.clientWidth * 0.85));

    function updateButtons() {
      const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth - 1);
      const left = viewport.scrollLeft;
      prev.disabled = left <= 1;
      next.disabled = left >= maxScroll - 1;
    }

    prev.addEventListener("click", () => {
      viewport.scrollBy({ left: -step(), behavior: "smooth" });
    });
    next.addEventListener("click", () => {
      viewport.scrollBy({ left: step(), behavior: "smooth" });
    });
    viewport.addEventListener("scroll", () => requestAnimationFrame(updateButtons), { passive: true });
    window.addEventListener("resize", updateButtons);
    if ("ResizeObserver" in window) {
      new ResizeObserver(updateButtons).observe(viewport);
    }
    updateButtons();
  }

  initBundleScroll();

  function initMobileNav() {
    const nav = document.querySelector(".site-header .nav");
    const toggle = document.querySelector(".nav-toggle");
    const links = document.getElementById("site-nav");
    if (!nav || !toggle || !links) return;

    function setOpen(open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      document.body.classList.toggle("nav-open", open);
    }

    toggle.addEventListener("click", () => {
      setOpen(!nav.classList.contains("is-open"));
    });

    links.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => setOpen(false));
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (window.matchMedia("(min-width: 961px)").matches) setOpen(false);
      }, 120);
    });
  }

  initMobileNav();

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

  renderApprovedReviews();
  initReviewForm();

  window.addEventListener("storage", (e) => {
    if (e.key === REVIEWS_KEY && document.getElementById("reviews-list")) {
      renderApprovedReviews();
    }
  });

  const contactForm = document.getElementById("contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
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
        read: false,
        replied: false,
        replyDraft: ""
      });
      localStorage.setItem("lpm_messages", JSON.stringify(payload));

      e.preventDefault();
      contactForm.reset();
      if (status) {
        status.textContent = "Thanks — we received your message and will reply within one business day.";
      }
    });
  }
})();
