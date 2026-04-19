const els = {
  serverUrl: document.getElementById("serverUrl"),
  token: document.getElementById("token"),
  saveBtn: document.getElementById("saveBtn"),
  syncBtn: document.getElementById("syncBtn"),
  status: document.getElementById("status"),
};

function setStatus(msg, isError = false) {
  els.status.textContent = msg;
  els.status.classList.toggle("error", isError);
}

async function load() {
  const { serverUrl = "", token = "" } = await chrome.storage.local.get([
    "serverUrl",
    "token",
  ]);
  els.serverUrl.value = serverUrl;
  els.token.value = token;
}

els.saveBtn.addEventListener("click", async () => {
  const serverUrl = els.serverUrl.value.trim().replace(/\/$/, "");
  const token = els.token.value.trim();
  if (!serverUrl || !token) {
    setStatus("Server URL and token are required.", true);
    return;
  }
  await chrome.storage.local.set({ serverUrl, token });
  setStatus("Saved.");
});

els.syncBtn.addEventListener("click", async () => {
  els.syncBtn.disabled = true;
  setStatus("Starting sync...");
  try {
    const port = chrome.runtime.connect({ name: "sync" });
    port.onMessage.addListener((m) => {
      if (m.type === "progress") setStatus(m.text);
      if (m.type === "done") {
        setStatus(
          `Done. ${m.seen} seen, ${m.inserted} new, ${m.updated} updated.`,
        );
        els.syncBtn.disabled = false;
      }
      if (m.type === "error") {
        setStatus(m.text, true);
        els.syncBtn.disabled = false;
      }
    });
    port.postMessage({ type: "start" });
  } catch (err) {
    setStatus(String(err), true);
    els.syncBtn.disabled = false;
  }
});

load();
