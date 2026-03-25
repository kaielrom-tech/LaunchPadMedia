(async function () {
  await (window.__lpmRemoteReady || Promise.resolve());

  const LOCAL_ADMIN_PASSWORD = "launchpad2026";
  const REVIEWS_KEY = "lpm_reviews";
  const MESSAGES_KEY = "lpm_messages";
  const SESSION_LOCAL = "lpm_admin";
  const SESSION_REMOTE_PW = "lpm_admin_secret";

  const loginWrap = document.getElementById("login");
  const panel = document.getElementById("panel");
  const loginMsg = document.getElementById("login-msg");
  const loginLead = document.querySelector(".admin-login-lead");
  const panelLead = document.querySelector(".admin-panel-lead");

  const remote = typeof window.LPM_USE_REMOTE === "function" && window.LPM_USE_REMOTE();

  if (loginLead) {
    loginLead.innerHTML = remote
      ? "Moderate reviews and contact messages. Data is stored in <strong>Supabase</strong> — visible here from any device once your host env vars are set."
      : 'Moderate reviews and read contact submissions. Data lives in this browser’s <code>localStorage</code> (same site origin as the public pages).';
  }
  if (panelLead) {
    panelLead.innerHTML = remote
      ? "<strong>Cloud mode:</strong> reviews and messages sync for everyone. Admin password is checked on the server (<code>LPM_ADMIN_PASSWORD</code> env var), not in this file."
      : "<strong>Reviews</strong> use <code>lpm_reviews</code>. <strong>Contact</strong> uses <code>lpm_messages</code>. Submissions only appear here in this browser.";
  }

  function escapeHtml(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function getReviews() {
    try {
      return JSON.parse(localStorage.getItem(REVIEWS_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveReviews(v) {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(v));
  }

  function getMessages() {
    try {
      return JSON.parse(localStorage.getItem(MESSAGES_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveMessages(v) {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(v));
  }

  function isPendingReview(r) {
    return r.status !== "approved" && r.status !== "rejected";
  }

  function normMessage(row) {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      service: row.service || "",
      msg: row.msg,
      submitted: row.submitted,
      read: row.read,
      replied: row.replied,
      replyDraft: row.reply_draft || ""
    };
  }

  function normReview(row) {
    return {
      id: row.id,
      name: row.name,
      stars: row.stars,
      body: row.body,
      status: row.status,
      submitted: row.submitted
    };
  }

  async function adminApi(op, data) {
    const url = (window.LPM_CONFIG && window.LPM_CONFIG.adminFunctionUrl) || "/api/lpm-admin";
    const password = sessionStorage.getItem(SESSION_REMOTE_PW);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, op, data })
    });
    let body;
    try {
      body = await res.json();
    } catch {
      body = {};
    }
    if (!res.ok) throw new Error(body.error || res.statusText || "Request failed");
    return body;
  }

  const MAILTO_BODY_MAX = 1700;

  function trimForMailto(text) {
    const s = String(text ?? "");
    if (s.length <= MAILTO_BODY_MAX) return s;
    return s.slice(0, MAILTO_BODY_MAX) + "\n\n[Truncated — full text is in Admin.]";
  }

  function gmailComposeUrl(to, subject, body) {
    const u = new URL("https://mail.google.com/mail/");
    u.searchParams.set("view", "cm");
    u.searchParams.set("fs", "1");
    u.searchParams.set("to", to);
    u.searchParams.set("su", subject);
    u.searchParams.set("body", body);
    return u.toString();
  }

  function sameId(a, b) {
    return String(a) === String(b);
  }

  async function render() {
    const pendingEl = document.getElementById("pending-reviews");
    const publishedEl = document.getElementById("published-reviews");
    const rejectedEl = document.getElementById("rejected-reviews");
    const msgEl = document.getElementById("inbox-messages");
    const gmailHint = String((window.LPM_CONFIG && window.LPM_CONFIG.adminGmailAccountHint) || "").trim();

    let all = [];
    let messages = [];

    if (remote) {
      try {
        const data = await adminApi("bootstrap");
        all = (data.reviews || []).map(normReview);
        messages = (data.messages || [])
          .map(normMessage)
          .sort((a, b) => new Date(b.submitted) - new Date(a.submitted));
      } catch (e) {
        pendingEl.innerHTML =
          `<p class="admin-empty">Could not load data: ${escapeHtml(e.message)}. Check Pages Function logs and env vars (<code>/api/lpm-admin</code>).</p>`;
        publishedEl.innerHTML = "";
        rejectedEl.innerHTML = "";
        msgEl.innerHTML = "";
        return;
      }
    } else {
      all = getReviews();
      messages = getMessages().sort((a, b) => new Date(b.submitted) - new Date(a.submitted));
    }

    const pending = all.filter(isPendingReview);
    const published = all
      .filter((r) => r.status === "approved")
      .sort((a, b) => new Date(b.submitted || 0) - new Date(a.submitted || 0));
    const rejected = all.filter((r) => r.status === "rejected");

    pendingEl.innerHTML = pending.length
      ? pending
          .map(
            (r) => `
        <article class="admin-item">
          <p class="admin-item-head"><strong>${escapeHtml(r.name || "Anonymous")}</strong> <span class="admin-muted">(${escapeHtml(String(r.stars || 0))}/5)</span></p>
          <p class="admin-item-body">${escapeHtml(r.body || "")}</p>
          <p class="admin-item-meta">${r.submitted ? escapeHtml(new Date(r.submitted).toLocaleString()) : ""}</p>
          <div class="admin-actions">
            <button type="button" class="btn primary" data-act="approve-review" data-id="${escapeHtml(String(r.id))}">Approve</button>
            <button type="button" class="btn ghost" data-act="deny-review" data-id="${escapeHtml(String(r.id))}">Deny</button>
            <button type="button" class="btn ghost" data-act="delete-review" data-id="${escapeHtml(String(r.id))}">Delete</button>
          </div>
        </article>`
          )
          .join("")
      : '<p class="admin-empty">No pending reviews.</p>';

    publishedEl.innerHTML = published.length
      ? published
          .map(
            (r) => `
        <article class="admin-item">
          <p class="admin-item-head"><strong>${escapeHtml(r.name || "Anonymous")}</strong> <span class="admin-muted">(${escapeHtml(String(r.stars || 0))}/5)</span></p>
          <p class="admin-item-body">${escapeHtml(r.body || "")}</p>
          <p class="admin-item-meta">${r.submitted ? escapeHtml(new Date(r.submitted).toLocaleString()) : ""}</p>
          <div class="admin-actions">
            <button type="button" class="btn ghost" data-act="delete-review" data-id="${escapeHtml(String(r.id))}">Remove from site</button>
          </div>
        </article>`
          )
          .join("")
      : '<p class="admin-empty">No published reviews yet.</p>';

    rejectedEl.innerHTML = rejected.length
      ? rejected
          .map(
            (r) => `
        <article class="admin-item admin-item-muted">
          <p class="admin-item-head"><strong>${escapeHtml(r.name || "Anonymous")}</strong></p>
          <p class="admin-item-body">${escapeHtml(r.body || "")}</p>
          <div class="admin-actions">
            <button type="button" class="btn ghost" data-act="delete-review" data-id="${escapeHtml(String(r.id))}">Delete permanently</button>
          </div>
        </article>`
          )
          .join("")
      : '<p class="admin-empty">No denied reviews.</p>';

    msgEl.innerHTML = messages.length
      ? messages
          .map((m) => {
            const hasEmail = Boolean(m.email && String(m.email).includes("@"));
            const repliedBadge = m.replied ? '<span class="admin-replied-badge">Replied</span>' : "";
            const rid = String(m.id).replace(/"/g, "");
            return `
        <article class="admin-item${m.replied ? " admin-item-replied" : ""}">
          <p class="admin-item-head"><strong>${escapeHtml(m.name || "Unknown")}</strong> <span class="admin-muted">&lt;${escapeHtml(m.email || "")}&gt;</span> ${repliedBadge}</p>
          ${m.service ? `<p class="admin-tag">Interest: ${escapeHtml(m.service)}</p>` : ""}
          <p class="admin-item-body">${escapeHtml(m.msg || "")}</p>
          <p class="admin-item-meta">${m.submitted ? escapeHtml(new Date(m.submitted).toLocaleString()) : ""}</p>
          <label class="admin-reply-label" for="reply-draft-${rid}">Your reply</label>
          <textarea class="admin-reply-draft" id="reply-draft-${rid}" rows="4" placeholder="Write your reply here. It will be placed in a new email to this address.">${escapeHtml(m.replyDraft || "")}</textarea>
          ${
            hasEmail && gmailHint
              ? `<p class="admin-inline-note">Compose in Gmail opens in <em>this</em> browser. Use the Gmail tab where you’re signed in as <strong>${escapeHtml(gmailHint)}</strong> (or switch accounts in Gmail).</p>`
              : hasEmail
                ? '<p class="admin-inline-note">Use <strong>Compose in Gmail</strong> to stay in this browser. <strong>Mail app</strong> uses Windows’ default handler (often Edge).</p>'
                : ""
          }
          <div class="admin-actions">
            <button type="button" class="btn primary" data-act="reply-gmail" data-id="${escapeHtml(rid)}"${hasEmail ? "" : " disabled"}>Compose in Gmail</button>
            <button type="button" class="btn ghost" data-act="reply-mailto" data-id="${escapeHtml(rid)}"${hasEmail ? "" : " disabled"}>Mail app</button>
            <button type="button" class="btn ghost" data-act="toggle-replied" data-id="${escapeHtml(rid)}">${m.replied ? "Mark unread" : "Mark replied"}</button>
            <button type="button" class="btn ghost" data-act="delete-message" data-id="${escapeHtml(rid)}">Delete</button>
          </div>
          ${!hasEmail ? '<p class="admin-inline-note">No email on file — cannot open mail client.</p>' : ""}
        </article>`;
          })
          .join("")
      : '<p class="admin-empty">No messages yet. Send a test from <a class="text-link" href="contact.html">Contact</a>.</p>';
  }

  panel.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-act]");
    if (!btn || !panel.contains(btn)) return;
    const act = btn.getAttribute("data-act");
    const idRaw = btn.getAttribute("data-id");
    if (!act || idRaw == null || idRaw === "") return;

    try {
      if (act === "approve-review") {
        if (remote) await adminApi("reviews:update", { id: idRaw, patch: { status: "approved" } });
        else saveReviews(getReviews().map((r) => (sameId(r.id, idRaw) ? { ...r, status: "approved" } : r)));
      } else if (act === "deny-review") {
        if (remote) await adminApi("reviews:update", { id: idRaw, patch: { status: "rejected" } });
        else saveReviews(getReviews().map((r) => (sameId(r.id, idRaw) ? { ...r, status: "rejected" } : r)));
      } else if (act === "delete-review") {
        if (remote) await adminApi("reviews:delete", { id: idRaw });
        else saveReviews(getReviews().filter((r) => !sameId(r.id, idRaw)));
      } else if (act === "delete-message") {
        if (remote) await adminApi("messages:delete", { id: idRaw });
        else saveMessages(getMessages().filter((m) => !sameId(m.id, idRaw)));
      } else if (act === "reply-gmail" || act === "reply-mailto") {
        let m;
        if (remote) {
          const data = await adminApi("bootstrap");
          m = (data.messages || []).map(normMessage).find((x) => sameId(x.id, idRaw));
        } else {
          m = getMessages().find((x) => sameId(x.id, idRaw));
        }
        if (!m || !m.email || !String(m.email).includes("@")) return;
        const ta = document.getElementById(`reply-draft-${idRaw}`);
        const draft = ta ? ta.value.trim() : "";
        const draftPersist = ta ? ta.value : m.replyDraft || "";
        const quote = `--- Their message (${m.submitted ? new Date(m.submitted).toLocaleString() : ""}) ---\n${m.msg || ""}`;
        const bodyCore = draft ? `${draft}\n\n${quote}` : `Hi ${m.name || "there"},\n\n\n\n${quote}`;
        const body = trimForMailto(bodyCore);
        const subject = `Re: LaunchPad Media — ${m.service || "inquiry"}`;
        const to = m.email.trim();
        if (remote) {
          await adminApi("messages:update", {
            id: idRaw,
            patch: { reply_draft: draftPersist, replied: true }
          });
        } else {
          saveMessages(
            getMessages().map((x) => (sameId(x.id, idRaw) ? { ...x, replyDraft: draftPersist, replied: true } : x))
          );
        }
        if (act === "reply-gmail") {
          const gUrl = gmailComposeUrl(to, subject, body);
          window.open(gUrl, "_blank", "noopener,noreferrer");
        } else {
          const href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
          window.location.href = href;
        }
      } else if (act === "toggle-replied") {
        const ta = document.getElementById(`reply-draft-${idRaw}`);
        const draftVal = ta ? ta.value : undefined;
        if (remote) {
          let m;
          const data = await adminApi("bootstrap");
          m = (data.messages || []).map(normMessage).find((x) => sameId(x.id, idRaw));
          if (m) {
            await adminApi("messages:update", {
              id: idRaw,
              patch: {
                replied: !m.replied,
                ...(draftVal !== undefined ? { reply_draft: draftVal } : {})
              }
            });
          }
        } else {
          saveMessages(
            getMessages().map((m) => {
              if (!sameId(m.id, idRaw)) return m;
              const next = { ...m, replied: !m.replied };
              if (draftVal !== undefined) next.replyDraft = draftVal;
              return next;
            })
          );
        }
      }
    } catch (err) {
      alert(err.message || String(err));
    }
    await render();
  });

  document.getElementById("login-btn").addEventListener("click", async () => {
    const val = document.getElementById("pw").value;
    loginMsg.textContent = "";

    if (remote) {
      try {
        sessionStorage.setItem(SESSION_REMOTE_PW, val);
        await adminApi("ping");
        sessionStorage.setItem(SESSION_LOCAL, "remote");
        loginWrap.hidden = true;
        panel.hidden = false;
        await render();
      } catch {
        sessionStorage.removeItem(SESSION_REMOTE_PW);
        sessionStorage.removeItem(SESSION_LOCAL);
        loginMsg.textContent = "Incorrect password or server error (check LPM_ADMIN_PASSWORD in Cloudflare env).";
      }
      return;
    }

    if (val !== LOCAL_ADMIN_PASSWORD) {
      loginMsg.textContent = "Incorrect password.";
      return;
    }
    sessionStorage.setItem(SESSION_LOCAL, "1");
    loginWrap.hidden = true;
    panel.hidden = false;
    await render();
  });

  async function tryRestoreSession() {
    if (remote && sessionStorage.getItem(SESSION_LOCAL) === "remote" && sessionStorage.getItem(SESSION_REMOTE_PW)) {
      try {
        await adminApi("ping");
        loginWrap.hidden = true;
        panel.hidden = false;
        await render();
        return;
      } catch {
        sessionStorage.removeItem(SESSION_REMOTE_PW);
        sessionStorage.removeItem(SESSION_LOCAL);
      }
    }
    if (!remote && sessionStorage.getItem(SESSION_LOCAL) === "1") {
      loginWrap.hidden = true;
      panel.hidden = false;
      await render();
    }
  }

  tryRestoreSession();
})();
