async function api(path, opts = {}) {
  const r = await fetch(path, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {})
    },
    ...opts
  });

  const data = await r.json().catch(() => ({}));

  if (!r.ok) {
    const err = new Error(data.error || "API_ERROR");
    err.data = data;
    throw err;
  }

  return data;
}

function qs(id) { return document.getElementById(id); }

async function loadMe() {
  try { return await api("/api/me?t=" + Date.now()); }
  catch { return null; }
}

async function requireAuth() {
  const me = await loadMe();
  if (!me) {
    location.href = "/";
    return null;
  }
  if (me.inGuild === false) {
    location.href = "/";
    return null;
  }
  return me;
}

async function logout() {
  await fetch("/auth/logout", { method: "POST", credentials: "include" });
  location.href = "/";
}

function showNotice(id, text, type = "bad") {
  const box = qs(id);
  if (!box) return;
  box.style.display = "block";
  box.className = `notice ${type}`;
  box.textContent = text;
}

function hideNotice(id) {
  const box = qs(id);
  if (!box) return;
  box.style.display = "none";
}
