(() => {
  const revealEls = document.querySelectorAll(".reveal");

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
    if (status) status.textContent = "Thanks - we received your message and will reply within 24 hours.";
  });
})();
