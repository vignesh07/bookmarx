const els = {
  syncBtn: document.getElementById("syncBtn"),
  status: document.getElementById("status"),
};

function setStatus(msg, isError = false) {
  els.status.textContent = msg;
  els.status.classList.toggle("error", isError);
}

els.syncBtn.addEventListener("click", () => {
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
