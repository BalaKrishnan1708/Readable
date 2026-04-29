// ─── Readable Chrome Extension — Background Service Worker ───────────────────
//
// Flow:
//   right-click → background.js opens /reader tab → waits for it to load
//   → injects a tiny script into the page that writes the text to localStorage
//   → ReaderPage reads localStorage on mount → text appears instantly

const READER_PAGE = "http://localhost:5173/reader";

// ── Create context menu ──────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "readable-send",
    title: "📖 Open in Readable",
    contexts: ["selection"],
  });
});

// ── Inject payload into a tab once it finishes loading ───────────────────────
function injectPayload(tabId, payload) {
  chrome.scripting.executeScript({
    target: { tabId },
    func: (p) => {
      // Write to localStorage so the React page reads it on mount
      localStorage.setItem("readablePayload", JSON.stringify(p));
      // Also fire a custom event for an already-mounted page
      window.dispatchEvent(new CustomEvent("readable-payload", { detail: p }));
    },
    args: [payload],
  }).catch((err) => {
    console.error("[Readable] executeScript failed:", err);
  });
}

// ── Context menu click ────────────────────────────────────────────────────────
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== "readable-send") return;

  const text = (info.selectionText || "").trim();
  if (!text) return;

  const payload = {
    text,
    sourceUrl:   tab?.url   || "",
    sourceTitle: tab?.title || "",
    timestamp:   Date.now(),
  };

  // Check for an already-open reader tab
  chrome.tabs.query({ url: READER_PAGE }, (existingTabs) => {
    if (existingTabs.length > 0) {
      // Reuse and focus the existing tab
      const t = existingTabs[0];
      chrome.tabs.update(t.id, { active: true });
      chrome.windows.update(t.windowId, { focused: true });
      // Inject directly — page is already loaded
      injectPayload(t.id, payload);
    } else {
      // Open a fresh reader tab, then inject once it is fully loaded
      chrome.tabs.create({ url: READER_PAGE, active: true }, (newTab) => {
        const onUpdated = (tabId, changeInfo) => {
          if (tabId !== newTab.id || changeInfo.status !== "complete") return;
          chrome.tabs.onUpdated.removeListener(onUpdated);
          injectPayload(tabId, payload);
        };
        chrome.tabs.onUpdated.addListener(onUpdated);
      });
    }
  });
});

// ── Extension Icon Click (Toggle Sidebar) ───────────────────────────────────
chrome.action.onClicked.addListener((tab) => {
  if (!tab.id) return;
  chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_SIDEBAR" }).catch((err) => {
    console.error("Failed to send message to content script:", err);
    // If the content script hasn't loaded (e.g. extension just reloaded), inject it manually
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    }).then(() => {
      chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_SIDEBAR" }).catch(console.error);
    }).catch(console.error);
  });
});
