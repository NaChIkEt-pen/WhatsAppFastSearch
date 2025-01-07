// // Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36
// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//   if (
//     changeInfo.status === "complete" &&
//     tab.url &&
//     tab.url.includes("web.whatsapp.com")
//   ) {
//     chrome.tabs.sendMessage(tabId, { type: "NEW" }, () => {
//       if (chrome.runtime.lastError) {
//         console.error(
//           "Error communicating with content script:",
//           chrome.runtime.lastError.message
//         );
//       }
//     });
//   }
// });
