const script = document.createElement("script");
script.src = chrome.runtime.getURL("page-history-import-hook.js");
script.async = false;
script.addEventListener("load", () => script.remove(), { once: true });
(document.head || document.documentElement).append(script);
