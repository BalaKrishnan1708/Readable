const READER_PAGE = "http://localhost:5173/reader";

const getActiveTab = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
};

document.getElementById("openSidebar")?.addEventListener("click", async () => {
  const tab = await getActiveTab();
  if (!tab?.id) return;

  try {
    await chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_SIDEBAR" });
  } catch {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    });
    await chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_SIDEBAR" });
  }

  window.close();
});

document.getElementById("openReader")?.addEventListener("click", async () => {
  await chrome.tabs.create({ url: READER_PAGE, active: true });
  window.close();
});
